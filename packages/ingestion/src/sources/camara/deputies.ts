import { prisma } from "@polar/db";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { toUtcText } from "../toUtcText";
import { extractIdFromUri, fetchCamaraList, fetchCamaraObject } from "./camaraClient";

const CURRENT_LEGISLATURE_ID = 57;
const IN_OFFICE_SITUATION = "Exercício";
const START_OF_LEGISLATURE_SITUATION = "Início da legislatura";
const WRITE_BATCH_SIZE = 5000;
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;

interface PartyListItem {
    id: number;
    sigla: string;
    nome: string;
    uri: string;
}

interface DeputyListItem {
    id: number;
    uri: string;
    nome: string;
    uriPartido: string | null;
    siglaUf: string;
    urlFoto: string | null;
}

interface DeputyDetail {
    nomeCivil: string | null;
    ultimoStatus: { situacao: string | null };
}

interface DeputyHistoryItem {
    dataHora: string;
    situacao: string | null;
    condicaoEleitoral: string | null;
    uriPartido: string | null;
    siglaUf: string;
}

interface RawCamaraDeputies {
    parties: PartyListItem[];
    deputies: DeputyListItem[];
    detailsByDeputyId: Map<number, DeputyDetail>;
    historyByDeputyId: Map<number, DeputyHistoryItem[]>;
}

interface NormalizedParty {
    id: number;
    acronym: string;
    name: string;
    sourceUrl: string;
    collectedAt: Date;
}

interface NormalizedDeputy {
    id: number;
    politicalName: string;
    civilName: string | null;
    searchName: string;
    photoUrl: string | null;
    stateCode: string;
    partyId: number | null;
    isInOffice: boolean;
    sourceUrl: string;
    collectedAt: Date;
}

interface NormalizedStatusChange {
    deputyId: number;
    changedAt: Date;
    situation: string;
    condition: string;
    partyId: number | null;
    stateCode: string;
    collectedAt: Date;
}

interface NormalizedCamaraDeputies {
    parties: NormalizedParty[];
    deputies: NormalizedDeputy[];
    statusChanges: NormalizedStatusChange[];
}

function buildSearchName(...names: (string | null)[]): string {
    return names
        .filter((name): name is string => Boolean(name))
        .join(" ")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase();
}

// source timestamps have no zone and are in Brasília time
function parseBrasiliaDateTime(dateTime: string): Date {
    return new Date(`${dateTime}:00-03:00`);
}

export const camaraDeputiesAdapter: SourceAdapter<
    RawCamaraDeputies,
    RawCamaraDeputies,
    NormalizedCamaraDeputies
> = {
    name: "camara-deputies",

    async fetch(): Promise<RawCamaraDeputies> {
        const legislatureQuery = { idLegislatura: CURRENT_LEGISLATURE_ID };
        const parties = await fetchCamaraList<PartyListItem>("/partidos", legislatureQuery);
        const deputyListRows = await fetchCamaraList<DeputyListItem>("/deputados", legislatureQuery);
        // the list repeats a deputy once per party or state change, and the last row is the current one
        const deputies = [...new Map(deputyListRows.map((row) => [row.id, row])).values()];

        const detailsByDeputyId = new Map<number, DeputyDetail>();
        const historyByDeputyId = new Map<number, DeputyHistoryItem[]>();
        for (const [index, deputy] of deputies.entries()) {
            detailsByDeputyId.set(deputy.id, await fetchCamaraObject<DeputyDetail>(`/deputados/${deputy.id}`));
            historyByDeputyId.set(
                deputy.id,
                await fetchCamaraObject<DeputyHistoryItem[]>(`/deputados/${deputy.id}/historico`),
            );
            if ((index + 1) % 100 === 0) {
                console.log(`camara-deputies: fetched ${index + 1} of ${deputies.length} deputies`);
            }
        }

        return { parties, deputies, detailsByDeputyId, historyByDeputyId };
    },

    // the API already answers typed JSON, so there is nothing to convert; the three related
    // datasets travel together as one bundle because deputies depend on parties
    parse(rawData: RawCamaraDeputies): RawCamaraDeputies[] {
        return [rawData];
    },

    normalize(parsedRecords: RawCamaraDeputies[], context: CollectionContext): NormalizedCamaraDeputies[] {
        const rawData = parsedRecords[0];
        if (!rawData) {
            throw new Error("camara-deputies: nothing to normalize");
        }
        const { collectedAt } = context;
        const knownPartyIds = new Set(rawData.parties.map((party) => party.id));

        const parties = rawData.parties.map((party) => ({
            id: party.id,
            acronym: party.sigla,
            name: party.nome,
            sourceUrl: party.uri,
            collectedAt,
        }));

        const deputies = rawData.deputies.map((deputy) => {
            const detail = rawData.detailsByDeputyId.get(deputy.id);
            const partyId = extractIdFromUri(deputy.uriPartido);
            return {
                id: deputy.id,
                politicalName: deputy.nome,
                civilName: detail?.nomeCivil ?? null,
                searchName: buildSearchName(deputy.nome, detail?.nomeCivil ?? null),
                photoUrl: deputy.urlFoto,
                stateCode: deputy.siglaUf,
                partyId: partyId !== null && knownPartyIds.has(partyId) ? partyId : null,
                isInOffice: detail?.ultimoStatus.situacao === IN_OFFICE_SITUATION,
                sourceUrl: deputy.uri,
                collectedAt,
            };
        });

        // the entry without situation is the party and name at the start of the legislature
        const statusChangesByKey = new Map<string, NormalizedStatusChange>();
        for (const [deputyId, history] of rawData.historyByDeputyId) {
            for (const entry of history) {
                const statusChange = {
                    deputyId,
                    changedAt: parseBrasiliaDateTime(entry.dataHora),
                    situation: entry.situacao ?? START_OF_LEGISLATURE_SITUATION,
                    condition: entry.condicaoEleitoral ?? "",
                    partyId: extractIdFromUri(entry.uriPartido),
                    stateCode: entry.siglaUf,
                    collectedAt,
                };
                const key = `${deputyId}|${statusChange.changedAt.toISOString()}|${statusChange.situation}`;
                statusChangesByKey.set(key, statusChange);
            }
        }

        return [{ parties, deputies, statusChanges: [...statusChangesByKey.values()] }];
    },

    async upsert(normalizedRecords: NormalizedCamaraDeputies[]) {
        const records = normalizedRecords[0];
        if (!records) {
            throw new Error("camara-deputies: nothing to write");
        }

        // one statement per batch, because a round trip per row exceeds the transaction timeout on a remote database
        await prisma.$transaction(
            async (transaction) => {
                // parties first, deputies hold a foreign key to them
                for (const batch of splitIntoBatches(records.parties, WRITE_BATCH_SIZE)) {
                    await transaction.$executeRaw`
                        INSERT INTO parties (id, acronym, name, source_url, collected_at)
                        SELECT * FROM unnest(
                            ${batch.map((row) => row.id)}::int[],
                            ${batch.map((row) => row.acronym)}::text[],
                            ${batch.map((row) => row.name)}::text[],
                            ${batch.map((row) => row.sourceUrl)}::text[],
                            ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                        )
                        ON CONFLICT (id) DO UPDATE SET
                            acronym = EXCLUDED.acronym,
                            name = EXCLUDED.name,
                            source_url = EXCLUDED.source_url,
                            collected_at = EXCLUDED.collected_at`;
                }

                for (const batch of splitIntoBatches(records.deputies, WRITE_BATCH_SIZE)) {
                    await transaction.$executeRaw`
                        INSERT INTO deputies (id, political_name, civil_name, search_name, photo_url, state_code, party_id, is_in_office, source_url, collected_at)
                        SELECT * FROM unnest(
                            ${batch.map((row) => row.id)}::int[],
                            ${batch.map((row) => row.politicalName)}::text[],
                            ${batch.map((row) => row.civilName)}::text[],
                            ${batch.map((row) => row.searchName)}::text[],
                            ${batch.map((row) => row.photoUrl)}::text[],
                            ${batch.map((row) => row.stateCode)}::text[],
                            ${batch.map((row) => row.partyId)}::int[],
                            ${batch.map((row) => row.isInOffice)}::boolean[],
                            ${batch.map((row) => row.sourceUrl)}::text[],
                            ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                        )
                        ON CONFLICT (id) DO UPDATE SET
                            political_name = EXCLUDED.political_name,
                            civil_name = EXCLUDED.civil_name,
                            search_name = EXCLUDED.search_name,
                            photo_url = EXCLUDED.photo_url,
                            state_code = EXCLUDED.state_code,
                            party_id = EXCLUDED.party_id,
                            is_in_office = EXCLUDED.is_in_office,
                            source_url = EXCLUDED.source_url,
                            collected_at = EXCLUDED.collected_at`;
                }

                // history rows have no stable key beyond their content, so the whole table is replaced
                await transaction.deputyStatusChange.deleteMany();
                for (const batch of splitIntoBatches(records.statusChanges, WRITE_BATCH_SIZE)) {
                    await transaction.deputyStatusChange.createMany({ data: batch });
                }
            },
            { timeout: TRANSACTION_TIMEOUT_MS },
        );

        return {
            insertedOrUpdatedCount:
                records.parties.length + records.deputies.length + records.statusChanges.length,
        };
    },
};