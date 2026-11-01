import { prisma } from "../client";
import { quotaLimitTableFor } from "../deputyQuotaLimits";
import { readQuotaSpending, type DeputyQuotaSpending } from "./deputyProfile";

export interface DeputySpendingCategory {
    expenseTypeCode: number;
    description: string;
    total: number;
    receiptCount: number;
}

export interface DeputySpendingSupplier {
    id: number;
    kind: "COMPANY" | "PERSON";
    // full CNPJ for companies, masked CPF for people
    document: string;
    name: string;
    total: number;
    receiptCount: number;
}

// one row of the CEAP file; the supplier is referenced by id to keep the page small
export interface DeputyReceipt {
    id: number;
    month: number;
    // date printed on the receipt as yyyy-mm-dd, null when the file has none
    issuedOn: string | null;
    documentNumber: string | null;
    netValue: number;
    disallowedValue: number;
    expenseTypeCode: number;
    supplierId: number;
    documentUrl: string | null;
}

export interface DeputyQuotaLimit {
    // sum of the monthly limits from the first to the last month with expenses
    total: number;
    firstMonth: number;
    lastMonth: number;
    // the latest monthly limit of the period
    monthlyLimit: number;
    acts: { actName: string; sourceUrl: string; collectedAt: string }[];
}

export interface DeputySpending {
    quota: DeputyQuotaSpending;
    categories: DeputySpendingCategory[];
    // net total of each month, January first
    monthlyTotals: number[];
    suppliers: DeputySpendingSupplier[];
    receipts: DeputyReceipt[];
    flights: { ticketCount: number; passengerCount: number; collectedAt: Date } | null;
    limit: DeputyQuotaLimit | null;
}

interface CategoryRow {
    expense_type_code: number;
    description: string;
    total: string;
    receipt_count: bigint;
}

interface SupplierRow {
    id: number;
    kind: "COMPANY" | "PERSON";
    document: string;
    name: string;
    total: string;
    receipt_count: bigint;
}

// limits of the months between the first and the last month with expenses, with the table in force in each month
function buildQuotaLimit(stateCode: string, year: number, monthsWithExpenses: number[]): DeputyQuotaLimit | null {
    if (monthsWithExpenses.length === 0) {
        return null;
    }
    const firstMonth = Math.min(...monthsWithExpenses);
    const lastMonth = Math.max(...monthsWithExpenses);
    let total = 0;
    let monthlyLimit = 0;
    const acts = new Map<string, DeputyQuotaLimit["acts"][number]>();
    for (let month = firstMonth; month <= lastMonth; month++) {
        const table = quotaLimitTableFor(year, month);
        const value = table?.monthlyLimitByState[stateCode];
        if (!table || value === undefined) {
            return null;
        }
        monthlyLimit = Number(value);
        total += monthlyLimit;
        acts.set(table.actName, { actName: table.actName, sourceUrl: table.sourceUrl, collectedAt: table.collectedAt });
    }
    return { total, firstMonth, lastMonth, monthlyLimit, acts: [...acts.values()] };
}

function isoDate(date: Date | null): string | null {
    return date ? date.toISOString().slice(0, 10) : null;
}

// everything of the "Pra onde foi o dinheiro?" page for one deputy and year; null when the year has no expenses
export async function getDeputySpending(deputyId: number, stateCode: string, year: number): Promise<DeputySpending | null> {
    const [quota, categoryRows, supplierRows, expenses, flightSummary] = await Promise.all([
        readQuotaSpending(deputyId, stateCode, year),
        prisma.$queryRaw<CategoryRow[]>`
            select e.expense_type_code, t.description, sum(e.net_value)::text as total, count(*) as receipt_count
            from expenses e
            join expense_types t on t.code = e.expense_type_code
            where e.deputy_id = ${deputyId} and e.year = ${year}
            group by e.expense_type_code, t.description
            order by sum(e.net_value) desc
        `,
        prisma.$queryRaw<SupplierRow[]>`
            select s.id, s.kind::text as kind, s.document, s.name, sum(e.net_value)::text as total, count(*) as receipt_count
            from expenses e
            join suppliers s on s.id = e.supplier_id
            where e.deputy_id = ${deputyId} and e.year = ${year}
            group by s.id
            order by sum(e.net_value) desc, s.name
        `,
        prisma.expense.findMany({
            where: { deputyId, year },
            select: {
                id: true,
                month: true,
                issuedAt: true,
                documentNumber: true,
                netValue: true,
                disallowedValue: true,
                expenseTypeCode: true,
                supplierId: true,
                documentUrl: true,
            },
            orderBy: [{ month: "desc" }, { issuedAt: "desc" }, { id: "desc" }],
        }),
        prisma.deputyFlightSummary.findUnique({ where: { deputyId_year: { deputyId, year } } }),
    ]);
    if (!quota) {
        return null;
    }

    const monthlyTotals = Array.from({ length: 12 }, () => 0);
    for (const expense of expenses) {
        monthlyTotals[expense.month - 1] = (monthlyTotals[expense.month - 1] ?? 0) + Number(expense.netValue);
    }
    const monthsWithExpenses = [...new Set(expenses.map((expense) => expense.month))];

    return {
        quota,
        categories: categoryRows.map((row) => ({
            expenseTypeCode: row.expense_type_code,
            description: row.description,
            total: Number(row.total),
            receiptCount: Number(row.receipt_count),
        })),
        monthlyTotals,
        suppliers: supplierRows.map((row) => ({
            id: row.id,
            kind: row.kind,
            document: row.document,
            name: row.name,
            total: Number(row.total),
            receiptCount: Number(row.receipt_count),
        })),
        receipts: expenses.map((expense) => ({
            id: expense.id,
            month: expense.month,
            issuedOn: isoDate(expense.issuedAt),
            documentNumber: expense.documentNumber,
            netValue: Number(expense.netValue),
            disallowedValue: Number(expense.disallowedValue),
            expenseTypeCode: expense.expenseTypeCode,
            supplierId: expense.supplierId,
            documentUrl: expense.documentUrl,
        })),
        flights:
            flightSummary && flightSummary.ticketCount > 0
                ? { ticketCount: flightSummary.ticketCount, passengerCount: flightSummary.passengerCount, collectedAt: flightSummary.collectedAt }
                : null,
        limit: buildQuotaLimit(stateCode, year, monthsWithExpenses),
    };
}