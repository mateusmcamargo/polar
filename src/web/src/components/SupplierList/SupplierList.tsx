"use client";

import { useState } from "react";
import type { DeputySpendingSupplier } from "@polar/db";
import { RECEIPTS_SECTION_ID, writeReceiptFilters } from "@/components/ReceiptList/receiptFilters";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import styles from "./SupplierList.module.scss";

const TOP_SUPPLIERS = 10;

const wholeMoneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

interface SupplierListProps {
    suppliers: DeputySpendingSupplier[];
    total: number;
}

// the receipts of one supplier, with the other filters cleared so the list is never empty
function showReceiptsOf(supplierId: number) {
    writeReceiptFilters({ expenseTypeCode: null, month: null, supplierId });
    const section = document.getElementById(RECEIPTS_SECTION_ID);
    section?.scrollIntoView({ block: "start" });
    section?.focus({ preventScroll: true });
}

function SupplierRows({ suppliers, total }: Readonly<SupplierListProps>) {
    return (
        <ol className={styles.rows}>
            {suppliers.map((supplier) => (
                <li key={supplier.id} data-reveal="rise">
                    <span className={styles.name}>{supplier.name}</span>
                    <span className={styles.value}>{wholeMoneyFormat.format(supplier.total)}</span>
                    <span className={styles.document}>
                        {supplier.kind === "COMPANY" ? "Empresa, CNPJ" : "Pessoa, CPF"} {supplier.document}
                    </span>
                    <span className={styles.share}>{total > 0 ? `${Math.max(0, Math.round((supplier.total / total) * 100))}%` : ""}</span>
                    <button type="button" className={styles.show} onClick={() => showReceiptsOf(supplier.id)}>
                        Ver {supplier.receiptCount === 1 ? "a nota" : `as ${supplier.receiptCount.toLocaleString("pt-BR")} notas`}
                        <span className="visually-hidden"> de {supplier.name}</span>
                    </button>
                </li>
            ))}
        </ol>
    );
}

export function SupplierList({ suppliers, total }: Readonly<SupplierListProps>) {
    const [showsAll, setShowsAll] = useState(false);
    const hasMore = suppliers.length > TOP_SUPPLIERS;

    return (
        <div className={styles.suppliers}>
            {showsAll ? (
                <ScrollSlider direction="vertical" className={styles.scroll} tabIndex={0} role="region" aria-label="Todos os fornecedores">
                    <SupplierRows suppliers={suppliers} total={total} />
                </ScrollSlider>
            ) : (
                <SupplierRows suppliers={suppliers.slice(0, TOP_SUPPLIERS)} total={total} />
            )}
            {hasMore && (
                <button type="button" className={styles.toggle} aria-expanded={showsAll} onClick={() => setShowsAll(!showsAll)}>
                    {showsAll ? `Mostrar só os ${TOP_SUPPLIERS} maiores` : `Ver todos os ${suppliers.length} fornecedores`}
                </button>
            )}
        </div>
    );
}

// suppliers while they load: name, document and the amount with its share
export function SupplierListSkeleton() {
    return <SkeletonRows count={6} hasMeta hasValue />;
}