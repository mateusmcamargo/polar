import { parse as parseHtml, type HTMLElement } from "node-html-parser";
import { prisma } from "@polar/db";
import { DEPUTY_SALARY } from "@polar/db/deputy-salary";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";
import { toUtcText } from "../toUtcText";
import { fetchCamaraPage } from "./camaraClient";

const WRITE_BATCH_SIZE = 1000;

interface DeputyPage {
    deputyId: number;
    year: number;
    url: string;
    html: string;
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
    benefits: Map<string, string>;
    officeBudget: Map<string, string> | null;
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
    functionalApartmentSince: Date | null;
    functionalApartmentUntil: Date | null;
    housingAllowanceReceived: string;
    officialTripCount: number;
    hasDiplomaticPassport: boolean;
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
function parseBrazilianMoney(text: string): string | null {
    const match = /^(\d{1,3}(?:\.\d{3})*)(?:,(\d{2}))?$/.exec(text);
    return match ? `${match[1]!.replaceAll(".", "")}${match[2] ? `.${match[2]}` : ""}` : null;
}

// "16/04/2019" in Brasília time
function parseBrazilianDate(text: string): Date {
    const [day, month, year] = text.split("/");
    return new Date(`${year}-${month}-${day}T00:00:00-03:00`);
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

function parseFunctionalApartment(page: ParsedDeputyPage): { since: Date | null; until: Date | null } {
    const value = requireBenefit(page, "Imóvel funcional");
    if (value === "Não fez uso") {
        return { since: null, until: null };
    }
    const inUse = /^Faz uso desde (\d{2}\/\d{2}\/\d{4})$/.exec(value);
    if (inUse) {
        return { since: parseBrazilianDate(inUse[1]!), until: null };
    }
    const used = /^Fez uso de (\d{2}\/\d{2}\/\d{4}) a (\d{2}\/\d{2}\/\d{4})$/.exec(value);
    if (used) {
        return { since: parseBrazilianDate(used[1]!), until: parseBrazilianDate(used[2]!) };
    }
    throw new PageStructureError(page.url, `Imóvel funcional "${value}"`);
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
            const pageCount = deputies.length * years.length;
            for (const year of years) {
                for (const deputy of deputies) {
                    const url = `https://www.camara.leg.br/deputados/${deputy.id}?ano=${year}`;
                    pages.push({ deputyId: deputy.id, year, url, html: await fetchCamaraPage(url) });
                    if (pages.length % 100 === 0) {
                        console.log(`camara-deputy-pages: fetched ${pages.length} of ${pageCount} pages`);
                    }
                }
            }
            return pages;
        },

        parse(rawData: DeputyPage[]): ParsedDeputyPage[] {
            const parsedPages: ParsedDeputyPage[] = [];
            let pagesWithoutData = 0;

            for (const page of rawData) {
                const root = parseHtml(page.html);
                const attendance = root.querySelector("div.presencas");
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

                let plenary: AttendanceCounts | null = null;
                let committees: AttendanceCounts | null = null;
                for (const section of attendance.querySelectorAll("section.presencas__section")) {
                    const heading = section.querySelector(".presencas__section-heading");
                    if (!heading) {
                        continue;
                    }
                    const headingText = cleanText(heading);
                    if (headingText.includes("Plenário")) {
                        plenary = parseAttendanceSection(section, page.url);
                    } else if (headingText.includes("Comissões")) {
                        committees = parseAttendanceSection(section, page.url);
                    }
                }
                if (!plenary || !committees) {
                    throw new PageStructureError(page.url, "missing plenary or committee attendance");
                }

                // titles end with the "?" of their help button
                const benefits = new Map<string, string>();
                for (const benefit of benefitList.querySelectorAll("div.beneficio")) {
                    const title = benefit.querySelector(".beneficio__titulo");
                    const info = benefit.querySelector(".beneficio__info");
                    if (title && info) {
                        benefits.set(cleanText(title).replace(/\s*\?$/, ""), cleanText(info));
                    }
                }

                const officeBudget = officeBudgetTable ? new Map<string, string>() : null;
                for (const row of officeBudgetTable?.querySelectorAll("tbody tr") ?? []) {
                    const [label, total] = row.querySelectorAll("td").map(cleanText);
                    if (label !== undefined && total !== undefined) {
                        officeBudget?.set(label, total);
                    }
                }

                parsedPages.push({ ...page, plenary, committees, benefits, officeBudget });
            }

            console.log(`camara-deputy-pages: skipped ${pagesWithoutData} pages without data for the year`);
            return parsedPages;
        },

        normalize(parsedRecords: ParsedDeputyPage[], context: CollectionContext): NormalizedDeputyAnnualSummary[] {
            return parsedRecords.map((page) => {
                checkSalary(page);
                const functionalApartment = parseFunctionalApartment(page);
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
                    functionalApartmentSince: functionalApartment.since,
                    functionalApartmentUntil: functionalApartment.until,
                    housingAllowanceReceived: parseHousingAllowance(page),
                    officialTripCount: parseCount(page, "Viagens em missão oficial", /^(\d+)$/),
                    hasDiplomaticPassport: parseDiplomaticPassport(page),
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
                        functional_apartment_since, functional_apartment_until,
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
                        ${batch.map((row) => (row.functionalApartmentSince ? toUtcText(row.functionalApartmentSince) : null))}::timestamp[],
                        ${batch.map((row) => (row.functionalApartmentUntil ? toUtcText(row.functionalApartmentUntil) : null))}::timestamp[],
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
                        functional_apartment_since = EXCLUDED.functional_apartment_since,
                        functional_apartment_until = EXCLUDED.functional_apartment_until,
                        housing_allowance_received = EXCLUDED.housing_allowance_received,
                        official_trip_count = EXCLUDED.official_trip_count,
                        has_diplomatic_passport = EXCLUDED.has_diplomatic_passport,
                        source_url = EXCLUDED.source_url,
                        collected_at = EXCLUDED.collected_at`;
            }

            return { insertedOrUpdatedCount: normalizedRecords.length };
        },
    };
}