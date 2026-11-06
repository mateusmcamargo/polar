import type { DeputyQuotaLimit } from "@polar/db";
import { Explanation } from "@/components/Explanation/Explanation";
import { monthName } from "@/components/SpendingBreakdown/months";
import { Skeleton, SkeletonStack } from "@/components/Skeleton/Skeleton";
import styles from "./QuotaLimit.module.scss";

const wholeMoneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const exactMoneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface QuotaLimitProps {
    total: number;
    limit: DeputyQuotaLimit;
    // "em Goiás", "no Paraná"
    inStatePhrase: string;
}

function periodText(limit: DeputyQuotaLimit): string {
    if (limit.firstMonth === limit.lastMonth) {
        return `em ${monthName(limit.firstMonth)}`;
    }
    return `de ${monthName(limit.firstMonth)} a ${monthName(limit.lastMonth)}`;
}

export function QuotaLimit({ total, limit, inStatePhrase }: Readonly<QuotaLimitProps>) {
    const usedPercent = limit.total > 0 ? Math.round((total / limit.total) * 100) : 0;

    return (
        <div className={styles.limit}>
            <div className={styles.head}>
                <span className={styles.figure}>{usedPercent}%</span>
                <span className={styles.label}>do limite da cota usado</span>
            </div>
            <span
                className={styles.track}
                role="img"
                aria-label={`${usedPercent}% do limite usado: ${wholeMoneyFormat.format(total)} de ${wholeMoneyFormat.format(limit.total)}`}
            >
                <i data-reveal="fill" style={{ width: `${Math.min(100, Math.max(0, usedPercent))}%` }} />
            </span>
            <p className={styles.base}>
                Gastou {wholeMoneyFormat.format(total)} de um limite de {wholeMoneyFormat.format(limit.total)} {periodText(limit)}. O limite{" "}
                {inStatePhrase} é de {exactMoneyFormat.format(limit.monthlyLimit)} por mês.
            </p>
            <Explanation subject="limite da cota">
                <p>
                    Cada deputado pode gastar até um valor por mês, que muda conforme o estado. Quem mora mais longe de Brasília tem um
                    limite maior, porque as passagens custam mais.
                </p>
                <p>
                    O que não é gasto num mês pode ser usado nos meses seguintes do mesmo ano. Por isso somamos o limite de todos os meses
                    entre o primeiro e o último gasto do ano.
                </p>
                <p>
                    Líderes, vice-líderes e presidentes de comissão recebem um pequeno valor extra por mês, que não está nesta conta.
                    Por isso o resultado pode passar um pouco de 100%.
                </p>
            </Explanation>
        </div>
    );
}

// the share of the limit while it loads: figure, bar and the sentence below
export function QuotaLimitSkeleton() {
    return (
        <SkeletonStack>
            <Skeleton width="10em" height="var(--text-figure)" />
            <Skeleton shape="block" height="16px" />
            <Skeleton width="80%" />
        </SkeletonStack>
    );
}