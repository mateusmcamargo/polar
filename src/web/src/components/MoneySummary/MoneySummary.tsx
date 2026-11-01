import type { DeputyBenefits, DeputyQuotaSpending } from "@polar/db";
import { DEPUTY_SALARY } from "@polar/db/deputy-salary";
import { EXPENSE_TYPE_LABELS } from "./expenseTypeLabels";
import styles from "./MoneySummary.module.scss";

const wholeMoneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const exactMoneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function thousandsText(value: number): string {
    return `R$ ${Math.round(value / 1000).toLocaleString("pt-BR")} mil`;
}

function comparisonText(total: number, average: number, groupName: string): string {
    const difference = Math.round(total - average);
    if (difference === 0) {
        return `O mesmo que a média ${groupName}.`;
    }
    return `${wholeMoneyFormat.format(Math.abs(difference))} ${difference > 0 ? "a mais" : "a menos"} que a média ${groupName}.`;
}

// "2024-08-16" to "16/08/2024"
function isoDateText(isoDate: string): string {
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
}

// "Usa desde 16/08/2024", "Usou de 28/06/2024 a 10/03/2025 e de 01/07/2025 a 30/03/2026"
function apartmentText(benefits: DeputyBenefits): string {
    const periods = benefits.functionalApartmentPeriods;
    const closed = periods.filter((period) => period.until !== null);
    const open = periods.find((period) => period.until === null);
    const parts: string[] = [];
    if (closed.length > 0) {
        parts.push(`Usou ${closed.map((period) => `de ${isoDateText(period.since)} a ${isoDateText(period.until ?? "")}`).join(" e ")}`);
    }
    if (open) {
        parts.push(`${parts.length > 0 ? "usa" : "Usa"} desde ${isoDateText(open.since)}`);
    }
    return parts.length > 0 ? parts.join("; ") : "Não usou";
}

interface QuotaSummaryProps {
    deputyName: string;
    statePhrase: string;
    quota: DeputyQuotaSpending;
    // the spending page lists every category in its own block
    showsTopCategories?: boolean;
}

export function QuotaSummary({ deputyName, statePhrase, quota, showsTopCategories = true }: Readonly<QuotaSummaryProps>) {
    const largest = Math.max(quota.total, quota.stateAverage, quota.chamberAverage);
    const bars = [
        { key: "own", label: deputyName, value: quota.total, isOwn: true },
        { key: "state", label: `Média ${statePhrase}`, value: quota.stateAverage, isOwn: false },
        { key: "chamber", label: "Média da Câmara", value: quota.chamberAverage, isOwn: false },
    ];

    return (
        <div className={styles.quota}>
            <div className={styles.total}>
                <span className={styles.label}>Cota parlamentar</span>
                <span className={styles.figure}>{wholeMoneyFormat.format(quota.total)}</span>
                <span>{comparisonText(quota.total, quota.stateAverage, `dos deputados ${statePhrase}`)}</span>
            </div>
            <div
                className={styles.compare}
                role="img"
                aria-label={`Comparação: ${bars.map((bar) => `${bar.label}, ${thousandsText(bar.value)}`).join("; ")}`}
            >
                {bars.map((bar) => (
                    <div key={bar.key} className={bar.isOwn ? styles.own : undefined}>
                        <span>{bar.label}</span>
                        <span className={styles.track}>
                            <i style={{ width: `${largest === 0 ? 0 : (bar.value / largest) * 100}%` }} />
                        </span>
                        <span>{thousandsText(bar.value)}</span>
                    </div>
                ))}
            </div>
            {showsTopCategories && quota.topCategories.length > 0 && (
                <>
                    <h3 className={styles.subtitle}>Onde mais gastou</h3>
                    <ul className={styles.categories}>
                        {quota.topCategories.map((category) => (
                            <li key={category.expenseTypeCode}>
                                <span>{EXPENSE_TYPE_LABELS[category.expenseTypeCode] ?? category.description}</span>
                                <span>{wholeMoneyFormat.format(category.total)}</span>
                                <span className={styles.line} aria-hidden="true">
                                    <i style={{ width: `${quota.total <= 0 ? 0 : Math.max(0, (category.total / quota.total) * 100)}%` }} />
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

interface BenefitListProps {
    benefits: DeputyBenefits;
}

export function BenefitList({ benefits }: Readonly<BenefitListProps>) {
    const officeBudgetTotal = (benefits.officeBudgetSpent ?? 0) + (benefits.officeBudgetUnused ?? 0);
    const staffText = `${benefits.officeStaffCount} ${benefits.officeStaffCount === 1 ? "pessoa" : "pessoas"} no gabinete`;

    return (
        <dl className={styles.benefits}>
            <div>
                <dt>Salário mensal bruto</dt>
                <dd>
                    {exactMoneyFormat.format(Number(DEPUTY_SALARY.grossMonthlyValue))}
                    <small>igual para todos os deputados</small>
                </dd>
            </div>
            <div>
                <dt>Apartamento funcional</dt>
                <dd>{apartmentText(benefits)}</dd>
            </div>
            <div>
                <dt>Auxílio-moradia</dt>
                <dd>{benefits.housingAllowanceReceived > 0 ? `Recebeu ${wholeMoneyFormat.format(benefits.housingAllowanceReceived)}` : "Não recebeu"}</dd>
            </div>
            <div>
                <dt>Verba de gabinete</dt>
                <dd>
                    {benefits.officeBudgetSpent === null ? "Sem gastos no ano" : `${wholeMoneyFormat.format(benefits.officeBudgetSpent)} gastos`}
                    <small>
                        {benefits.officeBudgetSpent !== null && officeBudgetTotal > 0
                            ? `${Math.round((benefits.officeBudgetSpent / officeBudgetTotal) * 100)}% do total; ${staffText}`
                            : staffText}
                    </small>
                </dd>
            </div>
            <div>
                <dt>Viagens em missão oficial</dt>
                <dd>{benefits.officialTripCount}</dd>
            </div>
            <div>
                <dt>Passaporte diplomático</dt>
                <dd>{benefits.hasDiplomaticPassport ? "Tem" : "Não tem"}</dd>
            </div>
        </dl>
    );
}