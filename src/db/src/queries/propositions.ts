import { prisma } from "../client";
import { readPlenaryVoteRows, readPropositionSummaries, toPlenaryVote, type PlenaryVote, type PropositionSummary } from "./votes";

export interface PropositionDetail {
    proposition: PropositionSummary & {
        fullTextUrl: string | null;
        statusCollectedAt: Date | null;
        collectedAt: Date;
    };
    // every nominal plenary vote of the proposition, oldest first
    votes: PlenaryVote[];
    // when the votes were collected, the latest of them
    votesCollectedAt: Date;
}

// the proposition with its plenary votes; null when it does not exist or has no nominal plenary vote
export async function getPropositionDetail(propositionId: number): Promise<PropositionDetail | null> {
    const [summaries, extra, voteRows] = await Promise.all([
        readPropositionSummaries([propositionId]),
        prisma.proposition.findUnique({
            where: { id: propositionId },
            select: { fullTextUrl: true, statusCollectedAt: true, collectedAt: true },
        }),
        readPlenaryVoteRows(propositionId),
    ]);
    const summary = summaries.get(propositionId);
    if (!summary || !extra || voteRows.length === 0) {
        return null;
    }

    const votesCollectedAt = voteRows.reduce((latest, row) => (row.collected_at > latest ? row.collected_at : latest), voteRows[0]!.collected_at);
    return {
        proposition: { ...summary, ...extra },
        votes: voteRows.map(toPlenaryVote).reverse(),
        votesCollectedAt,
    };
}