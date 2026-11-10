import { Prisma } from "../generated/prisma/client";

export interface PlenaryVotesScope {
    // inclusive lower bound and exclusive upper bound of occurred_at, both ISO strings or yyyy-mm-dd
    start: string;
    end?: string;
    // limits the votes to the ones this deputy cast, which keeps the query small for a single profile
    deputyId?: number;
}

// plenary roll call votes in the scope; the CTE is named plenary_votes and must come first in the "with" list
export function plenaryVotesCte(scope: PlenaryVotesScope): Prisma.Sql {
    const deputyJoin =
        scope.deputyId === undefined
            ? Prisma.empty
            : Prisma.sql`join individual_votes own on own.vote_id = v.id and own.deputy_id = ${scope.deputyId}`;
    const deputyFilter = scope.deputyId === undefined ? Prisma.empty : Prisma.sql`and own.choice <> 'ARTICLE_17'`;
    const endFilter = scope.end === undefined ? Prisma.empty : Prisma.sql`and v.occurred_at < ${scope.end}::timestamp`;
    return Prisma.sql`plenary_votes as (
            select v.id, v.occurred_at, v.collected_at from votes v
            ${deputyJoin}
            where v.is_nominal and v.organ_acronym = 'PLEN' and v.occurred_at >= ${scope.start}::timestamp ${endFilter}
                ${deputyFilter}
        )`;
}

// cast_votes, party_choices, party_majorities and government_orientations, to follow plenaryVotesCte in the same "with" list
// each vote counts for the party the deputy had on the day of the vote, taken from the status history
// materialize forces party_majorities and government_orientations to be computed once, which pays off when
// the scope is a single deputy and the planner would otherwise expect a couple of votes instead of hundreds
export function voteMetricsCtes(options: { materialize: boolean }): Prisma.Sql {
    const materialized = options.materialize ? Prisma.sql`materialized` : Prisma.empty;
    return Prisma.sql`cast_votes as (
            select iv.vote_id, pv.occurred_at, iv.deputy_id, iv.choice::text as choice, coalesce(history.party_id, d.party_id) as party_id
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
        ), party_majorities as ${materialized} (
            -- ties and parties with a single voter have no majority
            select vote_id, party_id, min(choice) as choice
            from party_choices
            where position = 1 and party_voters >= 2
            group by vote_id, party_id
            having count(*) = 1
        ), government_orientations as ${materialized} (
            select o.vote_id, o.choice::text as choice
            from vote_orientations o
            join plenary_votes pv on pv.id = o.vote_id
            where o.kind = 'GOVERNMENT' and o.choice <> 'LIBERATED'
        )`;
}