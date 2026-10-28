import { prisma } from "@polar/db";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { extractIdFromUri, fetchCamaraList, fetchCamaraObject } from "./camaraClient";

const CURRENT_LEGISLATURE_ID = 57;
const IN_OFFICE_SITUATION = "Exercício";
const START_OF_LEGISLATURE_SITUATION = "Início da legislatura";
const WRITE_BATCH_SIZE = 100;

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

        // parties first, deputies hold a foreign key to them
        for (const batch of splitIntoBatches(records.parties, WRITE_BATCH_SIZE)) {
            await prisma.$transaction(
                batch.map((party) => prisma.party.upsert({ where: { id: party.id }, create: party, update: party })),
            );
        }
        for (const batch of splitIntoBatches(records.deputies, WRITE_BATCH_SIZE)) {
            await prisma.$transaction(
                batch.map((deputy) =>
                    prisma.deputy.upsert({ where: { id: deputy.id }, create: deputy, update: deputy }),
                ),
            );
        }

        // history rows have no stable key beyond their content, so the whole table is replaced in one transaction
        await prisma.$transaction([
            prisma.deputyStatusChange.deleteMany(),
            prisma.deputyStatusChange.createMany({ data: records.statusChanges }),
        ]);

        return {
            insertedOrUpdatedCount:
                records.parties.length + records.deputies.length + records.statusChanges.length,
        };
    },
};