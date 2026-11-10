import { parse as parseHtml, type HTMLElement } from "node-html-parser";
import { prisma } from "@polar/db";
import { DEPUTY_SALARY } from "@polar/db/deputy-salary";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { toUtcText } from "../toUtcText";
import { fetchCamaraPage } from "./camaraClient";

const WRITE_BATCH_SIZE = 1000;
// a few pages failing after retries are skipped; more than this share, or a run of failures, means the site is down
const MAX_SKIPPED_PAGE_SHARE = 0.05;
const MAX_CONSECUTIVE_SKIPPED_PAGES = 3;
const NO_OFFICE_BUDGET_SPENDING_NOTICE = "Ainda não há gasto registrado neste ano.";
// outcomes of the committee attendance page; "Escusa" is an absence excused in the minutes (Regimento Interno, art. 44)
const COMMITTEE_PRESENCE = "Presença";
const COMMITTEE_JUSTIFIED_OUTCOMES = new Set(["Ausência justificada", "Escusa"]);
const COMMITTEE_UNJUSTIFIED_OUTCOME = "Ausência não justificada";

interface DeputyPage {
    deputyId: number;
    year: number;
    url: string;
    html: string;
    // empty when the summary shows no committee absence; null when the committee page failed, so the stored rows stay
    committeeAbsences: CommitteeAbsenceRow[] | null;
}

interface CommitteeAbsenceRow {
    eventId: number;
    organName: string;
    meetingType: string;
    justified: boolean;
}

interface AttendanceCounts {
    present: number;
    justifiedAbsences: number;
    unjustifiedAbsences: number;
}

interface ParsedDeputyPage {
    deputyId: number;
    year: number;
    url: string;
    plenary: AttendanceCounts;
    committees: AttendanceCounts;
    committeeAbsences: CommitteeAbsenceRow[] | null;
    benefits: Map<string, string>;
    officeBudget: Map<string, string> | null;
}

// Brasília dates as yyyy-mm-dd; "until" is null while the apartment is in use
interface FunctionalApartmentPeriod {
    since: string;
    until: string | null;
}

interface NormalizedDeputyAnnualSummary {
    deputyId: number;
    year: number;
    plenaryPresentDays: number;
    plenaryJustifiedAbsenceDays: number;
    plenaryUnjustifiedAbsenceDays: number;
    committeePresentMeetings: number;
    committeeJustifiedAbsences: number;
    committeeUnjustifiedAbsences: number;
    officeStaffCount: number;
    officeBudgetSpent: string | null;
    officeBudgetUnused: string | null;
    functionalApartmentPeriods: FunctionalApartmentPeriod[];
    housingAllowanceReceived: string;
    officialTripCount: number;
    hasDiplomaticPassport: boolean;
    committeeAbsences: CommitteeAbsenceRow[] | null;
    sourceUrl: string;
    collectedAt: Date;
}

// every unexpected text stops the run, so a change in the page never stores a wrong value
class PageStructureError extends Error {
    constructor(url: string, detail: string) {
        super(`camara-deputy-pages: unexpected structure in ${url}: ${detail}`);
    }
}

function cleanText(element: HTMLElement): string {
    return element.text.replace(/\s+/g, " ").trim();
}

// "1.051.128,63" or "51.036" to "1051128.63" or "51036"
// the page drops a trailing zero of the cents, for example "45.679,4" for R$ 45.679,40
function parseBrazilianMoney(text: string): string | null {
    const match = /^(\d{1,3}(?:\.\d{3})*)(?:,(\d{1,2}))?$/.exec(text);
    return match ? `${match[1]!.replaceAll(".", "")}${match[2] ? `.${match[2].padEnd(2, "0")}` : ""}` : null;
}

function parseAttendanceSection(section: HTMLElement, url: string): AttendanceCounts {
    const countsByLabel = new Map<string, number>();
    for (const item of section.querySelectorAll("li.presencas__data")) {
        const label = cleanText(item.querySelector(".presencas__label") ?? item);
        const quantity = cleanText(item.querySelector(".presencas__qtd") ?? item);
        const match = /^(\d+) (?:dias?|reuni(?:ão|ões))$/.exec(quantity);
        if (!match) {
            throw new PageStructureError(url, `attendance quantity "${quantity}"`);
        }
        countsByLabel.set(label.startsWith("Presenças") ? "Presenças" : label, Number(match[1]));
    }

    const present = countsByLabel.get("Presenças");
    const justifiedAbsences = countsByLabel.get("Ausências justificadas");
    const unjustifiedAbsences = countsByLabel.get("Ausências não justificadas");
    if (present === undefined || justifiedAbsences === undefined || unjustifiedAbsences === undefined) {
        throw new PageStructureError(url, `attendance labels ${[...countsByLabel.keys()].join(", ")}`);
    }
    return { present, justifiedAbsences, unjustifiedAbsences };
}

// the plenary and committee counts of the summary page; null when the page has no attendance block
function readAttendance(root: HTMLElement, url: string): { plenary: AttendanceCounts; committees: AttendanceCounts } | null {
    const attendance = root.querySelector("div.presencas");
    if (!attendance) {
        return null;
    }
    let plenary: AttendanceCounts | null = null;
    let committees: AttendanceCounts | null = null;
    for (const section of attendance.querySelectorAll("section.presencas__section")) {
        const heading = section.querySelector(".presencas__section-heading");
        if (!heading) {
            continue;
        }
        const headingText = cleanText(heading);
        if (headingText.includes("Plenário")) {
            plenary = parseAttendanceSection(section, url);
        } else if (headingText.includes("Comissões")) {
            committees = parseAttendanceSection(section, url);
        }
    }
    if (!plenary || !committees) {
        throw new PageStructureError(url, "missing plenary or committee attendance");
    }
    return { plenary, committees };
}

// one table row per day; a day with several meetings lists them as parallel <div> items in the last three cells
// ("Titular - Comissão de Saúde", a link to /evento-legislativo/{id} with the meeting type, and the outcome)
export function parseCommitteeAbsences(html: string, url: string, expected: AttendanceCounts): CommitteeAbsenceRow[] {
    const table = parseHtml(html).querySelector("table.table");
    if (!table) {
        throw new PageStructureError(url, "missing committee attendance table");
    }
    const absences: CommitteeAbsenceRow[] = [];
    let presences = 0;
    // the rows sit right under the table, without a tbody; the header row has only th cells
    for (const row of table.querySelectorAll("tr")) {
        const cells = row.querySelectorAll("td");
        if (cells.length === 0) {
            continue;
        }
        if (cells.length !== 4) {
            throw new PageStructureError(url, `committee attendance row with ${cells.length} cells`);
        }
        const organs = cells[1]!.querySelectorAll("div").map(cleanText);
        const meetings = cells[2]!.querySelectorAll("div");
        const outcomes = cells[3]!.querySelectorAll("div").map(cleanText);
        if (organs.length !== meetings.length || organs.length !== outcomes.length) {
            throw new PageStructureError(url, `committee attendance row with ${organs.length}, ${meetings.length} and ${outcomes.length} items`);
        }
        meetings.forEach((meeting, index) => {
            const outcome = outcomes[index]!;
            if (outcome === COMMITTEE_PRESENCE) {
                presences++;
                return;
            }
            if (outcome !== COMMITTEE_UNJUSTIFIED_OUTCOME && !COMMITTEE_JUSTIFIED_OUTCOMES.has(outcome)) {
                throw new PageStructureError(url, `committee attendance outcome "${outcome}"`);
            }
            const eventMatch = /\/evento-legislativo\/(\d+)/.exec(meeting.querySelector("a")?.getAttribute("href") ?? "");
            const organMatch = /^.+? -(?: (.*))?$/.exec(organs[index]!);
            if (!eventMatch || !organMatch) {
                throw new PageStructureError(url, `committee attendance item "${organs[index]}" "${cleanText(meeting)}"`);
            }
            absences.push({
                eventId: Number(eventMatch[1]),
                organName: organMatch[1] ?? "",
                meetingType: cleanText(meeting),
                justified: outcome !== COMMITTEE_UNJUSTIFIED_OUTCOME,
            });
        });
    }

    // the summary page lags behind the detail page (new meetings, late justifications), so a difference is only
    // logged; the detail page is the one stored
    const justified = absences.filter((absence) => absence.justified).length;
    const unjustified = absences.length - justified;
    if (presences !== expected.present || justified !== expected.justifiedAbsences || unjustified !== expected.unjustifiedAbsences) {
        console.warn(
            `camara-deputy-pages: ${url} lists (${presences}, ${justified}, ${unjustified}) presences, justified and unjustified ` +
                `but the summary has (${expected.present}, ${expected.justifiedAbsences}, ${expected.unjustifiedAbsences})`,
        );
    }
    return absences;
}

function requireBenefit(page: ParsedDeputyPage, title: string): string {
    const value = page.benefits.get(title);
    if (value === undefined) {
        throw new PageStructureError(page.url, `missing benefit "${title}"`);
    }
    return value;
}

function parseCount(page: ParsedDeputyPage, title: string, pattern: RegExp): number {
    const value = requireBenefit(page, title);
    const match = pattern.exec(value);
    if (!match) {
        throw new PageStructureError(page.url, `${title} "${value}"`);
    }
    return Number(match[1]);
}

// "16/04/2019" to "2019-04-16"
function brazilianDateToIso(text: string): string {
    const [day, month, year] = text.split("/");
    return `${year}-${month}-${day}`;
}

// one or more periods in the same text, for example "Fez uso de 28/06/2024 a 10/03/2025 Fez uso de 01/07/2025 a 30/03/2026"
function parseFunctionalApartment(page: ParsedDeputyPage): FunctionalApartmentPeriod[] {
    const value = requireBenefit(page, "Imóvel funcional");
    // past tense on finished years, present tense on the current one
    if (value === "Não fez uso" || value === "Não faz uso") {
        return [];
    }
    const periods = value.split(/ (?=Fez uso de |Faz uso desde )/).map((part) => {
        const inUse = /^Faz uso desde (\d{2}\/\d{2}\/\d{4})$/.exec(part);
        if (inUse) {
            return { since: brazilianDateToIso(inUse[1]!), until: null };
        }
        const used = /^Fez uso de (\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4})$/.exec(part);
        if (used) {
            return { since: brazilianDateToIso(used[1]!), until: brazilianDateToIso(used[2]!) };
        }
        throw new PageStructureError(page.url, `Imóvel funcional "${value}"`);
    });
    return periods.sort((first, second) => first.since.localeCompare(second.since));
}

function parseHousingAllowance(page: ParsedDeputyPage): string {
    const value = requireBenefit(page, "Auxílio-moradia");
    if (value === "Não recebe o auxílio") {
        return "0";
    }
    const received = /^Recebeu R\$ ([\d.,]+)$/.exec(value);
    const amount = received ? parseBrazilianMoney(received[1]!) : null;
    if (amount === null) {
        throw new PageStructureError(page.url, `Auxílio-moradia "${value}"`);
    }
    return amount;
}

function parseDiplomaticPassport(page: ParsedDeputyPage): boolean {
    const value = requireBenefit(page, "Passaporte diplomático");
    if (value !== "Possui" && value !== "Não possui") {
        throw new PageStructureError(page.url, `Passaporte diplomático "${value}"`);
    }
    return value === "Possui";
}

function parseOfficeBudget(page: ParsedDeputyPage, label: string): string | null {
    if (!page.officeBudget) {
        return null;
    }
    const value = page.officeBudget.get(label);
    const amount = value === undefined ? null : parseBrazilianMoney(value);
    if (amount === null) {
        throw new PageStructureError(page.url, `verba de gabinete "${label}" is "${value}"`);
    }
    return amount;
}

// the salary is the same for every deputy, so it is kept in a static file instead of this table
function checkSalary(page: ParsedDeputyPage): void {
    const value = requireBenefit(page, "Salário mensal bruto");
    const amount = parseBrazilianMoney(value.replace(/^R\$ /, ""));
    if (amount !== DEPUTY_SALARY.grossMonthlyValue) {
        throw new Error(
            `camara-deputy-pages: ${page.url} shows salary "${value}", update src/db/src/deputySalary.ts`,
        );
    }
}

export function createCamaraDeputyPagesAdapter(
    years: number[],
): SourceAdapter<DeputyPage[], ParsedDeputyPage, NormalizedDeputyAnnualSummary> {
    return {
        name: "camara-deputy-pages",

        async fetch(): Promise<DeputyPage[]> {
            const deputies = await prisma.deputy.findMany({ select: { id: true }, orderBy: { id: "asc" } });
            if (deputies.length === 0) {
                throw new Error("camara-deputy-pages: no deputies in the database, run camara-deputies first");
            }

            const pages: DeputyPage[] = [];
            const skippedUrls: string[] = [];
            const skippedCommitteeUrls: string[] = [];
            let consecutiveSkips = 0;
            let consecutiveCommitteeSkips = 0;
            let committeePageCount = 0;
            let attemptedCount = 0;
            const pageCount = deputies.length * years.length;
            for (const year of years) {
                for (const deputy of deputies) {
                    const url = `https://www.camara.leg.br/deputados/${deputy.id}?ano=${year}`;
                    attemptedCount++;
                    try {
                        const html = await fetchCamaraPage(url);
                        // the meeting list is read only when there is an absence to break down
                        const committees = readAttendance(parseHtml(html), url)?.committees;
                        const hasCommitteeAbsences = !!committees && committees.justifiedAbsences + committees.unjustifiedAbsences > 0;
                        let committeeAbsences: CommitteeAbsenceRow[] | null = [];
                        if (committees && hasCommitteeAbsences) {
                            // read right after the download, so a page outside the pattern costs only that page
                            const committeeUrl = `https://www.camara.leg.br/deputados/${deputy.id}/presenca-comissoes/${year}`;
                            committeePageCount++;
                            try {
                                committeeAbsences = parseCommitteeAbsences(await fetchCamaraPage(committeeUrl), committeeUrl, committees);
                                consecutiveCommitteeSkips = 0;
                            } catch (error) {
                                committeeAbsences = null;
                                skippedCommitteeUrls.push(committeeUrl);
                                consecutiveCommitteeSkips++;
                                console.log(`camara-deputy-pages: skipping ${committeeUrl}: ${(error as Error).message}`);
                                if (consecutiveCommitteeSkips >= MAX_CONSECUTIVE_SKIPPED_PAGES) {
                                    throw new Error(`camara-deputy-pages: ${consecutiveCommitteeSkips} committee pages in a row failed, the layout changed or the website is down`);
                                }
                            }
                        }
                        pages.push({ deputyId: deputy.id, year, url, html, committeeAbsences });
                        consecutiveSkips = 0;
                    } catch (error) {
                        // a page that keeps failing is skipped, so the earlier summary and absences of that deputy are kept
                        skippedUrls.push(url);
                        consecutiveSkips++;
                        console.log(`camara-deputy-pages: skipping ${url} after retries: ${(error as Error).message}`);
                        if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPPED_PAGES) {
                            throw new Error(`camara-deputy-pages: ${consecutiveSkips} pages in a row failed, the website seems to be down`);
                        }
                    }
                    if (attemptedCount % 100 === 0) {
                        console.log(`camara-deputy-pages: fetched ${attemptedCount} of ${pageCount} pages`);
                    }
                }
            }
            if (skippedUrls.length > pageCount * MAX_SKIPPED_PAGE_SHARE) {
                throw new Error(`camara-deputy-pages: ${skippedUrls.length} of ${pageCount} pages failed, nothing was written`);
            }
            if (skippedUrls.length > 0) {
                console.log(`camara-deputy-pages: skipped ${skippedUrls.length} pages that kept failing: ${skippedUrls.join(" ")}`);
            }
            if (skippedCommitteeUrls.length > committeePageCount * MAX_SKIPPED_PAGE_SHARE) {
                throw new Error(`camara-deputy-pages: ${skippedCommitteeUrls.length} of ${committeePageCount} committee pages failed, nothing was written`);
            }
            if (skippedCommitteeUrls.length > 0) {
                console.log(`camara-deputy-pages: kept the stored absences of ${skippedCommitteeUrls.length} committee pages that failed: ${skippedCommitteeUrls.join(" ")}`);
            }
            return pages;
        },

        parse(rawData: DeputyPage[]): ParsedDeputyPage[] {
            const parsedPages: ParsedDeputyPage[] = [];
            let pagesWithoutData = 0;

            for (const page of rawData) {
                const root = parseHtml(page.html);
                const attendance = readAttendance(root, page.url);
                const benefitList = root.querySelector("ul.recursos-beneficios-deputado-container");
                const officeBudgetTable = root.querySelector("table#percentualgastoverbagabinete");

                // a deputy without activity in the year has a page without these blocks, and a deputy
                // who left at the start of the year has a page without the spending block
                if (!attendance && !benefitList && !officeBudgetTable) {
                    pagesWithoutData++;
                    continue;
                }
                if (!attendance || !benefitList) {
                    throw new PageStructureError(page.url, "only one of the attendance and benefit blocks");
                }
                const { plenary, committees } = attendance;

                // titles end with the "?" of their help button
                const benefits = new Map<string, string>();
                for (const benefit of benefitList.querySelectorAll("div.beneficio")) {
                    const title = benefit.querySelector(".beneficio__titulo");
                    const info = benefit.querySelector(".beneficio__info");
                    if (title && info) {
                        benefits.set(cleanText(title).replace(/\s*\?$/, ""), cleanText(info));
                    }
                }

                let officeBudget = officeBudgetTable ? new Map<string, string>() : null;
                for (const row of officeBudgetTable?.querySelectorAll("tbody tr") ?? []) {
                    const [label, total] = row.querySelectorAll("td").map(cleanText);
                    if (label !== undefined && total !== undefined) {
                        officeBudget?.set(label, total);
                    }
                }
                // early in the year the table can come without rows, only with this notice, which means no spending yet
                if (officeBudgetTable && officeBudget?.size === 0 && cleanText(officeBudgetTable).includes(NO_OFFICE_BUDGET_SPENDING_NOTICE)) {
                    officeBudget = null;
                }

                parsedPages.push({ deputyId: page.deputyId, year: page.year, url: page.url, plenary, committees, committeeAbsences: page.committeeAbsences, benefits, officeBudget });
            }

            console.log(`camara-deputy-pages: skipped ${pagesWithoutData} pages without data for the year`);
            return parsedPages;
        },

        normalize(parsedRecords: ParsedDeputyPage[], context: CollectionContext): NormalizedDeputyAnnualSummary[] {
            return parsedRecords.map((page) => {
                checkSalary(page);
                return {
                    deputyId: page.deputyId,
                    year: page.year,
                    plenaryPresentDays: page.plenary.present,
                    plenaryJustifiedAbsenceDays: page.plenary.justifiedAbsences,
                    plenaryUnjustifiedAbsenceDays: page.plenary.unjustifiedAbsences,
                    committeePresentMeetings: page.committees.present,
                    committeeJustifiedAbsences: page.committees.justifiedAbsences,
                    committeeUnjustifiedAbsences: page.committees.unjustifiedAbsences,
                    // "38 pessoas neste ano, sendo 22 ativas atualmente" in the current year, "9 pessoas" before
                    officeStaffCount: parseCount(page, "Pessoal de gabinete", /^(\d+) pessoas?(?: neste ano\b.*)?$/),
                    officeBudgetSpent: parseOfficeBudget(page, "Gasto"),
                    officeBudgetUnused: parseOfficeBudget(page, "Não utilizado"),
                    functionalApartmentPeriods: parseFunctionalApartment(page),
                    housingAllowanceReceived: parseHousingAllowance(page),
                    officialTripCount: parseCount(page, "Viagens em missão oficial", /^(\d+)$/),
                    hasDiplomaticPassport: parseDiplomaticPassport(page),
                    committeeAbsences: page.committeeAbsences,
                    sourceUrl: page.url,
                    collectedAt: context.collectedAt,
                };
            });
        },

        async upsert(normalizedRecords: NormalizedDeputyAnnualSummary[]) {
            // pages without data are not written, so earlier values of those deputies are kept
            for (const batch of splitIntoBatches(normalizedRecords, WRITE_BATCH_SIZE)) {
                await prisma.$executeRaw`
                    INSERT INTO deputy_annual_summaries (
                        deputy_id, year,
                        plenary_present_days, plenary_justified_absence_days, plenary_unjustified_absence_days,
                        committee_present_meetings, committee_justified_absences, committee_unjustified_absences,
                        office_staff_count, office_budget_spent, office_budget_unused,
                        functional_apartment_periods,
                        housing_allowance_received, official_trip_count, has_diplomatic_passport,
                        source_url, collected_at
                    )
                    SELECT * FROM unnest(
                        ${batch.map((row) => row.deputyId)}::int[],
                        ${batch.map((row) => row.year)}::smallint[],
                        ${batch.map((row) => row.plenaryPresentDays)}::int[],
                        ${batch.map((row) => row.plenaryJustifiedAbsenceDays)}::int[],
                        ${batch.map((row) => row.plenaryUnjustifiedAbsenceDays)}::int[],
                        ${batch.map((row) => row.committeePresentMeetings)}::int[],
                        ${batch.map((row) => row.committeeJustifiedAbsences)}::int[],
                        ${batch.map((row) => row.committeeUnjustifiedAbsences)}::int[],
                        ${batch.map((row) => row.officeStaffCount)}::int[],
                        ${batch.map((row) => row.officeBudgetSpent)}::numeric[],
                        ${batch.map((row) => row.officeBudgetUnused)}::numeric[],
                        ${batch.map((row) => JSON.stringify(row.functionalApartmentPeriods))}::jsonb[],
                        ${batch.map((row) => row.housingAllowanceReceived)}::numeric[],
                        ${batch.map((row) => row.officialTripCount)}::int[],
                        ${batch.map((row) => row.hasDiplomaticPassport)}::boolean[],
                        ${batch.map((row) => row.sourceUrl)}::text[],
                        ${batch.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                    )
                    ON CONFLICT (deputy_id, year) DO UPDATE SET
                        plenary_present_days = EXCLUDED.plenary_present_days,
                        plenary_justified_absence_days = EXCLUDED.plenary_justified_absence_days,
                        plenary_unjustified_absence_days = EXCLUDED.plenary_unjustified_absence_days,
                        committee_present_meetings = EXCLUDED.committee_present_meetings,
                        committee_justified_absences = EXCLUDED.committee_justified_absences,
                        committee_unjustified_absences = EXCLUDED.committee_unjustified_absences,
                        office_staff_count = EXCLUDED.office_staff_count,
                        office_budget_spent = EXCLUDED.office_budget_spent,
                        office_budget_unused = EXCLUDED.office_budget_unused,
                        functional_apartment_periods = EXCLUDED.functional_apartment_periods,
                        housing_allowance_received = EXCLUDED.housing_allowance_received,
                        official_trip_count = EXCLUDED.official_trip_count,
                        has_diplomatic_passport = EXCLUDED.has_diplomatic_passport,
                        source_url = EXCLUDED.source_url,
                        collected_at = EXCLUDED.collected_at`;
            }

            // the absences of each reread summary are replaced as a whole, in the same transaction for each batch;
            // summaries whose committee page failed keep the stored rows
            let absenceCount = 0;
            for (const allSummaries of splitIntoBatches(normalizedRecords, WRITE_BATCH_SIZE)) {
                const batch = allSummaries.filter((summary) => summary.committeeAbsences !== null);
                if (batch.length === 0) {
                    continue;
                }
                const rows = batch.flatMap((summary) =>
                    (summary.committeeAbsences ?? []).map((absence, position) => ({ ...absence, deputyId: summary.deputyId, year: summary.year, position, collectedAt: summary.collectedAt })),
                );
                absenceCount += rows.length;
                if (rows.length === 0) {
                    await prisma.$executeRaw`
                        DELETE FROM committee_absences AS absence
                        USING unnest(${batch.map((summary) => summary.deputyId)}::int[], ${batch.map((summary) => summary.year)}::smallint[]) AS written (deputy_id, year)
                        WHERE absence.deputy_id = written.deputy_id AND absence.year = written.year`;
                    continue;
                }
                await prisma.$transaction([
                    prisma.$executeRaw`
                        DELETE FROM committee_absences AS absence
                        USING unnest(${batch.map((summary) => summary.deputyId)}::int[], ${batch.map((summary) => summary.year)}::smallint[]) AS written (deputy_id, year)
                        WHERE absence.deputy_id = written.deputy_id AND absence.year = written.year`,
                    prisma.$executeRaw`
                        INSERT INTO committee_absences (deputy_id, year, position, event_id, organ_name, meeting_type, justified, collected_at)
                        SELECT * FROM unnest(
                            ${rows.map((row) => row.deputyId)}::int[],
                            ${rows.map((row) => row.year)}::smallint[],
                            ${rows.map((row) => row.position)}::int[],
                            ${rows.map((row) => row.eventId)}::int[],
                            ${rows.map((row) => row.organName)}::text[],
                            ${rows.map((row) => row.meetingType)}::text[],
                            ${rows.map((row) => row.justified)}::boolean[],
                            ${rows.map((row) => toUtcText(row.collectedAt))}::timestamp[]
                        )`,
                ]);
            }
            console.log(`camara-deputy-pages: ${absenceCount} committee absences written`);

            return { insertedOrUpdatedCount: normalizedRecords.length };
        },
    };
}