import { prisma } from "../client";

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

// each vote counts for the party the deputy had on the day of the vote, taken from the status history
async function readMetricsByDeputy(): Promise<Map<number, MetricsRow>> {
    const rows = await prisma.$queryRaw<MetricsRow[]>`
        with plenary_votes as (
            select id, occurred_at from votes
            where is_nominal and organ_acronym = 'PLEN' and occurred_at >= ${METRICS_START_DATE}::date
        ), cast_votes as (
            select iv.vote_id, iv.deputy_id, iv.choice::text as choice, coalesce(history.party_id, d.party_id) as party_id
            from individual_votes iv
            join plenary_votes pv on pv.id = iv.vote_id
            join deputies d on d.id = iv.deputy_id
            left join lateral (
                select s.party_id from deputy_status_changes s
                where s.deputy_id = iv.deputy_id and s.changed_at <= pv.occurred_at
                order by s.changed_at desc
                limit 1
            ) history on true
            where iv.choice <> 'ARTICLE_17'
        ), party_choices as (
            select vote_id, party_id, choice,
                rank() over (partition by vote_id, party_id order by count(*) desc) as position,
                sum(count(*)) over (partition by vote_id, party_id) as party_voters
            from cast_votes
            where party_id is not null
            group by vote_id, party_id, choice
        ), party_majorities as (
            -- ties and parties with a single voter have no majority
            select vote_id, party_id, min(choice) as choice
            from party_choices
            where position = 1 and party_voters >= 2
            group by vote_id, party_id
            having count(*) = 1
        ), government_orientations as (
            select o.vote_id, o.choice::text as choice
            from vote_orientations o
            join plenary_votes pv on pv.id = o.vote_id
            where o.kind = 'GOVERNMENT' and o.choice <> 'LIBERATED'
        )
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