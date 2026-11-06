import type { DeputySpendingCategory } from "@polar/db";
import { EXPENSE_TYPE_LABELS } from "@/components/MoneySummary/expenseTypeLabels";
import { capitalizedMonthName } from "./months";
import { SkeletonBars, SkeletonRows } from "@/components/Skeleton/Skeleton";
import styles from "./SpendingBreakdown.module.scss";

const wholeMoneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function shareOf(part: number, whole: number): number {
    return whole <= 0 ? 0 : Math.max(0, (part / whole) * 100);
}

// small categories would round to "0%"
function shareText(share: number): string {
    return share > 0 && share < 1 ? "menos de 1%" : `${Math.round(share)}%`;
}

function receiptsText(count: number): string {
    return `${count.toLocaleString("pt-BR")} ${count === 1 ? "nota" : "notas"}`;
}

interface CategoryListProps {
    categories: DeputySpendingCategory[];
    total: number;
    flights: { ticketCount: number; passengerCount: number } | null;
}

// every CEAP category of the year, largest first, with its share of the total
export function CategoryList({ categories, total, flights }: Readonly<CategoryListProps>) {
    return (
        <div className={styles.breakdown}>
            <ul className={styles.rows}>
                {categories.map((category) => {
                    const share = shareOf(category.total, total);
                    return (
                        <li key={category.expenseTypeCode}>
                            <span className={styles.name}>{EXPENSE_TYPE_LABELS[category.expenseTypeCode] ?? category.description}</span>
                            <span className={styles.value}>{wholeMoneyFormat.format(category.total)}</span>
                            <span className={styles.line} aria-hidden="true">
                                <i data-reveal="fill" style={{ width: `${share}%` }} />
                            </span>
                            <span className={styles.detail}>
                                {shareText(share)} do total, {receiptsText(category.receiptCount)}
                            </span>
                        </li>
                    );
                })}
            </ul>
            {flights && (
                <p className={styles.flights}>
                    Passagens aéreas pagas pela cota: <strong>{flights.ticketCount}</strong>{" "}
                    {flights.ticketCount === 1 ? "bilhete" : "bilhetes"} para <strong>{flights.passengerCount}</strong>{" "}
                    {flights.passengerCount === 1 ? "pessoa" : "pessoas diferentes"}. As regras da cota permitem comprar passagens para assessores.
                </p>
            )}
        </div>
    );
}

interface MonthlyTotalsProps {
    monthlyTotals: number[];
}

// one row per month instead of vertical bars, so the values stay readable on phones
export function MonthlyTotals({ monthlyTotals }: Readonly<MonthlyTotalsProps>) {
    const largest = Math.max(0, ...monthlyTotals);
    const largestMonth = largest > 0 ? monthlyTotals.indexOf(largest) + 1 : null;

    return (
        <ol className={styles.months}>
            {monthlyTotals.map((value, index) => {
                const month = index + 1;
                return (
                    <li key={month} className={month === largestMonth ? styles.largest : undefined}>
                        <span>{capitalizedMonthName(month)}</span>
                        <span className={styles.track} aria-hidden="true">
                            <i data-reveal="fill" style={{ width: `${shareOf(value, largest)}%` }} />
                        </span>
                        <span className={styles.value}>
                            {value === 0 ? "Sem gastos" : wholeMoneyFormat.format(value)}
                            {month === largestMonth && <span className="visually-hidden"> (mês com mais gastos)</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

// expense types while they load: name, amount and the share line
export function CategoryListSkeleton() {
    return <SkeletonRows count={6} hasValue hasTrack />;
}

// the twelve months of the year while they load
export function MonthlyTotalsSkeleton() {
    return <SkeletonBars count={12} />;
}