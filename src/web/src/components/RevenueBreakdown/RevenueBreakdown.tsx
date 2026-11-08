import type { RevenueBreakdownData } from "@polar/db/marcos";
import styles from "./RevenueBreakdown.module.scss";

interface RevenueBreakdownProps {
    data: RevenueBreakdownData;
}

const millionsFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const shareFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// one row per part of the revenue of a year: name, amount, share of the total and a thin line as long as the share; the numbers carry
// the meaning, the line only helps to compare (the same rows as the categories of the spending page)
export function RevenueBreakdown({ data }: Readonly<RevenueBreakdownProps>) {
    return (
        <div className={styles.breakdown}>
            <p className={styles.total}>
                {data.totalLabel}: <strong>US$ {millionsFormat.format(data.total)} milhões</strong>
            </p>
            <ol className={styles.rows}>
                {data.rows.map((row) => {
                    const share = (row.amount / data.total) * 100;
                    return (
                        <li key={row.label}>
                            <div className={styles.head}>
                                <span className={styles.name}>
                                    {row.label}
                                    {row.calculated && <span className={styles.tag}>Calculado</span>}
                                </span>
                                <span className={styles.amount}>US$ {millionsFormat.format(row.amount)} milhões</span>
                                <span className={styles.share}>{shareFormat.format(share)}%</span>
                            </div>
                            <span className={styles.track} aria-hidden="true">
                                <span className={styles.fill} style={{ width: `${share}%` }} />
                            </span>
                            <p className={styles.explanation}>{row.explanation}</p>
                        </li>
                    );
                })}
            </ol>
            <p className={styles.note}>{data.note}</p>
        </div>
    );
}