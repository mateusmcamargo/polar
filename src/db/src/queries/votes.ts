import { prisma } from "../client";

const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

// a deputy counts as in office on the day of a vote when the latest status change up to that moment is one of these;
// "CONVOCADO" is a substitute called to take the seat, who already votes (checked on 2026-11-06 against 5 votes of 2025,
// which gave 511 to 514 deputies against 513 seats); the voters are always added on top, for same day leaves
const IN_OFFICE_SITUATIONS = ["Exercício", "CONVOCADO"];

export interface VoteCounts {
    yes: number;
    no: number;
    abstention: number;
    obstruction: number;
}

export interface PropositionSummary {
    id: number;
    typeCode: string;
    number: number;
    year: number;
    summary: string;
    sourceUrl: string;
    // official status as the Câmara published it, null until the camara-propositions adapter has collected it
    situation: string | null;
    situationAt: Date | null;
    dispatch: string | null;
}

export interface PlenaryVote {
    id: string;
    occurredAt: Date;
    description: string;
    approved: boolean | null;
    counts: VoteCounts;
}

// every nominal plenary vote of one proposition, newest first
export interface PlenaryVoteGroup {
    proposition: PropositionSummary | null;
    votes: PlenaryVote[];
}

export interface PlenaryVoteGroupList {
    groups: PlenaryVoteGroup[];
    // years with votes, newest first
    years: number[];
    collectedAt: Date | null;
}

export interface VoteOrientationRow {
    bancada: string;
    kind: "PARTY" | "BLOC" | "GOVERNMENT" | "MAJORITY" | "MINORITY" | "OPPOSITION";
    choice: string;
}

export const NOT_VOTED = "NOT_VOTED";

export interface VoteSeat {
    deputyId: number;
    politicalName: string;
    photoUrl: string | null;
    stateCode: string;
    // party on the day of the vote, from the status history; null when the deputy had none
    partyAcronym: string | null;
    // YES, NO, ABSTENTION, OBSTRUCTION, ARTICLE_17 or NOT_VOTED
    choice: string;
}

export interface VoteDetail {
    id: string;
    occurredAt: Date;
    description: string;
    approved: boolean | null;
    sourceUrl: string;
    collectedAt: Date;
    propositions: PropositionSummary[];
    orientations: VoteOrientationRow[];
    seats: VoteSeat[];
    counts: VoteCounts;
    notVoted: number;
    // every nominal plenary vote of the same proposition, oldest first, including this one
    propositionVotes: PlenaryVote[];
}

export interface DeputyYearVote {
    id: string;
    occurredAt: Date;
    description: string;
    approved: boolean | null;
    sourceUrl: string;
    // YES, NO, ABSTENTION, OBSTRUCTION, ARTICLE_17 or NOT_VOTED
    choice: string;
    // orientation of the government leadership, null when there was none
    governmentOrientation: string | null;
    // choice of the majority of the deputy's party that day, null when it had no clear majority
    partyMajority: string | null;
}

export interface DeputyYearVoteGroup {
    proposition: PropositionSummary | null;
    votes: DeputyYearVote[];
}

export interface DeputyYearVotes {
    groups: DeputyYearVoteGroup[];
    voted: number;
    notVoted: number;
    collectedAt: Date | null;
}

// bounds of a year in Brasília time, as UTC text for the timestamp columns, which hold UTC without a zone
export function yearRange(year: number): { start: string; end: string } {
    return {
        start: new Date(`${year}-01-01T00:00:00-03:00`).toISOString(),
        end: new Date(`${year + 1}-01-01T00:00:00-03:00`).toISOString(),
    };
}

function yearOf(date: Date): number {
    return Number(new Intl.DateTimeFormat("en-CA", { timeZone: SAO_PAULO_TIME_ZONE, year: "numeric" }).format(date));
}

// the prefix of a Câmara vote id is the id of the proposition being discussed
export function propositionIdOf(voteId: string): number {
    return Number.parseInt(voteId.split("-")[0] ?? "", 10);
}

// every item of one proposition becomes one group; the input comes newest first, so the groups end up ordered by their
// most recent item and the items of each group stay newest first
export function groupByProposition<Item extends { id: string }>(items: Item[]): { propositionId: number; items: Item[] }[] {
    const groups = new Map<number, Item[]>();
    for (const item of items) {
        const propositionId = propositionIdOf(item.id);
        const group = groups.get(propositionId);
        if (group) {
            group.push(item);
        } else {
            groups.set(propositionId, [item]);
        }
    }
    return [...groups].map(([propositionId, groupItems]) => ({ propositionId, items: groupItems }));
}

export async function readPropositionSummaries(propositionIds: number[]): Promise<Map<number, PropositionSummary>> {
    const propositions = await prisma.proposition.findMany({
        where: { id: { in: propositionIds } },
        select: {
            id: true,
            typeCode: true,
            number: true,
            year: true,
            summary: true,
            sourceUrl: true,
            situation: true,
            situationAt: true,
            dispatch: true,
        },
    });
    return new Map(propositions.map((proposition) => [proposition.id, proposition]));
}

export interface VoteCountsRow {
    id: string;
    occurred_at: Date;
    description: string;
    approved: boolean | null;
    collected_at: Date;
    yes: bigint;
    no: bigint;
    abstention: bigint;
    obstruction: bigint;
}

export function toPlenaryVote(row: VoteCountsRow): PlenaryVote {
    return {
        id: row.id,
        occurredAt: row.occurred_at,
        description: row.description,
        approved: row.approved,
        counts: {
            yes: Number(row.yes),
            no: Number(row.no),
            abstention: Number(row.abstention),
            obstruction: Number(row.obstruction),
        },
    };
}

// nominal plenary votes, newest first, with the counts taken from the individual votes; all of them, or only those of
// one proposition when its id is given
export async function readPlenaryVoteRows(propositionId: number | null): Promise<VoteCountsRow[]> {
    const idPattern = propositionId === null ? null : `${propositionId}-%`;
    return prisma.$queryRaw<VoteCountsRow[]>`
        select v.id, v.occurred_at, v.description, v.approved, v.collected_at,
            count(*) filter (where iv.choice = 'YES') as yes,
            count(*) filter (where iv.choice = 'NO') as no,
            count(*) filter (where iv.choice = 'ABSTENTION') as abstention,
            count(*) filter (where iv.choice = 'OBSTRUCTION') as obstruction
        from votes v
        left join individual_votes iv on iv.vote_id = v.id
        where v.is_nominal and v.organ_acronym = 'PLEN' and (${idPattern}::text is null or v.id like ${idPattern}::text)
        group by v.id
        order by v.occurred_at desc, v.id desc
    `;
}

// every nominal plenary vote grouped by proposition, newest first
export async function listPlenaryVoteGroups(): Promise<PlenaryVoteGroupList> {
    const rows = await readPlenaryVoteRows(null);

    const groups = groupByProposition(rows.map(toPlenaryVote));
    const propositions = await readPropositionSummaries(groups.map((group) => group.propositionId));
    const years = [...new Set(rows.map((row) => yearOf(row.occurred_at)))].sort((first, second) => second - first);
    const collectedAt = rows.reduce<Date | null>((latest, row) => (!latest || row.collected_at > latest ? row.collected_at : latest), null);

    return {
        groups: groups.map((group) => ({ proposition: propositions.get(group.propositionId) ?? null, votes: group.items })),
        years,
        collectedAt,
    };
}

interface VoteRow {
    id: string;
    occurred_at: Date;
    description: string;
    approved: boolean | null;
    source_url: string;
    collected_at: Date;
}

interface SeatRow {
    deputy_id: number;
    political_name: string;
    photo_url: string | null;
    state_code: string;
    party_acronym: string | null;
    choice: string;
}

// one vote with its orientations and one seat per deputy who voted or was in office on the day; null when the id is not
// a nominal plenary vote
export async function getVoteDetail(voteId: string): Promise<VoteDetail | null> {
    const voteRows = await prisma.$queryRaw<VoteRow[]>`
        select id, occurred_at, description, approved, source_url, collected_at from votes
        where id = ${voteId} and is_nominal and organ_acronym = 'PLEN'
    `;
    const vote = voteRows[0];
    if (!vote) {
        return null;
    }

    const propositionId = propositionIdOf(vote.id);
    const [links, orientations, seatRows, propositionRows] = await Promise.all([
        prisma.voteProposition.findMany({ where: { voteId }, select: { propositionId: true } }),
        prisma.voteOrientation.findMany({ where: { voteId }, select: { bancada: true, kind: true, choice: true } }),
        prisma.$queryRaw<SeatRow[]>`
            with on_the_day as (
                select distinct on (s.deputy_id) s.deputy_id, s.situation, s.party_id, s.state_code
                from deputy_status_changes s
                where s.changed_at <= ${vote.occurred_at}
                order by s.deputy_id, s.changed_at desc
            ), seat_deputies as (
                select deputy_id from on_the_day where situation = any(${IN_OFFICE_SITUATIONS})
                union
                select deputy_id from individual_votes where vote_id = ${voteId}
            )
            select d.id as deputy_id, d.political_name, d.photo_url,
                coalesce(h.state_code, d.state_code) as state_code,
                p.acronym as party_acronym,
                coalesce(iv.choice::text, ${NOT_VOTED}) as choice
            from seat_deputies sd
            join deputies d on d.id = sd.deputy_id
            left join on_the_day h on h.deputy_id = d.id
            left join parties p on p.id = coalesce(h.party_id, d.party_id)
            left join individual_votes iv on iv.vote_id = ${voteId} and iv.deputy_id = d.id
            order by d.political_name
        `,
        readPlenaryVoteRows(propositionId),
    ]);

    const propositionIds = new Set([propositionId, ...links.map((link) => link.propositionId)]);
    const propositions = await readPropositionSummaries([...propositionIds]);
    const seats: VoteSeat[] = seatRows.map((row) => ({
        deputyId: row.deputy_id,
        politicalName: row.political_name,
        photoUrl: row.photo_url,
        stateCode: row.state_code,
        partyAcronym: row.party_acronym,
        choice: row.choice,
    }));
    const count = (choice: string) => seats.filter((seat) => seat.choice === choice).length;

    return {
        id: vote.id,
        occurredAt: vote.occurred_at,
        description: vote.description,
        approved: vote.approved,
        sourceUrl: vote.source_url,
        collectedAt: vote.collected_at,
        propositions: [...propositionIds].flatMap((id) => propositions.get(id) ?? []),
        orientations,
        seats,
        counts: { yes: count("YES"), no: count("NO"), abstention: count("ABSTENTION"), obstruction: count("OBSTRUCTION") },
        notVoted: count(NOT_VOTED),
        propositionVotes: propositionRows.map(toPlenaryVote).reverse(),
    };
}

interface DeputyYearVoteRow {
    id: string;
    occurred_at: Date;
    description: string;
    approved: boolean | null;
    source_url: string;
    collected_at: Date;
    choice: string | null;
    government_orientation: string | null;
    party_majority: string | null;
}

// every nominal plenary vote of the year the deputy cast or, being in office that day, did not cast; the party majority
// uses the same rule as the "Com o partido" metric (party on the day of the vote, ties and single voters have none)
export async function getDeputyVotes(deputyId: number, year: number): Promise<DeputyYearVotes> {
    const { start, end } = yearRange(year);
    const rows = await prisma.$queryRaw<DeputyYearVoteRow[]>`
        with year_votes as (
            select id, occurred_at, description, approved, source_url, collected_at from votes
            where is_nominal and organ_acronym = 'PLEN' and occurred_at >= ${start}::timestamp and occurred_at < ${end}::timestamp
        ), cast_votes as (
            select iv.vote_id, iv.deputy_id, iv.choice::text as choice, coalesce(history.party_id, d.party_id) as party_id
            from individual_votes iv
            join year_votes yv on yv.id = iv.vote_id
            join deputies d on d.id = iv.deputy_id
            left join lateral (
                select s.party_id from deputy_status_changes s
                where s.deputy_id = iv.deputy_id and s.changed_at <= yv.occurred_at
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
        ), party_majorities as materialized (
            select vote_id, party_id, min(choice) as choice
            from party_choices
            where position = 1 and party_voters >= 2
            group by vote_id, party_id
            having count(*) = 1
        )
        select yv.id, yv.occurred_at, yv.description, yv.approved, yv.source_url, yv.collected_at,
            own.choice::text as choice,
            gov.choice::text as government_orientation,
            pm.choice as party_majority
        from year_votes yv
        left join individual_votes own on own.vote_id = yv.id and own.deputy_id = ${deputyId}
        left join lateral (
            select s.situation from deputy_status_changes s
            where s.deputy_id = ${deputyId} and s.changed_at <= yv.occurred_at
            order by s.changed_at desc
            limit 1
        ) status on true
        left join vote_orientations gov on gov.vote_id = yv.id and gov.kind = 'GOVERNMENT'
        left join cast_votes own_cast on own_cast.vote_id = yv.id and own_cast.deputy_id = ${deputyId}
        left join party_majorities pm on pm.vote_id = yv.id and pm.party_id = own_cast.party_id
        where own.choice is not null or status.situation = any(${IN_OFFICE_SITUATIONS})
        order by yv.occurred_at desc, yv.id desc
    `;

    const votes: DeputyYearVote[] = rows.map((row) => ({
        id: row.id,
        occurredAt: row.occurred_at,
        description: row.description,
        approved: row.approved,
        sourceUrl: row.source_url,
        choice: row.choice ?? NOT_VOTED,
        governmentOrientation: row.government_orientation,
        partyMajority: row.party_majority,
    }));
    const groups = groupByProposition(votes);
    const propositions = await readPropositionSummaries(groups.map((group) => group.propositionId));
    const collectedAt = rows.reduce<Date | null>((latest, row) => (!latest || row.collected_at > latest ? row.collected_at : latest), null);

    return {
        groups: groups.map((group) => ({ proposition: propositions.get(group.propositionId) ?? null, votes: group.items })),
        voted: rows.filter((row) => row.choice !== null).length,
        notVoted: rows.filter((row) => row.choice === null).length,
        collectedAt,
    };
}