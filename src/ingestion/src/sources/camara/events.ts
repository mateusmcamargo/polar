import { parse as parseCsv } from "csv-parse/sync";
import { prisma } from "@polar/db";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { toUtcText } from "../toUtcText";
import { fetchCamaraBulkCsv, fetchCamaraObject } from "./camaraClient";

const WRITE_BATCH_SIZE = 5000;
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;

interface OrganDetail {
    id: number;
    uri: string;
    sigla: string;
    nome: string;
    tipoOrgao: string;
}

interface RawCamaraEvents {
    eventsCsv: string;
    eventOrgansCsv: string;
    attendancesCsv: string;
    missingOrgans: OrganDetail[];
}

interface EventRow {
    id: string;
    uri: string;
    dataHoraInicio: string;
    dataHoraFim: string;
    situacao: string;
    descricao: string;
    descricaoTipo: string;
}

interface EventOrganRow {
    idEvento: string;
    idOrgao: string;
}

interface AttendanceRow {
    idEvento: string;
    idDeputado: string;
}

interface ParsedCamaraEvents {
    events: EventRow[];
    eventOrgans: EventOrganRow[];
    attendances: AttendanceRow[];
    missingOrgans: OrganDetail[];
}

interface NormalizedCamaraEvents {
    organs: { id: number; acronym: string; name: string; kind: string; sourceUrl: string; collectedAt: Date }[];
    events: {
        id: number;
        startsAt: Date;
        endsAt: Date | null;
        typeName: string;
        situation: string;
        description: string;
        sourceUrl: string;
        collectedAt: Date;
    }[];
    eventOrgans: { eventId: number; organId: number }[];
    attendances: { eventId: number; deputyId: number; collectedAt: Date }[];
}

// source timestamps have no zone and are in Brasília time
function parseBrasiliaDateTime(dateTime: string): Date {
    return new Date(`${dateTime}-03:00`);
}

function parseRows<Row>(csv: string): Row[] {
    return parseCsv(csv, { columns: true, delimiter: ";", bom: true }) as Row[];
}

export function createCamaraEventsAdapter(
    year: number,
): SourceAdapter<RawCamaraEvents, ParsedCamaraEvents, NormalizedCamaraEvents> {
    return {
        name: "camara-events",

        async fetch(): Promise<RawCamaraEvents> {
            const knownOrganIds = new Set((await prisma.organ.findMany({ select: { id: true } })).map(({ id }) => id));
            if (knownOrganIds.size === 0) {
                throw new Error("camara-events: no organs in the database, run camara-organs first");
            }

            const eventsCsv = await fetchCamaraBulkCsv("eventos", year);
            const eventOrgansCsv = await fetchCamaraBulkCsv("eventosOrgaos", year);
            const attendancesCsv = await fetchCamaraBulkCsv("eventosPresencaDeputados", year);

            // a few organs, such as the Congresso Nacional, are missing from orgaos.csv, so their details come from the API
            const missingOrganIds = [
                ...new Set(parseRows<EventOrganRow>(eventOrgansCsv).map((row) => Number(row.idOrgao))),
            ].filter((id) => !knownOrganIds.has(id));
            const missingOrgans: OrganDetail[] = [];
            for (const organId of missingOrganIds) {
                missingOrgans.push(await fetchCamaraObject<OrganDetail>(`/orgaos/${organId}`));
            }

            return { eventsCsv, eventOrgansCsv, attendancesCsv, missingOrgans };
        },

        // the three related files travel together as one bundle because they depend on each other
        parse(rawData: RawCamaraEvents): ParsedCamaraEvents[] {
            return [
                {
                    events: parseRows<EventRow>(rawData.eventsCsv),
                    eventOrgans: parseRows<EventOrganRow>(rawData.eventOrgansCsv),
                    attendances: parseRows<AttendanceRow>(rawData.attendancesCsv),
                    missingOrgans: rawData.missingOrgans,
                },
            ];
        },

        normalize(parsedRecords: ParsedCamaraEvents[], context: CollectionContext): NormalizedCamaraEvents[] {
            const parsed = parsedRecords[0];
            if (!parsed) {
                throw new Error("camara-events: nothing to normalize");
            }
            const { collectedAt } = context;

            const organs = parsed.missingOrgans.map((organ) => ({
                id: organ.id,
                acronym: organ.sigla,
                name: organ.nome,
                kind: organ.tipoOrgao,
                sourceUrl: organ.uri,
                collectedAt,
            }));

            const events = parsed.events.map((row) => ({
                id: Number(row.id),
                startsAt: parseBrasiliaDateTime(row.dataHoraInicio),
                endsAt: row.dataHoraFim === "" ? null : parseBrasiliaDateTime(row.dataHoraFim),
                typeName: row.descricaoTipo,
                situation: row.situacao,
                description: row.descricao,
                sourceUrl: row.uri,
                collectedAt,
            }));
            const eventIds = new Set(events.map((event) => event.id));

            const eventOrgans = parsed.eventOrgans.map((row) => ({
                eventId: Number(row.idEvento),
                organId: Number(row.idOrgao),
            }));

            // old ids of joint meetings, merged by the source into another event, have no row in the events file
            const attendances = parsed.attendances
                .filter((row) => eventIds.has(Number(row.idEvento)))
                .map((row) => ({ eventId: Number(row.idEvento), deputyId: Number(row.idDeputado), collectedAt }));
            console.log(
                `camara-events: skipped ${parsed.attendances.length - attendances.length} attendances of events missing from the events file`,
            );

            return [{ organs, events, eventOrgans, attendances }];
        },

        async upsert(normalizedRecords: NormalizedCamaraEvents[]) {
            const records = normalizedRecords[0];
            if (!records) {
                throw new Error("camara-events: nothing to write");
            }

            const knownDeputyIds = new Set((await prisma.deputy.findMany({ select: { id: true } })).map(({ id }) => id));
            if (knownDeputyIds.size === 0) {
                throw new Error("camara-events: no deputies in the database, run camara-deputies first");
            }
            // former deputies of earlier legislatures attend events as guests and are out of scope
            const attendances = records.attendances.filter((row) => knownDeputyIds.has(row.deputyId));
            console.log(
                `camara-events: skipped ${records.attendances.length - attendances.length} attendances of deputies outside the legislature`,
            );

            const yearStart = toUtcText(parseBrasiliaDateTime(`${year}-01-01T00:00:00`));
            const nextYearStart = toUtcText(parseBrasiliaDateTime(`${year + 1}-01-01T00:00:00`));
            const eventIds = records.events.map((event) => event.id);

            // the year is replaced as a whole, so events and attendances removed by the source do not linger
            await prisma.$transaction(
                async (transaction) => {
                    for (const batch of splitIntoBatches(records.organs, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO organs (id, acronym, name, kind, source_url, collected_at)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.id)}::int[],
                                ${batch.map((row) => row.acronym)}::text[],
                                ${batch.map((row) => row.name)}::text[],
                                ${batch.map((row) => row.kind)}::text[],
                                ${batch.map((row) => row.sourceUrl)}::text[],
                                ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                            )
                            ON CONFLICT (id) DO UPDATE SET
                                acronym = EXCLUDED.acronym,
                                name = EXCLUDED.name,
                                kind = EXCLUDED.kind,
                                source_url = EXCLUDED.source_url,
                                collected_at = EXCLUDED.collected_at`;
                    }

                    // events of the year, plus any event of the files that the source dated in another year
                    await transaction.$executeRaw`
                        DELETE FROM event_attendances WHERE event_id IN (
                            SELECT id FROM events
                            WHERE (starts_at >= ${yearStart}::timestamp AND starts_at < ${nextYearStart}::timestamp)
                                OR id = ANY(${eventIds}::int[])
                        )`;
                    await transaction.$executeRaw`
                        DELETE FROM event_organs WHERE event_id IN (
                            SELECT id FROM events
                            WHERE (starts_at >= ${yearStart}::timestamp AND starts_at < ${nextYearStart}::timestamp)
                                OR id = ANY(${eventIds}::int[])
                        )`;
                    await transaction.$executeRaw`
                        DELETE FROM events
                        WHERE (starts_at >= ${yearStart}::timestamp AND starts_at < ${nextYearStart}::timestamp)
                            OR id = ANY(${eventIds}::int[])`;

                    for (const batch of splitIntoBatches(records.events, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO events (id, starts_at, ends_at, type_name, situation, description, source_url, collected_at)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.id)}::int[],
                                ${batch.map((row) => toUtcText(row.startsAt))}::timestamp[],
                                ${batch.map((row) => (row.endsAt ? toUtcText(row.endsAt) : null))}::timestamp[],
                                ${batch.map((row) => row.typeName)}::text[],
                                ${batch.map((row) => row.situation)}::text[],
                                ${batch.map((row) => row.description)}::text[],
                                ${batch.map((row) => row.sourceUrl)}::text[],
                                ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                            )`;
                    }

                    for (const batch of splitIntoBatches(records.eventOrgans, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO event_organs (event_id, organ_id)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.eventId)}::int[],
                                ${batch.map((row) => row.organId)}::int[]
                            )`;
                    }

                    for (const batch of splitIntoBatches(attendances, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO event_attendances (event_id, deputy_id, collected_at)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.eventId)}::int[],
                                ${batch.map((row) => row.deputyId)}::int[],
                                ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                            )`;
                    }
                },
                { timeout: TRANSACTION_TIMEOUT_MS },
            );

            return {
                insertedOrUpdatedCount:
                    records.organs.length + records.events.length + records.eventOrgans.length + attendances.length,
            };
        },
    };
}