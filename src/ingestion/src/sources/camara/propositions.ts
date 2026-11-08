import { prisma } from "@polar/db";
import type { SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { toUtcText } from "../toUtcText";
import { fetchCamaraObject } from "./camaraClient";

const WRITE_BATCH_SIZE = 5000;
// beyond this the API itself is failing, and the run stops instead of keeping old statuses
const MAX_FAILED_PROPOSITIONS = 10;
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;

interface PropositionDetail {
    statusProposicao: {
        dataHora: string | null;
        descricaoSituacao: string | null;
        despacho: string | null;
    } | null;
    urlInteiroTeor: string | null;
}

interface RawCamaraPropositions {
    detailsByPropositionId: Map<number, PropositionDetail>;
}

interface ParsedProposition {
    id: number;
    situation: string | null;
    situationAt: Date | null;
    dispatch: string | null;
    fullTextUrl: string | null;
}

interface NormalizedProposition extends ParsedProposition {
    statusCollectedAt: Date;
}

// source timestamps have no zone and are in Brasília time
function parseBrasiliaDateTime(dateTime: string): Date {
    return new Date(`${dateTime}:00-03:00`);
}

function emptyToNull(text: string | null | undefined): string | null {
    const trimmed = text?.trim();
    return trimmed ? trimmed : null;
}

// only propositions with a nominal plenary vote have a page, so only those are collected; ids that are not stored as
// propositions have nothing to update
async function readVotedPropositionIds(): Promise<number[]> {
    const rows = await prisma.$queryRaw<{ id: number }[]>`
        select distinct p.id
        from votes v
        join propositions p on p.id = split_part(v.id, '-', 1)::int
        where v.is_nominal and v.organ_acronym = 'PLEN'
        order by 1
    `;
    return rows.map((row) => row.id);
}

export const camaraPropositionsAdapter: SourceAdapter<
    RawCamaraPropositions,
    ParsedProposition,
    NormalizedProposition
> = {
    name: "camara-propositions",

    async fetch(): Promise<RawCamaraPropositions> {
        const propositionIds = await readVotedPropositionIds();
        const detailsByPropositionId = new Map<number, PropositionDetail>();
        const failedIds: number[] = [];

        // one request at a time; fetchCamaraObject already pauses between requests
        for (const propositionId of propositionIds) {
            try {
                detailsByPropositionId.set(propositionId, await fetchCamaraObject<PropositionDetail>(`/proposicoes/${propositionId}`));
            } catch (error) {
                // the status already stored is kept for this proposition
                failedIds.push(propositionId);
                console.log(`camara-propositions: proposition ${propositionId} could not be fetched, keeping the stored status`, error);
                if (failedIds.length > MAX_FAILED_PROPOSITIONS) {
                    throw new Error(`camara-propositions: more than ${MAX_FAILED_PROPOSITIONS} propositions failed (${failedIds.join(", ")})`);
                }
            }
        }

        return { detailsByPropositionId };
    },

    parse(rawData: RawCamaraPropositions): ParsedProposition[] {
        return [...rawData.detailsByPropositionId].map(([id, detail]) => {
            const status = detail.statusProposicao;
            return {
                id,
                situation: emptyToNull(status?.descricaoSituacao),
                situationAt: status?.dataHora ? parseBrasiliaDateTime(status.dataHora) : null,
                dispatch: emptyToNull(status?.despacho),
                fullTextUrl: emptyToNull(detail.urlInteiroTeor),
            };
        });
    },

    normalize(parsedRecords, context): NormalizedProposition[] {
        return parsedRecords.map((record) => ({ ...record, statusCollectedAt: context.collectedAt }));
    },

    async upsert(normalizedRecords) {
        if (normalizedRecords.length === 0) {
            throw new Error("camara-propositions: nothing to write");
        }

        let updatedCount = 0;
        await prisma.$transaction(
            async (transaction) => {
                for (const batch of splitIntoBatches(normalizedRecords, WRITE_BATCH_SIZE)) {
                    updatedCount += await transaction.$executeRaw`
                        UPDATE propositions AS p SET
                            situation = t.situation,
                            situation_at = t.situation_at,
                            dispatch = t.dispatch,
                            full_text_url = t.full_text_url,
                            status_collected_at = t.status_collected_at
                        FROM unnest(
                            ${batch.map((row) => row.id)}::int[],
                            ${batch.map((row) => row.situation)}::text[],
                            ${batch.map((row) => (row.situationAt ? toUtcText(row.situationAt) : null))}::timestamp[],
                            ${batch.map((row) => row.dispatch)}::text[],
                            ${batch.map((row) => row.fullTextUrl)}::text[],
                            ${batch.map((row) => toUtcText(row.statusCollectedAt))}::timestamp[]
                        ) AS t(id, situation, situation_at, dispatch, full_text_url, status_collected_at)
                        WHERE p.id = t.id`;
                }
            },
            { timeout: TRANSACTION_TIMEOUT_MS },
        );

        return { insertedOrUpdatedCount: updatedCount };
    },
};