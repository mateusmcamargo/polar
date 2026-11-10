import { prisma } from "../client";
import { Prisma } from "../generated/prisma/client";
import { DEPUTY_SALARY } from "../deputySalary";
import { METRICS_START_DATE } from "./chamber";
import { buildPartyHistory, type DeputyPartyPeriod } from "./deputyProfile";
import { plenaryVotesCte, voteMetricsCtes } from "./voteMetricsSql";
import { yearRange } from "./votes";

// fewer counted votes than this and the deputy has no rate, see "Metrics" in USE_CASES.md
export const MIN_COUNTED_VOTES = 30;
// two parties need this many votes in common before their affinity is shown
export const MIN_COMMON_VOTES = 30;
const CHAIR_ROLES = ["Presidente", "1º Vice-Presidente", "2º Vice-Presidente", "3º Vice-Presidente"];
const STANDING_COMMITTEE_KIND = "Comissão Permanente";

// first day of the quarter in Brasília time as yyyy-mm-dd; occurred_at is stored as UTC
function quarterOf(column: string): Prisma.Sql {
    return Prisma.sql`date_trunc('quarter', ${Prisma.raw(column)} at time zone 'UTC' at time zone 'America/Sao_Paulo')::date::text`;
}

function rate(aligned: number, counted: number): number | null {
    return counted >= MIN_COUNTED_VOTES ? aligned / counted : null;
}

function average(values: number[]): number | null {
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

// first days of every quarter from the one that holds `from` up to the one that holds `to`
function quarterStarts(from: string, to: string): string[] {
    const quarters: string[] = [];
    let year = Number(from.slice(0, 4));
    let month = Math.floor((Number(from.slice(5, 7)) - 1) / 3) * 3 + 1;
    const last = `${to.slice(0, 4)}-${String(Math.floor((Number(to.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, "0")}-01`;
    for (;;) {
        const start = `${year}-${String(month).padStart(2, "0")}-01`;
        quarters.push(start);
        if (start >= last) {
            return quarters;
        }
        month += 3;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }
}

export interface PartyQuarter {
    // first day of the quarter, yyyy-mm-dd
    quarter: string;
    // mean of the deputies with a rate in the quarter; null when none has one
    governmentRate: number | null;
    partyRate: number | null;
    // deputies that went into each mean
    governmentDeputies: number;
    partyDeputies: number;
    // deputies with a vote in the quarter whose last vote was cast for this party
    seats: number;
    // plenary votes in which the party majority won, out of the votes with a result in which it had a Yes or No majority
    voteWins: number;
    decidedVotes: number;
}

export interface PartyMovementParty {
    acronym: string;
    // chairs and vice-chairs of standing committees held now by deputies of this party
    committeeChairs: number;
    // only quarters in which the party had at least one vote
    quarters: PartyQuarter[];
}

export interface PartyAffinityPair {
    // null for the whole period
    quarter: string | null;
    firstAcronym: string;
    secondAcronym: string;
    commonVotes: number;
    sameVotes: number;
}

export interface PartyMovement {
    parties: PartyMovementParty[];
    affinity: PartyAffinityPair[];
    // every quarter of the period, oldest first
    quarters: string[];
    nominalVotes: number;
    // nominal votes without a recorded result, which stay out of the vote wins
    votesWithoutResult: number;
    firstVoteAt: Date | null;
    lastVoteAt: Date | null;
    votesCollectedAt: Date | null;
    organsCollectedAt: Date | null;
}

interface DeputyQuarterRow {
    quarter: string;
    party_id: number;
    acronym: string;
    deputy_id: number;
    government_votes: bigint;
    government_aligned: bigint;
    party_votes: bigint;
    party_aligned: bigint;
    is_last_party: boolean;
}

interface WinsRow {
    quarter: string;
    acronym: string;
    wins: bigint;
    decided: bigint;
}

interface AffinityRow {
    quarter: string | null;
    first_acronym: string;
    second_acronym: string;
    common_votes: bigint;
    same_votes: bigint;
}

interface ChairRow {
    acronym: string;
    chairs: bigint;
    collected_at: Date | null;
}

interface PeriodRow {
    nominal_votes: bigint;
    without_result: bigint;
    first_vote_at: Date | null;
    last_vote_at: Date | null;
    collected_at: Date | null;
}

// one row per quarter, party and deputy; the party is the one the deputy had on the day of each vote, so a deputy
// who changed party inside a quarter has a row for each party, and the minimum of votes applies to each row
async function readDeputyQuarters(): Promise<DeputyQuarterRow[]> {
    return prisma.$queryRaw<DeputyQuarterRow[]>`
        with ${plenaryVotesCte({ start: METRICS_START_DATE })}, ${voteMetricsCtes({ materialize: true })},
        quarter_votes as materialized (
            select cv.vote_id, cv.deputy_id, cv.choice, cv.party_id, ${quarterOf("cv.occurred_at")} as quarter,
                first_value(cv.party_id) over (
                    partition by ${quarterOf("cv.occurred_at")}, cv.deputy_id order by cv.occurred_at desc
                ) as last_party_id
            from cast_votes cv
            where cv.party_id is not null
        )
        select qv.quarter, qv.party_id, p.acronym, qv.deputy_id,
            count(gov.vote_id) as government_votes,
            count(gov.vote_id) filter (where qv.choice = gov.choice) as government_aligned,
            count(pm.vote_id) as party_votes,
            count(pm.vote_id) filter (where qv.choice = pm.choice) as party_aligned,
            bool_or(qv.party_id = qv.last_party_id) as is_last_party
        from quarter_votes qv
        join parties p on p.id = qv.party_id
        left join government_orientations gov on gov.vote_id = qv.vote_id
        left join party_majorities pm on pm.vote_id = qv.vote_id and pm.party_id = qv.party_id
        group by qv.quarter, qv.party_id, p.acronym, qv.deputy_id
    `;
}

// a party wins when its Yes majority meets an approval or its No majority meets a rejection
async function readVoteWins(): Promise<WinsRow[]> {
    return prisma.$queryRaw<WinsRow[]>`
        with ${plenaryVotesCte({ start: METRICS_START_DATE })}, ${voteMetricsCtes({ materialize: false })}
        select ${quarterOf("pv.occurred_at")} as quarter, p.acronym,
            count(*) filter (where (pm.choice = 'YES' and v.approved) or (pm.choice = 'NO' and not v.approved)) as wins,
            count(*) as decided
        from party_majorities pm
        join plenary_votes pv on pv.id = pm.vote_id
        join votes v on v.id = pv.id
        join parties p on p.id = pm.party_id
        where pm.choice in ('YES', 'NO') and v.approved is not null
        group by 1, p.id, p.acronym
    `;
}

// share of the votes in which the majorities of two parties were the same, for the whole period and for each quarter
async function readAffinity(): Promise<AffinityRow[]> {
    return prisma.$queryRaw<AffinityRow[]>`
        with ${plenaryVotesCte({ start: METRICS_START_DATE })}, ${voteMetricsCtes({ materialize: true })},
        pairs as (
            select ${quarterOf("pv.occurred_at")} as quarter, a.party_id as first_party_id, b.party_id as second_party_id,
                (a.choice = b.choice) as same
            from party_majorities a
            join party_majorities b on b.vote_id = a.vote_id and a.party_id < b.party_id
            join plenary_votes pv on pv.id = a.vote_id
        ), totals as (
            select quarter, first_party_id, second_party_id, count(*) as common_votes, count(*) filter (where same) as same_votes
            from pairs
            group by grouping sets ((first_party_id, second_party_id), (quarter, first_party_id, second_party_id))
            having count(*) >= ${MIN_COMMON_VOTES}
        )
        select t.quarter, p1.acronym as first_acronym, p2.acronym as second_acronym, t.common_votes, t.same_votes
        from totals t
        join parties p1 on p1.id = t.first_party_id
        join parties p2 on p2.id = t.second_party_id
    `;
}

// standing committee chairs and vice-chairs in office now, by the current party of the deputy
async function readCommitteeChairs(): Promise<ChairRow[]> {
    return prisma.$queryRaw<ChairRow[]>`
        select p.acronym, count(*) as chairs, max(m.collected_at) as collected_at
        from organ_memberships m
        join organs o on o.id = m.organ_id
        join deputies d on d.id = m.deputy_id
        join parties p on p.id = d.party_id
        where o.kind = ${STANDING_COMMITTEE_KIND}
            and m.role in (${Prisma.join(CHAIR_ROLES)})
            and (m.ends_at is null or m.ends_at > now())
        group by p.id, p.acronym
    `;
}

async function readPeriod(): Promise<PeriodRow | undefined> {
    const rows = await prisma.$queryRaw<PeriodRow[]>`
        select count(*) as nominal_votes, count(*) filter (where approved is null) as without_result,
            min(occurred_at) as first_vote_at, max(occurred_at) as last_vote_at, max(collected_at) as collected_at
        from votes
        where is_nominal and organ_acronym = 'PLEN' and occurred_at >= ${METRICS_START_DATE}::date
    `;
    return rows[0];
}

function isoDay(date: Date | null | undefined): string {
    return (date ?? new Date(METRICS_START_DATE)).toISOString().slice(0, 10);
}

// how the parties moved in relation to the government and to their own majority, quarter by quarter, for /deputados
export async function getPartyMovement(): Promise<PartyMovement> {
    const [deputyQuarters, wins, affinityRows, chairs, period] = await Promise.all([
        readDeputyQuarters(),
        readVoteWins(),
        readAffinity(),
        readCommitteeChairs(),
        readPeriod(),
    ]);

    const quarterByParty = new Map<string, Map<string, DeputyQuarterRow[]>>();
    for (const row of deputyQuarters) {
        const byQuarter = quarterByParty.get(row.acronym) ?? new Map<string, DeputyQuarterRow[]>();
        byQuarter.set(row.quarter, [...(byQuarter.get(row.quarter) ?? []), row]);
        quarterByParty.set(row.acronym, byQuarter);
    }
    const winsByKey = new Map(wins.map((row) => [`${row.acronym}|${row.quarter}`, row]));
    const chairsByParty = new Map(chairs.map((row) => [row.acronym, Number(row.chairs)]));

    const parties = [...quarterByParty.entries()]
        .map(([acronym, byQuarter]): PartyMovementParty => {
            const quarters = [...byQuarter.entries()]
                .sort(([first], [second]) => first.localeCompare(second))
                .map(([quarter, rows]): PartyQuarter => {
                    const governmentRates = rows.flatMap((row) => rate(Number(row.government_aligned), Number(row.government_votes)) ?? []);
                    const partyRates = rows.flatMap((row) => rate(Number(row.party_aligned), Number(row.party_votes)) ?? []);
                    const result = winsByKey.get(`${acronym}|${quarter}`);
                    return {
                        quarter,
                        governmentRate: average(governmentRates),
                        partyRate: average(partyRates),
                        governmentDeputies: governmentRates.length,
                        partyDeputies: partyRates.length,
                        seats: rows.filter((row) => row.is_last_party).length,
                        voteWins: Number(result?.wins ?? 0),
                        decidedVotes: Number(result?.decided ?? 0),
                    };
                });
            return { acronym, committeeChairs: chairsByParty.get(acronym) ?? 0, quarters };
        })
        .sort((first, second) => first.acronym.localeCompare(second.acronym));

    return {
        parties,
        affinity: affinityRows.map((row) => ({
            quarter: row.quarter,
            firstAcronym: row.first_acronym,
            secondAcronym: row.second_acronym,
            commonVotes: Number(row.common_votes),
            sameVotes: Number(row.same_votes),
        })),
        quarters: quarterStarts(METRICS_START_DATE, isoDay(period?.last_vote_at)),
        nominalVotes: Number(period?.nominal_votes ?? 0),
        votesWithoutResult: Number(period?.without_result ?? 0),
        firstVoteAt: period?.first_vote_at ?? null,
        lastVoteAt: period?.last_vote_at ?? null,
        votesCollectedAt: period?.collected_at ?? null,
        organsCollectedAt: chairs.reduce<Date | null>(
            (latest, row) => (row.collected_at && (!latest || row.collected_at > latest) ? row.collected_at : latest),
            null,
        ),
    };
}

export interface DeputyQuarterMetrics {
    quarter: string;
    governmentVotes: number;
    governmentAligned: number;
    partyVotes: number;
    partyAligned: number;
    governmentRate: number | null;
    partyRate: number | null;
}

export interface DeputyMonthlyQuota {
    year: number;
    month: number;
    total: number;
}

export interface DeputyYearBenefits {
    year: number;
    housingAllowanceReceived: number;
    officeBudgetSpent: number | null;
    collectedAt: Date;
}

export interface DeputyMovement {
    // every quarter of the period, oldest first; quarters without enough votes have null rates
    quarters: string[];
    metrics: DeputyQuarterMetrics[];
    partyHistory: DeputyPartyPeriod[];
    monthlyQuota: DeputyMonthlyQuota[];
    yearBenefits: DeputyYearBenefits[];
    salary: { grossMonthlyValue: number; sourceUrl: string; collectedAt: string };
    // the latest nominal plenary vote loaded, for any deputy, so the chart can mark the time that has no data yet
    lastVoteAt: Date | null;
    votesCollectedAt: Date | null;
    quotaCollectedAt: Date | null;
}

interface DeputyQuarterMetricsRow {
    quarter: string;
    government_votes: bigint;
    government_aligned: bigint;
    party_votes: bigint;
    party_aligned: bigint;
    collected_at: Date | null;
}

interface MonthlyQuotaRow {
    year: number;
    month: number;
    total: string;
    collected_at: Date | null;
}

// the votes, party changes and money of one deputy over the legislature, for the timeline on the profile
export async function getDeputyMovement(deputyId: number): Promise<DeputyMovement> {
    const [metricsRows, statusChanges, parties, quotaRows, annualSummaries, period] = await Promise.all([
        prisma.$queryRaw<DeputyQuarterMetricsRow[]>`
            with ${plenaryVotesCte({ start: METRICS_START_DATE, deputyId })}, ${voteMetricsCtes({ materialize: true })}
            select ${quarterOf("cv.occurred_at")} as quarter,
                count(gov.vote_id) as government_votes,
                count(gov.vote_id) filter (where cv.choice = gov.choice) as government_aligned,
                count(pm.vote_id) as party_votes,
                count(pm.vote_id) filter (where cv.choice = pm.choice) as party_aligned,
                (select max(collected_at) from plenary_votes) as collected_at
            from cast_votes cv
            left join government_orientations gov on gov.vote_id = cv.vote_id
            left join party_majorities pm on pm.vote_id = cv.vote_id and pm.party_id = cv.party_id
            where cv.deputy_id = ${deputyId}
            group by 1
            order by 1
        `,
        prisma.deputyStatusChange.findMany({
            where: { deputyId },
            select: { changedAt: true, situation: true, partyId: true },
            orderBy: { changedAt: "asc" },
        }),
        prisma.party.findMany({ select: { id: true, acronym: true, name: true } }),
        prisma.$queryRaw<MonthlyQuotaRow[]>`
            select year::int as year, month::int as month, sum(net_value)::text as total, max(collected_at) as collected_at
            from expenses
            where deputy_id = ${deputyId} and year >= ${Number(METRICS_START_DATE.slice(0, 4))}
            group by year, month
            order by year, month
        `,
        prisma.deputyAnnualSummary.findMany({
            where: { deputyId, year: { gte: Number(METRICS_START_DATE.slice(0, 4)) } },
            select: { year: true, housingAllowanceReceived: true, officeBudgetSpent: true, collectedAt: true },
            orderBy: { year: "asc" },
        }),
        readPeriod(),
    ]);

    return {
        quarters: quarterStarts(METRICS_START_DATE, isoDay(period?.last_vote_at)),
        metrics: metricsRows.map((row) => {
            const governmentVotes = Number(row.government_votes);
            const governmentAligned = Number(row.government_aligned);
            const partyVotes = Number(row.party_votes);
            const partyAligned = Number(row.party_aligned);
            return {
                quarter: row.quarter,
                governmentVotes,
                governmentAligned,
                partyVotes,
                partyAligned,
                governmentRate: rate(governmentAligned, governmentVotes),
                partyRate: rate(partyAligned, partyVotes),
            };
        }),
        partyHistory: buildPartyHistory(statusChanges, new Map(parties.map((party) => [party.id, { acronym: party.acronym, name: party.name }]))),
        monthlyQuota: quotaRows.map((row) => ({ year: row.year, month: row.month, total: Number(row.total) })),
        yearBenefits: annualSummaries.map((summary) => ({
            year: summary.year,
            housingAllowanceReceived: Number(summary.housingAllowanceReceived),
            officeBudgetSpent: summary.officeBudgetSpent === null ? null : Number(summary.officeBudgetSpent),
            collectedAt: summary.collectedAt,
        })),
        salary: {
            grossMonthlyValue: Number(DEPUTY_SALARY.grossMonthlyValue),
            sourceUrl: DEPUTY_SALARY.sourceUrl,
            collectedAt: DEPUTY_SALARY.collectedAt,
        },
        lastVoteAt: period?.last_vote_at ?? null,
        votesCollectedAt: metricsRows[0]?.collected_at ?? null,
        quotaCollectedAt: quotaRows.reduce<Date | null>(
            (latest, row) => (row.collected_at && (!latest || row.collected_at > latest) ? row.collected_at : latest),
            null,
        ),
    };
}

export interface PeerPoint {
    deputyId: number;
    politicalName: string;
    stateCode: string;
    partyAcronym: string | null;
    governmentRate: number;
    partyRate: number | null;
    // null when the deputy has no record for the year
    quota: number | null;
    housingAllowance: number | null;
    officeBudgetSpent: number | null;
}

export interface PeerComparison {
    year: number;
    points: PeerPoint[];
    votesCollectedAt: Date | null;
    quotaCollectedAt: Date | null;
    annualCollectedAt: Date | null;
}

interface PeerMetricsRow {
    deputy_id: number;
    government_votes: bigint;
    government_aligned: bigint;
    party_votes: bigint;
    party_aligned: bigint;
}

// every deputy with a government rate in the year, with the three money figures of the same year
export async function getPeerComparison(year: number): Promise<PeerComparison> {
    const { start, end } = yearRange(year);
    const [metricsRows, deputies, quotaTotals, summaries, collectedRows] = await Promise.all([
        prisma.$queryRaw<PeerMetricsRow[]>`
            with ${plenaryVotesCte({ start, end })}, ${voteMetricsCtes({ materialize: false })}
            select cv.deputy_id,
                count(gov.vote_id) as government_votes,
                count(gov.vote_id) filter (where cv.choice = gov.choice) as government_aligned,
                count(pm.vote_id) as party_votes,
                count(pm.vote_id) filter (where cv.choice = pm.choice) as party_aligned
            from cast_votes cv
            left join government_orientations gov on gov.vote_id = cv.vote_id
            left join party_majorities pm on pm.vote_id = cv.vote_id and pm.party_id = cv.party_id
            group by cv.deputy_id
        `,
        prisma.deputy.findMany({
            select: { id: true, politicalName: true, stateCode: true, party: { select: { acronym: true } } },
        }),
        prisma.expense.groupBy({
            by: ["deputyId"],
            where: { year },
            _sum: { netValue: true },
            _max: { collectedAt: true },
        }),
        prisma.deputyAnnualSummary.findMany({
            where: { year },
            select: { deputyId: true, housingAllowanceReceived: true, officeBudgetSpent: true, collectedAt: true },
        }),
        prisma.$queryRaw<{ collected_at: Date | null }[]>`
            select max(collected_at) as collected_at from votes
            where is_nominal and organ_acronym = 'PLEN' and occurred_at >= ${start}::timestamp and occurred_at < ${end}::timestamp
        `,
    ]);

    const deputiesById = new Map(deputies.map((deputy) => [deputy.id, deputy]));
    const quotaByDeputy = new Map(quotaTotals.map((row) => [row.deputyId, Number(row._sum.netValue ?? 0)]));
    const summaryByDeputy = new Map(summaries.map((summary) => [summary.deputyId, summary]));

    const points: PeerPoint[] = [];
    for (const row of metricsRows) {
        const deputy = deputiesById.get(row.deputy_id);
        const governmentRate = rate(Number(row.government_aligned), Number(row.government_votes));
        if (!deputy || governmentRate === null) {
            continue;
        }
        const summary = summaryByDeputy.get(row.deputy_id);
        points.push({
            deputyId: deputy.id,
            politicalName: deputy.politicalName,
            stateCode: deputy.stateCode,
            partyAcronym: deputy.party?.acronym ?? null,
            governmentRate,
            partyRate: rate(Number(row.party_aligned), Number(row.party_votes)),
            quota: quotaByDeputy.get(row.deputy_id) ?? null,
            housingAllowance: summary ? Number(summary.housingAllowanceReceived) : null,
            officeBudgetSpent: summary?.officeBudgetSpent == null ? null : Number(summary.officeBudgetSpent),
        });
    }

    const latest = (dates: (Date | null | undefined)[]) =>
        dates.reduce<Date | null>((found, date) => (date && (!found || date > found) ? date : found), null);
    return {
        year,
        points,
        votesCollectedAt: collectedRows[0]?.collected_at ?? null,
        quotaCollectedAt: latest(quotaTotals.map((row) => row._max.collectedAt)),
        annualCollectedAt: latest(summaries.map((summary) => summary.collectedAt)),
    };
}