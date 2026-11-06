"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { DeputyReceipt, DeputySpendingSupplier } from "@polar/db";
import { Explanation } from "@/components/Explanation/Explanation";
import { capitalizedMonthName } from "@/components/SpendingBreakdown/months";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { useReceiptFilters, writeReceiptFilters, type ReceiptFilters } from "./receiptFilters";
import { SkeletonControls, SkeletonRows, SkeletonStack } from "@/components/Skeleton/Skeleton";
import styles from "./ReceiptList.module.scss";

// rows rendered at a time; the biggest years have about 2,000 receipts
const PAGE_SIZE = 50;

const exactMoneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export interface ReceiptCategory {
    expenseTypeCode: number;
    label: string;
}

interface ReceiptListProps {
    receipts: DeputyReceipt[];
    suppliers: DeputySpendingSupplier[];
    categories: ReceiptCategory[];
}

// "2025-03-04" to "04/03/2025"
function receiptDate(receipt: DeputyReceipt): string {
    if (!receipt.issuedOn) {
        return `Mês: ${capitalizedMonthName(receipt.month).toLowerCase()}`;
    }
    const [year, month, day] = receipt.issuedOn.split("-");
    return `${day}/${month}/${year}`;
}

function matches(receipt: DeputyReceipt, filters: ReceiptFilters): boolean {
    return (
        (filters.expenseTypeCode === null || receipt.expenseTypeCode === filters.expenseTypeCode) &&
        (filters.month === null || receipt.month === filters.month) &&
        (filters.supplierId === null || receipt.supplierId === filters.supplierId)
    );
}

function receiptsWord(count: number): string {
    return count === 1 ? "nota" : "notas";
}

interface FilterSelectProps {
    id: string;
    label: string;
    value: number | null;
    allLabel: string;
    options: { value: number; label: string }[];
    onChange: (value: number | null) => void;
}

function FilterSelect({ id, label, value, allLabel, options, onChange }: Readonly<FilterSelectProps>) {
    return (
        <label className={styles.field} htmlFor={id}>
            {label}
            <span className={styles.selectBox}>
                <select
                    id={id}
                    className={styles.select}
                    value={value ?? ""}
                    onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
                >
                    <option value="">{allLabel}</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className={styles.selectIcon} aria-hidden="true" />
            </span>
        </label>
    );
}

export function ReceiptList({ receipts, suppliers, categories }: Readonly<ReceiptListProps>) {
    const filters = useReceiptFilters();
    const filterKey = `${filters.expenseTypeCode}-${filters.month}-${filters.supplierId}`;
    const [visible, setVisible] = useState({ filterKey, count: PAGE_SIZE });
    const visibleCount = visible.filterKey === filterKey ? visible.count : PAGE_SIZE;

    const suppliersById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);
    const categoryLabels = useMemo(
        () => new Map(categories.map((category) => [category.expenseTypeCode, category.label])),
        [categories],
    );
    const monthOptions = useMemo(
        () =>
            [...new Set(receipts.map((receipt) => receipt.month))]
                .sort((first, second) => first - second)
                .map((month) => ({ value: month, label: capitalizedMonthName(month) })),
        [receipts],
    );
    const supplierOptions = useMemo(
        () =>
            [...suppliers]
                .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"))
                .map((supplier) => ({ value: supplier.id, label: supplier.name })),
        [suppliers],
    );

    const shown = useMemo(() => receipts.filter((receipt) => matches(receipt, filters)), [receipts, filters]);
    const shownTotal = shown.reduce((sum, receipt) => sum + receipt.netValue, 0);
    const hasFilters = filters.expenseTypeCode !== null || filters.month !== null || filters.supplierId !== null;

    function updateFilters(changes: Partial<ReceiptFilters>) {
        writeReceiptFilters({ ...filters, ...changes });
    }

    return (
        <div className={styles.receipts}>
            <div className={styles.filters}>
                <FilterSelect
                    id="receipt-category"
                    label="Tipo de gasto"
                    value={filters.expenseTypeCode}
                    allLabel="Todos os tipos"
                    options={categories.map((category) => ({ value: category.expenseTypeCode, label: category.label }))}
                    onChange={(expenseTypeCode) => updateFilters({ expenseTypeCode })}
                />
                <FilterSelect
                    id="receipt-month"
                    label="Mês"
                    value={filters.month}
                    allLabel="Todos os meses"
                    options={monthOptions}
                    onChange={(month) => updateFilters({ month })}
                />
                <FilterSelect
                    id="receipt-supplier"
                    label="Fornecedor"
                    value={filters.supplierId}
                    allLabel="Todos os fornecedores"
                    options={supplierOptions}
                    onChange={(supplierId) => updateFilters({ supplierId })}
                />
            </div>

            <div className={styles.status}>
                <p aria-live="polite">
                    <strong>{shown.length.toLocaleString("pt-BR")}</strong> {receiptsWord(shown.length)}, somando{" "}
                    <strong>{exactMoneyFormat.format(shownTotal)}</strong>.
                </p>
                {hasFilters && (
                    <button
                        type="button"
                        className={styles.clear}
                        onClick={() => writeReceiptFilters({ expenseTypeCode: null, month: null, supplierId: null })}
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            <div className={styles.legend}>
                <span className={styles.tagRefused}>Parte recusada</span>
                <span className={styles.tagRefund}>Devolução</span>
                <Explanation subject="parte recusada e devolução">
                    <p>
                        <strong>Parte recusada:</strong> a Câmara confere cada nota e pode recusar uma parte do valor quando o gasto não
                        segue as regras da cota. Mostramos só o valor que a Câmara pagou.
                    </p>
                    <p>
                        <strong>Devolução:</strong> um valor negativo, que desconta um gasto anterior, por exemplo quando uma passagem é
                        cancelada.
                    </p>
                </Explanation>
            </div>

            {shown.length === 0 ? (
                <p className={styles.empty}>Nenhuma nota com esses filtros.</p>
            ) : (
                <ScrollSlider direction="vertical" className={styles.scroll} tabIndex={0} role="region" aria-label="Notas da cota parlamentar">
                    <ol className={styles.rows}>
                        {shown.slice(0, visibleCount).map((receipt) => {
                            const supplier = suppliersById.get(receipt.supplierId);
                            const date = receiptDate(receipt);
                            return (
                                <li key={receipt.id} data-reveal="rise">
                                    <span className={styles.supplier}>{supplier?.name ?? "Fornecedor não informado"}</span>
                                    <span className={receipt.netValue < 0 ? styles.negative : styles.value}>
                                        {exactMoneyFormat.format(receipt.netValue)}
                                    </span>
                                    <span className={styles.meta}>
                                        {categoryLabels.get(receipt.expenseTypeCode) ?? "Outros"} · {date}
                                        {receipt.documentNumber && ` · Nota nº ${receipt.documentNumber}`}
                                    </span>
                                    {(receipt.disallowedValue > 0 || receipt.netValue < 0) && (
                                        <span className={styles.tags}>
                                            {receipt.disallowedValue > 0 && (
                                                <span className={styles.tagRefused}>
                                                    Parte recusada: {exactMoneyFormat.format(receipt.disallowedValue)}
                                                </span>
                                            )}
                                            {receipt.netValue < 0 && <span className={styles.tagRefund}>Devolução</span>}
                                        </span>
                                    )}
                                    {receipt.documentUrl ? (
                                        <a className={styles.document} href={receipt.documentUrl} target="_blank" rel="noopener noreferrer">
                                            Ver comprovante
                                            <span className="visually-hidden">
                                                {" "}
                                                de {supplier?.name ?? "fornecedor não informado"}, {date} (abre o site da Câmara em outra aba)
                                            </span>
                                            <ExternalLink aria-hidden="true" />
                                        </a>
                                    ) : (
                                        <span className={styles.noDocument}>Comprovante não publicado pela Câmara</span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                    {shown.length > visibleCount && (
                        <button
                            type="button"
                            className={styles.more}
                            onClick={() => setVisible({ filterKey, count: visibleCount + PAGE_SIZE })}
                        >
                            Mostrar mais {Math.min(PAGE_SIZE, shown.length - visibleCount)} de {shown.length - visibleCount}
                        </button>
                    )}
                </ScrollSlider>
            )}
        </div>
    );
}

// the three filters and the first receipts while they load
export function ReceiptListSkeleton() {
    return (
        <SkeletonStack>
            <SkeletonControls count={3} />
            <SkeletonRows count={6} hasMeta hasValue />
        </SkeletonStack>
    );
}