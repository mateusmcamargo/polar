import { prisma } from "../client";
import { plenaryVotesCte, voteMetricsCtes } from "./voteMetricsSql";

// first day of the votes used by the metrics, see "Metrics" in USE_CASES.md
export const METRICS_START_DATE = "2025-01-01";

export interface ChamberSeat {
    id: number;
    politicalName: string;
    stateCode: string;
    partyAcronym: string | null;
    // plenary roll call votes with a government orientation in which the deputy voted, and how many followed it
    governmentVotes: number;
    governmentAligned: number;
    // plenary roll call votes in which the deputy's party had a clear majority, and how many matched it
    partyVotes: number;
    partyAligned: number;
}

export interface ChamberComposition {
    seats: ChamberSeat[];
    firstVoteAt: Date | null;
    lastVoteAt: Date | null;
    collectedAt: Date | null;
}

interface MetricsRow {
    deputy_id: number;
    government_votes: bigint;
    government_aligned: bigint;
    party_votes: bigint;
    party_aligned: bigint;
}

interface PeriodRow {
    first_vote_at: Date | null;
    last_vote_at: Date | null;
}

async function readMetricsByDeputy(): Promise<Map<number, MetricsRow>> {
    const rows = await prisma.$queryRaw<MetricsRow[]>`
        with ${plenaryVotesCte({ start: METRICS_START_DATE })}, ${voteMetricsCtes({ materialize: false })}
        select cv.deputy_id,
            count(gov.vote_id) as government_votes,
            count(gov.vote_id) filter (where cv.choice = gov.choice) as government_aligned,
            count(pm.vote_id) as party_votes,
            count(pm.vote_id) filter (where cv.choice = pm.choice) as party_aligned
        from cast_votes cv
        left join government_orientations gov on gov.vote_id = cv.vote_id
        left join party_majorities pm on pm.vote_id = cv.vote_id and pm.party_id = cv.party_id
        group by cv.deputy_id
    `;
    return new Map(rows.map((row) => [row.deputy_id, row]));
}

// the 513 deputies in office with their voting metrics, for the hemicycle of the home page
export async function getChamberComposition(): Promise<ChamberComposition> {
    const [deputies, metricsByDeputy, periodRows] = await Promise.all([
        prisma.deputy.findMany({
            where: { isInOffice: true },
            select: {
                id: true,
                politicalName: true,
                stateCode: true,
                collectedAt: true,
                party: { select: { acronym: true } },
            },
        }),
        readMetricsByDeputy(),
        prisma.$queryRaw<PeriodRow[]>`
            select min(occurred_at) as first_vote_at, max(occurred_at) as last_vote_at
            from votes
            where is_nominal and organ_acronym = 'PLEN' and occurred_at >= ${METRICS_START_DATE}::date
        `,
    ]);

    let collectedAt: Date | null = null;
    const seats = deputies.map((deputy) => {
        if (!collectedAt || deputy.collectedAt > collectedAt) {
            collectedAt = deputy.collectedAt;
        }
        const metrics = metricsByDeputy.get(deputy.id);
        return {
            id: deputy.id,
            politicalName: deputy.politicalName,
            stateCode: deputy.stateCode,
            partyAcronym: deputy.party?.acronym ?? null,
            governmentVotes: Number(metrics?.government_votes ?? 0),
            governmentAligned: Number(metrics?.government_aligned ?? 0),
            partyVotes: Number(metrics?.party_votes ?? 0),
            partyAligned: Number(metrics?.party_aligned ?? 0),
        };
    });

    return {
        seats,
        firstVoteAt: periodRows[0]?.first_vote_at ?? null,
        lastVoteAt: periodRows[0]?.last_vote_at ?? null,
        collectedAt,
    };
}