import { prisma } from "../client";

// first day of the 57th legislature in Brasília time
const LEGISLATURE_START = new Date("2023-02-01T00:00:00-03:00");
const IN_OFFICE_SITUATION = "Exercício";
// one placeholder per legislature, all dated on the start of the current one, so its party can belong to an older term
const START_OF_LEGISLATURE_SITUATION = "Início da legislatura";
const LATEST_VOTE_GROUPS = 10;
const LATEST_VOTES_SCAN_LIMIT = 120;
const TOP_EXPENSE_CATEGORIES = 3;

export interface DeputyProfileParty {
    acronym: string;
    name: string;
}

export interface DeputyPartyPeriod {
    party: DeputyProfileParty | null;
    startsAt: Date;
    // null for the current party
    endsAt: Date | null;
}

export interface DeputyOrganRow {
    organId: number;
    name: string;
    kind: string;
    roles: string[];
    startsAt: Date;
    endsAt: Date | null;
}

export interface DeputyFrontRow {
    id: number;
    title: string;
    isCoordinator: boolean;
}

export interface DeputyProfile {
    id: number;
    politicalName: string;
    civilName: string | null;
    photoUrl: string | null;
    sex: "FEMALE" | "MALE" | null;
    stateCode: string;
    party: DeputyProfileParty | null;
    isInOffice: boolean;
    sourceUrl: string;
    collectedAt: Date;
    // first time in office in the current legislature
    inOfficeSince: Date | null;
    // the latest status change when the deputy is out of office
    outOfOffice: { since: Date; situation: string } | null;
    partyHistory: DeputyPartyPeriod[];
    currentOrgans: DeputyOrganRow[];
    pastOrgans: DeputyOrganRow[];
    organsCollectedAt: Date | null;
    fronts: DeputyFrontRow[];
    frontsCollectedAt: Date | null;
    // years with votes, attendance or expenses, newest first
    years: number[];
}

export interface DeputyVoteMetrics {
    partyVotes: number;
    partyAligned: number;
    governmentVotes: number;
    governmentAligned: number;
}

export interface DeputyVote {
    id: string;
    occurredAt: Date;
    description: string;
    approved: boolean | null;
    choice: string;
    sourceUrl: string;
}

// consecutive votes of one proposition, newest first
export interface DeputyVoteGroup {
    proposition: { typeCode: string; number: number; year: number; summary: string; sourceUrl: string } | null;
    votes: DeputyVote[];
}

export interface DeputyAttendance {
    present: number;
    justifiedAbsences: number;
    unjustifiedAbsences: number;
}

export interface DeputyBenefits {
    officeStaffCount: number;
    officeBudgetSpent: number | null;
    officeBudgetUnused: number | null;
    functionalApartmentSince: Date | null;
    functionalApartmentUntil: Date | null;
    housingAllowanceReceived: number;
    officialTripCount: number;
    hasDiplomaticPassport: boolean;
}

export interface DeputyAnnualPage {
    plenary: DeputyAttendance;
    committees: DeputyAttendance;
    benefits: DeputyBenefits;
    sourceUrl: string;
    collectedAt: Date;
}

export interface DeputyQuotaSpending {
    total: number;
    stateAverage: number;
    chamberAverage: number;
    topCategories: { expenseTypeCode: number; description: string; total: number }[];
    collectedAt: Date;
}

export interface DeputyYear {
    year: number;
    metrics: DeputyVoteMetrics;
    votesCollectedAt: Date | null;
    latestVoteGroups: DeputyVoteGroup[];
    annualPage: DeputyAnnualPage | null;
    quota: DeputyQuotaSpending | null;
}

interface YearRow {
    year: number;
}

interface MetricsRow {
    government_votes: bigint;
    government_aligned: bigint;
    party_votes: bigint;
    party_aligned: bigint;
    collected_at: Date | null;
}

interface LatestVoteRow {
    id: string;
    occurred_at: Date;
    description: string;
    approved: boolean | null;
    source_url: string;
    choice: string;
}

interface QuotaRow {
    own_total: string | null;
    state_average: string | null;
    chamber_average: string | null;
    collected_at: Date | null;
}

interface CategoryRow {
    expense_type_code: number;
    description: string;
    total: string;
}

// bounds of a year in Brasília time, as UTC text for the timestamp columns, which hold UTC without a zone
function yearRange(year: number): { start: string; end: string } {
    return {
        start: new Date(`${year}-01-01T00:00:00-03:00`).toISOString(),
        end: new Date(`${year + 1}-01-01T00:00:00-03:00`).toISOString(),
    };
}

function latestDate(dates: Date[]): Date | null {
    return dates.reduce<Date | null>((latest, date) => (!latest || date > latest ? date : latest), null);
}

// party runs inside the legislature, newest first; parties missing from the parties table come back as null
function buildPartyHistory(
    statusChanges: { changedAt: Date; situation: string; partyId: number | null }[],
    partiesById: Map<number, DeputyProfileParty>,
): DeputyPartyPeriod[] {
    const periods: (DeputyPartyPeriod & { partyId: number })[] = [];
    for (const change of statusChanges) {
        if (change.partyId === null || change.situation === START_OF_LEGISLATURE_SITUATION || change.changedAt < LEGISLATURE_START) {
            continue;
        }
        const current = periods.at(-1);
        if (current?.partyId === change.partyId) {
            continue;
        }
        if (current) {
            current.endsAt = change.changedAt;
        }
        periods.push({ partyId: change.partyId, party: partiesById.get(change.partyId) ?? null, startsAt: change.changedAt, endsAt: null });
    }
    return periods.reverse().map(({ party, startsAt, endsAt }) => ({ party, startsAt, endsAt }));
}

// one row per organ, roles of the same period merged, for example "Titular" and "Presidente" from the same day
function groupMemberships(
    memberships: { organId: number; role: string; startsAt: Date; endsAt: Date | null; organ: { name: string; kind: string } }[],
): DeputyOrganRow[] {
    const rowsByOrgan = new Map<number, DeputyOrganRow>();
    for (const membership of memberships) {
        const row = rowsByOrgan.get(membership.organId);
        if (!row) {
            rowsByOrgan.set(membership.organId, {
                organId: membership.organId,
                name: membership.organ.name,
                kind: membership.organ.kind,
                roles: [membership.role],
                startsAt: membership.startsAt,
                endsAt: membership.endsAt,
            });
            continue;
        }
        if (!row.roles.includes(membership.role)) {
            row.roles.push(membership.role);
        }
        if (membership.startsAt < row.startsAt) {
            row.startsAt = membership.startsAt;
        }
        if (row.endsAt && (!membership.endsAt || membership.endsAt > row.endsAt)) {
            row.endsAt = membership.endsAt;
        }
    }
    return [...rowsByOrgan.values()];
}

// everything on the profile that does not depend on the selected year
export async function getDeputyProfile(deputyId: number): Promise<DeputyProfile | null> {
    const deputy = await prisma.deputy.findUnique({
        where: { id: deputyId },
        select: {
            id: true,
            politicalName: true,
            civilName: true,
            photoUrl: true,
            sex: true,
            stateCode: true,
            isInOffice: true,
            sourceUrl: true,
            collectedAt: true,
            party: { select: { acronym: true, name: true } },
        },
    });
    if (!deputy) {
        return null;
    }

    const now = new Date();
    const [statusChanges, parties, memberships, fronts, yearRows] = await Promise.all([
        prisma.deputyStatusChange.findMany({
            where: { deputyId },
            select: { changedAt: true, situation: true, partyId: true },
            orderBy: { changedAt: "asc" },
        }),
        prisma.party.findMany({ select: { id: true, acronym: true, name: true } }),
        prisma.organMembership.findMany({
            where: { deputyId },
            select: {
                organId: true,
                role: true,
                startsAt: true,
                endsAt: true,
                collectedAt: true,
                organ: { select: { name: true, kind: true } },
            },
            orderBy: { startsAt: "desc" },
        }),
        prisma.frontMembership.findMany({
            where: { deputyId },
            select: { role: true, collectedAt: true, front: { select: { id: true, title: true } } },
            orderBy: { front: { title: "asc" } },
        }),
        prisma.$queryRaw<YearRow[]>`
            select year::int as year from deputy_annual_summaries where deputy_id = ${deputyId}
            union
            select distinct year::int from expenses where deputy_id = ${deputyId}
            union
            select distinct extract(year from v.occurred_at at time zone 'UTC' at time zone 'America/Sao_Paulo')::int
            from individual_votes iv
            join votes v on v.id = iv.vote_id
            where iv.deputy_id = ${deputyId} and v.organ_acronym = 'PLEN'
            order by year desc
        `,
    ]);

    const partiesById = new Map(parties.map((party) => [party.id, { acronym: party.acronym, name: party.name }]));
    const latestChange = statusChanges.at(-1);
    const isCurrent = (membership: { endsAt: Date | null }) => !membership.endsAt || membership.endsAt > now;

    return {
        id: deputy.id,
        politicalName: deputy.politicalName,
        civilName: deputy.civilName,
        photoUrl: deputy.photoUrl,
        sex: deputy.sex,
        stateCode: deputy.stateCode,
        party: deputy.party,
        isInOffice: deputy.isInOffice,
        sourceUrl: deputy.sourceUrl,
        collectedAt: deputy.collectedAt,
        inOfficeSince:
            statusChanges.find((change) => change.situation === IN_OFFICE_SITUATION && change.changedAt >= LEGISLATURE_START)?.changedAt ??
            null,
        outOfOffice:
            !deputy.isInOffice && latestChange ? { since: latestChange.changedAt, situation: latestChange.situation } : null,
        partyHistory: buildPartyHistory(statusChanges, partiesById),
        currentOrgans: groupMemberships(memberships.filter(isCurrent)),
        pastOrgans: groupMemberships(memberships.filter((membership) => !isCurrent(membership))),
        organsCollectedAt: latestDate(memberships.map((membership) => membership.collectedAt)),
        fronts: fronts.map((membership) => ({
            id: membership.front.id,
            title: membership.front.title,
            isCoordinator: membership.role === "Coordenador",
        })),
        frontsCollectedAt: latestDate(fronts.map((membership) => membership.collectedAt)),
        years: yearRows.map((row) => row.year),
    };
}

// same formulas as getChamberComposition, limited to the votes the deputy cast in the year; the planner expects
// a couple of votes instead of hundreds, so the majorities are materialized to be computed once (6 s down to 1.6 s)
async function readVoteMetrics(deputyId: number, year: number): Promise<MetricsRow | undefined> {
    const { start, end } = yearRange(year);
    const rows = await prisma.$queryRaw<MetricsRow[]>`
        with plenary_votes as (
            select v.id, v.occurred_at, v.collected_at from votes v
            join individual_votes own on own.vote_id = v.id and own.deputy_id = ${deputyId}
            where v.is_nominal and v.organ_acronym = 'PLEN' and v.occurred_at >= ${start}::timestamp and v.occurred_at < ${end}::timestamp
                and own.choice <> 'ARTICLE_17'
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
        ), party_majorities as materialized (
            -- ties and parties with a single voter have no majority
            select vote_id, party_id, min(choice) as choice
            from party_choices
            where position = 1 and party_voters >= 2
            group by vote_id, party_id
            having count(*) = 1
        ), government_orientations as materialized (
            select o.vote_id, o.choice::text as choice
            from vote_orientations o
            join plenary_votes pv on pv.id = o.vote_id
            where o.kind = 'GOVERNMENT' and o.choice <> 'LIBERATED'
        )
        select
            count(gov.vote_id) as government_votes,
            count(gov.vote_id) filter (where cv.choice = gov.choice) as government_aligned,
            count(pm.vote_id) as party_votes,
            count(pm.vote_id) filter (where cv.choice = pm.choice) as party_aligned,
            (select max(collected_at) from plenary_votes) as collected_at
        from cast_votes cv
        left join government_orientations gov on gov.vote_id = cv.vote_id
        left join party_majorities pm on pm.vote_id = cv.vote_id and pm.party_id = cv.party_id
        where cv.deputy_id = ${deputyId}
    `;
    return rows[0];
}

// the prefix of a Câmara vote id is the id of the proposition being discussed
function propositionIdOf(voteId: string): number {
    return Number.parseInt(voteId.split("-")[0] ?? "", 10);
}

async function readLatestVoteGroups(deputyId: number, year: number): Promise<DeputyVoteGroup[]> {
    const { start, end } = yearRange(year);
    const rows = await prisma.$queryRaw<LatestVoteRow[]>`
        select v.id, v.occurred_at, v.description, v.approved, v.source_url, iv.choice::text as choice
        from individual_votes iv
        join votes v on v.id = iv.vote_id
        where iv.deputy_id = ${deputyId} and v.is_nominal and v.organ_acronym = 'PLEN'
            and v.occurred_at >= ${start}::timestamp and v.occurred_at < ${end}::timestamp
        order by v.occurred_at desc
        limit ${LATEST_VOTES_SCAN_LIMIT}
    `;

    const groups: { propositionId: number; votes: DeputyVote[] }[] = [];
    for (const row of rows) {
        const propositionId = propositionIdOf(row.id);
        const vote = {
            id: row.id,
            occurredAt: row.occurred_at,
            description: row.description,
            approved: row.approved,
            choice: row.choice,
            sourceUrl: row.source_url,
        };
        const current = groups.at(-1);
        if (current?.propositionId === propositionId) {
            current.votes.push(vote);
        } else {
            groups.push({ propositionId, votes: [vote] });
        }
    }
    // the last group may be cut by the scan limit, so it is dropped when the limit was reached
    const completeGroups = rows.length === LATEST_VOTES_SCAN_LIMIT ? groups.slice(0, -1) : groups;
    const shownGroups = completeGroups.slice(0, LATEST_VOTE_GROUPS);

    const propositions = await prisma.proposition.findMany({
        where: { id: { in: shownGroups.map((group) => group.propositionId) } },
        select: { id: true, typeCode: true, number: true, year: true, summary: true, sourceUrl: true },
    });
    const propositionsById = new Map(propositions.map((proposition) => [proposition.id, proposition]));

    return shownGroups.map((group) => {
        const proposition = propositionsById.get(group.propositionId);
        return {
            proposition: proposition
                ? {
                      typeCode: proposition.typeCode,
                      number: proposition.number,
                      year: proposition.year,
                      summary: proposition.summary,
                      sourceUrl: proposition.sourceUrl,
                  }
                : null,
            votes: group.votes,
        };
    });
}

// averages consider every deputy with at least one expense in the year
async function readQuotaSpending(deputyId: number, stateCode: string, year: number): Promise<DeputyQuotaSpending | null> {
    const [totalsRows, categoryRows] = await Promise.all([
        prisma.$queryRaw<QuotaRow[]>`
            with totals as (
                select e.deputy_id, d.state_code, sum(e.net_value) as total, max(e.collected_at) as collected_at
                from expenses e
                join deputies d on d.id = e.deputy_id
                where e.year = ${year}
                group by e.deputy_id, d.state_code
            )
            select
                (select total from totals where deputy_id = ${deputyId})::text as own_total,
                (avg(total) filter (where state_code = ${stateCode}))::text as state_average,
                avg(total)::text as chamber_average,
                (select collected_at from totals where deputy_id = ${deputyId}) as collected_at
            from totals
        `,
        prisma.$queryRaw<CategoryRow[]>`
            select e.expense_type_code, t.description, sum(e.net_value)::text as total
            from expenses e
            join expense_types t on t.code = e.expense_type_code
            where e.deputy_id = ${deputyId} and e.year = ${year}
            group by e.expense_type_code, t.description
            order by sum(e.net_value) desc
            limit ${TOP_EXPENSE_CATEGORIES}
        `,
    ]);

    const totals = totalsRows[0];
    if (!totals?.own_total || !totals.collected_at) {
        return null;
    }
    return {
        total: Number(totals.own_total),
        stateAverage: Number(totals.state_average ?? 0),
        chamberAverage: Number(totals.chamber_average ?? 0),
        topCategories: categoryRows.map((row) => ({
            expenseTypeCode: row.expense_type_code,
            description: row.description,
            total: Number(row.total),
        })),
        collectedAt: totals.collected_at,
    };
}

async function readAnnualPage(deputyId: number, year: number): Promise<DeputyAnnualPage | null> {
    const summary = await prisma.deputyAnnualSummary.findUnique({ where: { deputyId_year: { deputyId, year } } });
    if (!summary) {
        return null;
    }
    return {
        plenary: {
            present: summary.plenaryPresentDays,
            justifiedAbsences: summary.plenaryJustifiedAbsenceDays,
            unjustifiedAbsences: summary.plenaryUnjustifiedAbsenceDays,
        },
        committees: {
            present: summary.committeePresentMeetings,
            justifiedAbsences: summary.committeeJustifiedAbsences,
            unjustifiedAbsences: summary.committeeUnjustifiedAbsences,
        },
        benefits: {
            officeStaffCount: summary.officeStaffCount,
            officeBudgetSpent: summary.officeBudgetSpent === null ? null : Number(summary.officeBudgetSpent),
            officeBudgetUnused: summary.officeBudgetUnused === null ? null : Number(summary.officeBudgetUnused),
            functionalApartmentSince: summary.functionalApartmentSince,
            functionalApartmentUntil: summary.functionalApartmentUntil,
            housingAllowanceReceived: Number(summary.housingAllowanceReceived),
            officialTripCount: summary.officialTripCount,
            hasDiplomaticPassport: summary.hasDiplomaticPassport,
        },
        sourceUrl: summary.sourceUrl,
        collectedAt: summary.collectedAt,
    };
}

// the figures of one year: vote metrics, latest votes, attendance, benefits and quota spending
export async function getDeputyYear(deputyId: number, stateCode: string, year: number): Promise<DeputyYear> {
    const [metrics, latestVoteGroups, annualPage, quota] = await Promise.all([
        readVoteMetrics(deputyId, year),
        readLatestVoteGroups(deputyId, year),
        readAnnualPage(deputyId, year),
        readQuotaSpending(deputyId, stateCode, year),
    ]);
    return {
        year,
        metrics: {
            partyVotes: Number(metrics?.party_votes ?? 0),
            partyAligned: Number(metrics?.party_aligned ?? 0),
            governmentVotes: Number(metrics?.government_votes ?? 0),
            governmentAligned: Number(metrics?.government_aligned ?? 0),
        },
        votesCollectedAt: metrics?.collected_at ?? null,
        latestVoteGroups,
        annualPage,
        quota,
    };
}