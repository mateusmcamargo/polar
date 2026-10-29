import { parse as parseCsv } from "csv-parse/sync";
import { prisma } from "@polar/db";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { toUtcText } from "../toUtcText";
import { extractIdFromUri, fetchCamaraBulkCsv, fetchCamaraList } from "./camaraClient";

const LEGISLATURE_START_DATE = "2023-02-01";
const UNKNOWN_ORGAN_KIND = "Não informado";
const WRITE_BATCH_SIZE = 5000;
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;

interface OrganRow {
    uri: string;
    sigla: string;
    nome: string;
    tipoOrgao: string;
}

interface DeputyOrganItem {
    idOrgao: number;
    uriOrgao: string;
    siglaOrgao: string;
    nomeOrgao: string;
    titulo: string;
    dataInicio: string;
    dataFim: string | null;
}

interface RawCamaraOrgans {
    organsCsv: string;
    membershipsByDeputyId: Map<number, DeputyOrganItem[]>;
}

interface ParsedCamaraOrgans {
    organs: OrganRow[];
    membershipsByDeputyId: Map<number, DeputyOrganItem[]>;
}

interface NormalizedCamaraOrgans {
    organs: { id: number; acronym: string; name: string; kind: string; sourceUrl: string; collectedAt: Date }[];
    memberships: {
        organId: number;
        deputyId: number;
        role: string;
        startsAt: Date;
        endsAt: Date | null;
        collectedAt: Date;
    }[];
}

// source timestamps have no zone and are in Brasília time
function parseBrasiliaDateTime(dateTime: string): Date {
    return new Date(`${dateTime}:00-03:00`);
}

function parseRows<Row>(csv: string): Row[] {
    return parseCsv(csv, { columns: true, delimiter: ";", bom: true }) as Row[];
}

// organs come from the bulk file; memberships come from the API, because the
// orgaosDeputados bulk file misses about 8% of them, including current seats
export const camaraOrgansAdapter: SourceAdapter<RawCamaraOrgans, ParsedCamaraOrgans, NormalizedCamaraOrgans> = {
    name: "camara-organs",

    async fetch(): Promise<RawCamaraOrgans> {
        const organsCsv = await fetchCamaraBulkCsv("orgaos");

        const deputies = await prisma.deputy.findMany({ select: { id: true }, orderBy: { id: "asc" } });
        if (deputies.length === 0) {
            throw new Error("camara-organs: no deputies in the database, run camara-deputies first");
        }

        const membershipsByDeputyId = new Map<number, DeputyOrganItem[]>();
        for (const [index, deputy] of deputies.entries()) {
            membershipsByDeputyId.set(
                deputy.id,
                await fetchCamaraList<DeputyOrganItem>(`/deputados/${deputy.id}/orgaos`, {
                    dataInicio: LEGISLATURE_START_DATE,
                }),
            );
            if ((index + 1) % 100 === 0) {
                console.log(`camara-organs: fetched ${index + 1} of ${deputies.length} deputies`);
            }
        }

        return { organsCsv, membershipsByDeputyId };
    },

    // both datasets travel together as one bundle because memberships point to organs
    parse(rawData: RawCamaraOrgans): ParsedCamaraOrgans[] {
        return [{ organs: parseRows<OrganRow>(rawData.organsCsv), membershipsByDeputyId: rawData.membershipsByDeputyId }];
    },

    normalize(parsedRecords: ParsedCamaraOrgans[], context: CollectionContext): NormalizedCamaraOrgans[] {
        const parsed = parsedRecords[0];
        if (!parsed) {
            throw new Error("camara-organs: nothing to normalize");
        }
        const { collectedAt } = context;

        const organsById = new Map<number, NormalizedCamaraOrgans["organs"][number]>();
        for (const row of parsed.organs) {
            const id = extractIdFromUri(row.uri);
            if (id === null) {
                throw new Error(`camara-organs: no id in "${row.uri}"`);
            }
            organsById.set(id, { id, acronym: row.sigla, name: row.nome, kind: row.tipoOrgao, sourceUrl: row.uri, collectedAt });
        }

        const membershipsByKey = new Map<string, NormalizedCamaraOrgans["memberships"][number]>();

        for (const [deputyId, items] of parsed.membershipsByDeputyId) {
            for (const item of items) {
                const endsAt = item.dataFim ? parseBrasiliaDateTime(item.dataFim) : null;

                // a few organs are missing from orgaos.csv, so they are created from the membership
                if (!organsById.has(item.idOrgao)) {
                    console.log(`camara-organs: organ ${item.idOrgao} (${item.siglaOrgao}) missing from orgaos.csv, created from memberships`);
                    organsById.set(item.idOrgao, {
                        id: item.idOrgao,
                        acronym: item.siglaOrgao,
                        name: item.nomeOrgao,
                        kind: UNKNOWN_ORGAN_KIND,
                        sourceUrl: item.uriOrgao,
                        collectedAt,
                    });
                }

                const membership = {
                    organId: item.idOrgao,
                    deputyId,
                    role: item.titulo,
                    startsAt: parseBrasiliaDateTime(item.dataInicio),
                    endsAt,
                    collectedAt,
                };
                // when the source repeats a membership, one open and one with an end date, the ended one is kept
                const key = `${membership.organId}|${deputyId}|${membership.role}|${item.dataInicio}`;
                if (membershipsByKey.get(key)?.endsAt && endsAt === null) {
                    continue;
                }
                membershipsByKey.set(key, membership);
            }
        }

        return [{ organs: [...organsById.values()], memberships: [...membershipsByKey.values()] }];
    },

    async upsert(normalizedRecords: NormalizedCamaraOrgans[]) {
        const records = normalizedRecords[0];
        if (!records) {
            throw new Error("camara-organs: nothing to write");
        }

        await prisma.$transaction(
            async (transaction) => {
                // organs are upserted and never deleted, because events also point to them
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

                // memberships are replaced as a whole, so rows corrected or removed by the source do not linger
                await transaction.organMembership.deleteMany();
                for (const batch of splitIntoBatches(records.memberships, WRITE_BATCH_SIZE)) {
                    await transaction.$executeRaw`
                        INSERT INTO organ_memberships (organ_id, deputy_id, role, starts_at, ends_at, collected_at)
                        SELECT * FROM unnest(
                            ${batch.map((row) => row.organId)}::int[],
                            ${batch.map((row) => row.deputyId)}::int[],
                            ${batch.map((row) => row.role)}::text[],
                            ${batch.map((row) => toUtcText(row.startsAt))}::timestamp[],
                            ${batch.map((row) => (row.endsAt ? toUtcText(row.endsAt) : null))}::timestamp[],
                            ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                        )`;
                }
            },
            { timeout: TRANSACTION_TIMEOUT_MS },
        );

        return { insertedOrUpdatedCount: records.organs.length + records.memberships.length };
    },
};