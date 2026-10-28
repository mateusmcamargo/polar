import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { parse as parseCsv } from "csv-parse/sync";
import { prisma } from "@polar/db";
import type { CollectionContext, SourceAdapter } from "../sourceAdapter";
import { splitIntoBatches } from "../splitIntoBatches";

const execFileAsync = promisify(execFile);

const USER_AGENT = "polar-ingestion (open data platform, contact via repository)";
const MAX_UNZIPPED_BYTES = 1024 * 1024 * 1024;
const WRITE_BATCH_SIZE = 4000;
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;
const FLIGHT_DESCRIPTION_PREFIX = "PASSAGEM AÉREA";

interface ExpenseCsvRow {
    ideCadastro: string;
    numSubCota: string;
    txtDescricao: string;
    txtFornecedor: string;
    txtCNPJCPF: string;
    txtNumero: string;
    datEmissao: string;
    vlrDocumento: string;
    vlrGlosa: string;
    vlrLiquido: string;
    numMes: string;
    numAno: string;
    txtPassageiro: string;
    urlDocumento: string;
}

interface NormalizedExpenseType {
    code: number;
    description: string;
}

interface NormalizedSupplier {
    kind: "COMPANY" | "PERSON";
    document: string;
    name: string;
}

interface NormalizedExpense {
    deputyId: number;
    expenseTypeCode: number;
    supplierKey: string;
    year: number;
    month: number;
    issuedAt: Date | null;
    documentNumber: string | null;
    grossValue: string;
    disallowedValue: string;
    netValue: string;
    documentUrl: string | null;
    collectedAt: Date;
}

interface NormalizedFlightSummary {
    deputyId: number;
    year: number;
    ticketCount: number;
    passengerCount: number;
    collectedAt: Date;
}

interface NormalizedCamaraExpenses {
    year: number;
    expenseTypes: NormalizedExpenseType[];
    suppliers: NormalizedSupplier[];
    expenses: NormalizedExpense[];
    flightSummaries: NormalizedFlightSummary[];
}

function buildSupplierKey(supplier: { document: string; name: string }): string {
    return `${supplier.document}|${supplier.name}`;
}

// CNPJ is public and shown in full; the CPF of a person keeps only the middle digits
function normalizeSupplierDocument(rawDocument: string): Pick<NormalizedSupplier, "kind" | "document"> {
    const digits = rawDocument.replace(/\D/g, "");
    if (digits.length === 14) {
        const formatted = digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        return { kind: "COMPANY", document: formatted };
    }
    if (digits.length === 11) {
        return { kind: "PERSON", document: `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**` };
    }
    throw new Error(`camara-expenses: supplier document with ${digits.length} digits`);
}

function normalizePassengerName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
}

function buildFlightSummaries(
    expenses: NormalizedExpense[],
    flightPassengersByExpense: Map<NormalizedExpense, string>,
    year: number,
    collectedAt: Date,
): NormalizedFlightSummary[] {
    const ticketCountByDeputy = new Map<number, number>();
    const passengersByDeputy = new Map<number, Set<string>>();

    for (const [expense, passengerName] of flightPassengersByExpense) {
        // cancellations and refunds have a negative net value and are not tickets
        if (Number(expense.netValue) <= 0) {
            continue;
        }
        ticketCountByDeputy.set(expense.deputyId, (ticketCountByDeputy.get(expense.deputyId) ?? 0) + 1);
        const passengers = passengersByDeputy.get(expense.deputyId) ?? new Set<string>();
        const normalizedName = normalizePassengerName(passengerName);
        if (normalizedName) {
            passengers.add(normalizedName);
        }
        passengersByDeputy.set(expense.deputyId, passengers);
    }

    return [...ticketCountByDeputy].map(([deputyId, ticketCount]) => ({
        deputyId,
        year,
        ticketCount,
        passengerCount: passengersByDeputy.get(deputyId)?.size ?? 0,
        collectedAt,
    }));
}

export function createCamaraExpensesAdapter(
    year: number,
): SourceAdapter<string, ExpenseCsvRow, NormalizedCamaraExpenses> {
    return {
        name: "camara-expenses",

        // the zip is read with the system unzip, which needs a file instead of a stream
        async fetch(): Promise<string> {
            const url = `https://www.camara.leg.br/cotas/Ano-${year}.csv.zip`;
            const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
            if (!response.ok) {
                throw new Error(`${url} answered ${response.status}`);
            }

            const temporaryDirectory = await mkdtemp(join(tmpdir(), "polar-ceap-"));
            try {
                const zipPath = join(temporaryDirectory, `Ano-${year}.csv.zip`);
                await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
                const { stdout } = await execFileAsync("unzip", ["-p", zipPath], {
                    encoding: "utf8",
                    maxBuffer: MAX_UNZIPPED_BYTES,
                });
                return stdout;
            } finally {
                await rm(temporaryDirectory, { recursive: true, force: true });
            }
        },

        parse(csvText: string): ExpenseCsvRow[] {
            return parseCsv(csvText, { columns: true, delimiter: ";", bom: true }) as ExpenseCsvRow[];
        },

        normalize(rows: ExpenseCsvRow[], context: CollectionContext): NormalizedCamaraExpenses[] {
            const { collectedAt } = context;
            const expenseTypesByCode = new Map<number, NormalizedExpenseType>();
            const suppliersByKey = new Map<string, NormalizedSupplier>();
            const expenses: NormalizedExpense[] = [];
            const flightPassengersByExpense = new Map<NormalizedExpense, string>();
            let skippedPartyLeadershipRows = 0;

            for (const row of rows) {
                // rows without ideCadastro belong to party leaderships, not to deputies
                if (!row.ideCadastro) {
                    skippedPartyLeadershipRows++;
                    continue;
                }
                if (Number(row.numAno) !== year) {
                    throw new Error(`camara-expenses: row of ${row.numAno} inside the ${year} file`);
                }

                const expenseTypeCode = Number(row.numSubCota);
                expenseTypesByCode.set(expenseTypeCode, {
                    code: expenseTypeCode,
                    description: row.txtDescricao,
                });

                const supplier = {
                    ...normalizeSupplierDocument(row.txtCNPJCPF),
                    name: row.txtFornecedor,
                };
                const supplierKey = buildSupplierKey(supplier);
                suppliersByKey.set(supplierKey, supplier);

                const expense: NormalizedExpense = {
                    deputyId: Number(row.ideCadastro),
                    expenseTypeCode,
                    supplierKey,
                    year,
                    month: Number(row.numMes),
                    // the source date has no zone; stored as midnight UTC so the day never shifts
                    issuedAt: row.datEmissao ? new Date(`${row.datEmissao}Z`) : null,
                    documentNumber: row.txtNumero || null,
                    grossValue: row.vlrDocumento,
                    // refunds of the housing allowance complement come without glosa
                    disallowedValue: row.vlrGlosa || "0",
                    netValue: row.vlrLiquido,
                    documentUrl: row.urlDocumento || null,
                    collectedAt,
                };
                expenses.push(expense);

                // passenger names are only read here to count people, never stored
                if (row.txtDescricao.startsWith(FLIGHT_DESCRIPTION_PREFIX)) {
                    flightPassengersByExpense.set(expense, row.txtPassageiro);
                }
            }

            console.log(`camara-expenses: skipped ${skippedPartyLeadershipRows} party leadership rows`);

            return [
                {
                    year,
                    expenseTypes: [...expenseTypesByCode.values()],
                    suppliers: [...suppliersByKey.values()],
                    expenses,
                    flightSummaries: buildFlightSummaries(expenses, flightPassengersByExpense, year, collectedAt),
                },
            ];
        },

        async upsert(normalizedRecords: NormalizedCamaraExpenses[]) {
            const records = normalizedRecords[0];
            if (!records) {
                throw new Error("camara-expenses: nothing to write");
            }

            const knownDeputyIds = new Set((await prisma.deputy.findMany({ select: { id: true } })).map(({ id }) => id));
            const missingDeputyIds = [
                ...new Set(records.expenses.map((expense) => expense.deputyId).filter((id) => !knownDeputyIds.has(id))),
            ];
            if (missingDeputyIds.length > 0) {
                throw new Error(
                    `camara-expenses: deputies ${missingDeputyIds.join(", ")} are not in the database, run camara-deputies first`,
                );
            }

            for (const expenseType of records.expenseTypes) {
                await prisma.expenseType.upsert({
                    where: { code: expenseType.code },
                    create: expenseType,
                    update: expenseType,
                });
            }

            // suppliers are shared by every year, so they are only added, never removed
            for (const batch of splitIntoBatches(records.suppliers, WRITE_BATCH_SIZE)) {
                await prisma.supplier.createMany({ data: batch, skipDuplicates: true });
            }
            const supplierIdsByKey = new Map(
                (await prisma.supplier.findMany()).map((supplier) => [buildSupplierKey(supplier), supplier.id]),
            );

            // the files have no row key, so the whole year is replaced in one transaction
            await prisma.$transaction(
                async (transaction) => {
                    await transaction.expense.deleteMany({ where: { year: records.year } });
                    for (const batch of splitIntoBatches(records.expenses, WRITE_BATCH_SIZE)) {
                        await transaction.expense.createMany({
                            data: batch.map(({ supplierKey, ...expense }) => {
                                const supplierId = supplierIdsByKey.get(supplierKey);
                                if (supplierId === undefined) {
                                    throw new Error(`camara-expenses: supplier ${supplierKey} was not written`);
                                }
                                return { ...expense, supplierId };
                            }),
                        });
                    }

                    await transaction.deputyFlightSummary.deleteMany({ where: { year: records.year } });
                    await transaction.deputyFlightSummary.createMany({ data: records.flightSummaries });
                },
                { timeout: TRANSACTION_TIMEOUT_MS },
            );

            return {
                insertedOrUpdatedCount:
                    records.expenses.length + records.flightSummaries.length + records.suppliers.length,
            };
        },
    };
}