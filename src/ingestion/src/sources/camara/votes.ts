import { parse as parseCsv } from "csv-parse/sync";
import { prisma } from "@polar/db";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { toUtcText } from "../toUtcText";
import { fetchCamaraBulkCsv } from "./camaraClient";

const WRITE_BATCH_SIZE = 5000;
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;

const VOTE_CHOICES: Record<string, string> = {
    Sim: "YES",
    Não: "NO",
    Abstenção: "ABSTENTION",
    Obstrução: "OBSTRUCTION",
    "Artigo 17": "ARTICLE_17",
};

const ORIENTATION_CHOICES: Record<string, string> = {
    ...VOTE_CHOICES,
    Liberado: "LIBERATED",
};

const BANCADA_KINDS: Record<string, string> = {
    Governo: "GOVERNMENT",
    Maioria: "MAJORITY",
    Minoria: "MINORITY",
    Oposição: "OPPOSITION",
};

interface RawCamaraVotes {
    votesCsv: string;
    votePropositionsCsv: string;
    individualVotesCsv: string;
    orientationsCsv: string;
}

interface VoteRow {
    id: string;
    uri: string;
    data: string;
    dataHoraRegistro: string;
    siglaOrgao: string;
    aprovacao: string;
    descricao: string;
}

interface VotePropositionRow {
    idVotacao: string;
    proposicao_id: string;
    proposicao_uri: string;
    proposicao_ementa: string;
    proposicao_siglaTipo: string;
    proposicao_numero: string;
    proposicao_ano: string;
}

interface IndividualVoteRow {
    idVotacao: string;
    dataHoraVoto: string;
    voto: string;
    deputado_id: string;
}

interface OrientationRow {
    idVotacao: string;
    siglaBancada: string;
    orientacao: string;
}

interface ParsedCamaraVotes {
    votes: VoteRow[];
    votePropositions: VotePropositionRow[];
    individualVotes: IndividualVoteRow[];
    orientations: OrientationRow[];
}

interface NormalizedCamaraVotes {
    propositions: {
        id: number;
        typeCode: string;
        number: number;
        year: number;
        summary: string;
        sourceUrl: string;
        collectedAt: Date;
    }[];
    votes: {
        id: string;
        occurredAt: Date;
        organAcronym: string;
        description: string;
        approved: boolean | null;
        isNominal: boolean;
        sourceUrl: string;
        collectedAt: Date;
    }[];
    votePropositions: { voteId: string; propositionId: number; collectedAt: Date }[];
    individualVotes: { voteId: string; deputyId: number; choice: string; registeredAt: Date; collectedAt: Date }[];
    orientations: { voteId: string; bancada: string; kind: string; choice: string; collectedAt: Date }[];
}

// source timestamps have no zone and are in Brasília time
function parseBrasiliaDateTime(dateTime: string): Date {
    return new Date(`${dateTime}-03:00`);
}

function mapChoice(choices: Record<string, string>, sourceValue: string): string {
    const choice = choices[sourceValue];
    if (!choice) {
        throw new Error(`camara-votes: unknown choice "${sourceValue}"`);
    }
    return choice;
}

// blocs and federations come as "Bl ..." and "Fdr ...", with names truncated by the source
function mapBancadaKind(bancada: string): string {
    const knownKind = BANCADA_KINDS[bancada];
    if (knownKind) {
        return knownKind;
    }
    return bancada.startsWith("Bl ") || bancada.startsWith("Fdr ") ? "BLOC" : "PARTY";
}

function parseRows<Row>(csv: string): Row[] {
    return parseCsv(csv, { columns: true, delimiter: ";", bom: true }) as Row[];
}

export function createCamaraVotesAdapter(
    year: number,
): SourceAdapter<RawCamaraVotes, ParsedCamaraVotes, NormalizedCamaraVotes> {
    return {
        name: "camara-votes",

        async fetch(): Promise<RawCamaraVotes> {
            return {
                votesCsv: await fetchCamaraBulkCsv("votacoes", year),
                votePropositionsCsv: await fetchCamaraBulkCsv("votacoesProposicoes", year),
                individualVotesCsv: await fetchCamaraBulkCsv("votacoesVotos", year),
                orientationsCsv: await fetchCamaraBulkCsv("votacoesOrientacoes", year),
            };
        },

        // the four related files travel together as one bundle because they depend on each other
        parse(rawData: RawCamaraVotes): ParsedCamaraVotes[] {
            return [
                {
                    votes: parseRows<VoteRow>(rawData.votesCsv),
                    votePropositions: parseRows<VotePropositionRow>(rawData.votePropositionsCsv),
                    individualVotes: parseRows<IndividualVoteRow>(rawData.individualVotesCsv),
                    orientations: parseRows<OrientationRow>(rawData.orientationsCsv),
                },
            ];
        },

        normalize(parsedRecords: ParsedCamaraVotes[], context: CollectionContext): NormalizedCamaraVotes[] {
            const parsed = parsedRecords[0];
            if (!parsed) {
                throw new Error("camara-votes: nothing to normalize");
            }
            const { collectedAt } = context;

            // some votes are published with no choice for every deputy, and the enum has no such value
            const individualVoteRows = parsed.individualVotes.filter((row) => row.voto !== "");
            console.log(
                `camara-votes: skipped ${parsed.individualVotes.length - individualVoteRows.length} individual votes without choice`,
            );

            // a vote is nominal when the source published individual votes for it
            const nominalVoteIds = new Set(individualVoteRows.map((row) => row.idVotacao));

            const votes = parsed.votes.map((row) => ({
                id: row.id,
                occurredAt: parseBrasiliaDateTime(row.dataHoraRegistro || `${row.data}T00:00:00`),
                organAcronym: row.siglaOrgao,
                description: row.descricao,
                approved: row.aprovacao === "" ? null : row.aprovacao === "1",
                isNominal: nominalVoteIds.has(row.id),
                sourceUrl: row.uri,
                collectedAt,
            }));

            const propositionsById = new Map(
                parsed.votePropositions.map((row) => [
                    Number(row.proposicao_id),
                    {
                        id: Number(row.proposicao_id),
                        typeCode: row.proposicao_siglaTipo,
                        number: Number(row.proposicao_numero),
                        year: Number(row.proposicao_ano),
                        summary: row.proposicao_ementa,
                        sourceUrl: row.proposicao_uri,
                        collectedAt,
                    },
                ]),
            );

            const votePropositionsByKey = new Map(
                parsed.votePropositions.map((row) => [
                    `${row.idVotacao}|${row.proposicao_id}`,
                    { voteId: row.idVotacao, propositionId: Number(row.proposicao_id), collectedAt },
                ]),
            );

            const individualVotes = individualVoteRows.map((row) => ({
                voteId: row.idVotacao,
                deputyId: Number(row.deputado_id),
                choice: mapChoice(VOTE_CHOICES, row.voto),
                registeredAt: parseBrasiliaDateTime(row.dataHoraVoto),
                collectedAt,
            }));

            // an empty orientation means the bancada gave none, and the enum has no such value
            const orientations = parsed.orientations
                .filter((row) => row.orientacao !== "")
                .map((row) => ({
                    voteId: row.idVotacao,
                    bancada: row.siglaBancada,
                    kind: mapBancadaKind(row.siglaBancada),
                    choice: mapChoice(ORIENTATION_CHOICES, row.orientacao),
                    collectedAt,
                }));

            return [
                {
                    propositions: [...propositionsById.values()],
                    votes,
                    votePropositions: [...votePropositionsByKey.values()],
                    individualVotes,
                    orientations,
                },
            ];
        },

        async upsert(normalizedRecords: NormalizedCamaraVotes[]) {
            const records = normalizedRecords[0];
            if (!records) {
                throw new Error("camara-votes: nothing to write");
            }

            const knownDeputyIds = new Set((await prisma.deputy.findMany({ select: { id: true } })).map(({ id }) => id));
            const missingDeputyIds = [
                ...new Set(records.individualVotes.map((vote) => vote.deputyId).filter((id) => !knownDeputyIds.has(id))),
            ];
            if (missingDeputyIds.length > 0) {
                throw new Error(
                    `camara-votes: deputies ${missingDeputyIds.join(", ")} are not in the database, run camara-deputies first`,
                );
            }

            // the bulk files have no ordering guarantee, so one transaction keeps the foreign keys consistent
            await prisma.$transaction(
                async (transaction) => {
                    for (const batch of splitIntoBatches(records.propositions, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO propositions (id, type_code, number, year, summary, source_url, collected_at)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.id)}::int[],
                                ${batch.map((row) => row.typeCode)}::text[],
                                ${batch.map((row) => row.number)}::int[],
                                ${batch.map((row) => row.year)}::int[],
                                ${batch.map((row) => row.summary)}::text[],
                                ${batch.map((row) => row.sourceUrl)}::text[],
                                ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                            )
                            ON CONFLICT (id) DO UPDATE SET
                                type_code = EXCLUDED.type_code,
                                number = EXCLUDED.number,
                                year = EXCLUDED.year,
                                summary = EXCLUDED.summary,
                                source_url = EXCLUDED.source_url,
                                collected_at = EXCLUDED.collected_at`;
                    }

                    for (const batch of splitIntoBatches(records.votes, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO votes (id, occurred_at, organ_acronym, description, approved, is_nominal, source_url, collected_at)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.id)}::text[],
                                ${batch.map((row) => toUtcText(row.occurredAt))}::timestamp[],
                                ${batch.map((row) => row.organAcronym)}::text[],
                                ${batch.map((row) => row.description)}::text[],
                                ${batch.map((row) => row.approved)}::boolean[],
                                ${batch.map((row) => row.isNominal)}::boolean[],
                                ${batch.map((row) => row.sourceUrl)}::text[],
                                ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                            )
                            ON CONFLICT (id) DO UPDATE SET
                                occurred_at = EXCLUDED.occurred_at,
                                organ_acronym = EXCLUDED.organ_acronym,
                                description = EXCLUDED.description,
                                approved = EXCLUDED.approved,
                                is_nominal = EXCLUDED.is_nominal,
                                source_url = EXCLUDED.source_url,
                                collected_at = EXCLUDED.collected_at`;
                    }

                    for (const batch of splitIntoBatches(records.votePropositions, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO vote_propositions (vote_id, proposition_id, collected_at)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.voteId)}::text[],
                                ${batch.map((row) => row.propositionId)}::int[],
                                ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                            )
                            ON CONFLICT (vote_id, proposition_id) DO UPDATE SET collected_at = EXCLUDED.collected_at`;
                    }

                    for (const batch of splitIntoBatches(records.individualVotes, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO individual_votes (vote_id, deputy_id, choice, registered_at, collected_at)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.voteId)}::text[],
                                ${batch.map((row) => row.deputyId)}::int[],
                                ${batch.map((row) => row.choice)}::vote_choice[],
                                ${batch.map((row) => toUtcText(row.registeredAt))}::timestamp[],
                                ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                            )
                            ON CONFLICT (vote_id, deputy_id) DO UPDATE SET
                                choice = EXCLUDED.choice,
                                registered_at = EXCLUDED.registered_at,
                                collected_at = EXCLUDED.collected_at`;
                    }

                    for (const batch of splitIntoBatches(records.orientations, WRITE_BATCH_SIZE)) {
                        await transaction.$executeRaw`
                            INSERT INTO vote_orientations (vote_id, bancada, kind, choice, collected_at)
                            SELECT * FROM unnest(
                                ${batch.map((row) => row.voteId)}::text[],
                                ${batch.map((row) => row.bancada)}::text[],
                                ${batch.map((row) => row.kind)}::bancada_kind[],
                                ${batch.map((row) => row.choice)}::orientation_choice[],
                                ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                            )
                            ON CONFLICT (vote_id, bancada) DO UPDATE SET
                                kind = EXCLUDED.kind,
                                choice = EXCLUDED.choice,
                                collected_at = EXCLUDED.collected_at`;
                    }
                },
                { timeout: TRANSACTION_TIMEOUT_MS },
            );

            return {
                insertedOrUpdatedCount:
                    records.propositions.length +
                    records.votes.length +
                    records.votePropositions.length +
                    records.individualVotes.length +
                    records.orientations.length,
            };
        },
    };
}