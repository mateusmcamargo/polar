import type { TariffPoint, TariffSeries } from "@polar/db/marcos";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import styles from "./TariffChart.module.scss";

interface TariffChartProps {
    series: readonly TariffSeries[];
    // text summary read by screen readers
    description: string;
    note: string;
}

interface ChartLayout {
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

const WIDE: ChartLayout = { width: 640, height: 280, left: 48, right: 620, top: 36, bottom: 236 };
const NARROW: ChartLayout = { width: 360, height: 340, left: 44, right: 344, top: 44, bottom: 296 };
const MAX_VALUE = 25;
const GRID_STEPS = [0, 5, 10, 15, 20, 25];

const decimalFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function money(value: number): string {
    return decimalFormat.format(value);
}

// years named under the axis: the first, the last and every fifth year, except those that would touch the first or the last label
function isLabeledYear(year: number, first: number, last: number): boolean {
    if (year === first || year === last) {
        return true;
    }
    return year % 5 === 0 && year - first > 2 && last - year > 2;
}

// a dot only where the value changes or the line starts or ends; a flat stretch needs no dots
function changePoints(points: readonly TariffPoint[]): TariffPoint[] {
    return points.filter((point, index) => {
        const before = points[index - 1];
        const after = points[index + 1];
        return !before || !after || before.value !== point.value || after.value !== point.value;
    });
}

// line chart of the tariff by year on a scale that starts at zero; each line is told apart by its dash and by its written label,
// never by color, and the table below has every year
export function TariffChart({ series, description, note }: Readonly<TariffChartProps>) {
    const allPoints = series.flatMap((item) => item.points);
    const firstYear = Math.min(...allPoints.map((point) => point.year));
    const lastYear = Math.max(...allPoints.map((point) => point.year));
    const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
    const mainSeries = series[0];
    const secondSeries = series[1];

    function drawing(layout: ChartLayout, className: string) {
        const { width, height, left, right, top, bottom } = layout;
        const x = (year: number) => left + ((right - left) * (year - firstYear)) / (lastYear - firstYear);
        const y = (value: number) => bottom - ((bottom - top) * value) / MAX_VALUE;
        const mainFirst = mainSeries?.points[0];
        const mainLast = mainSeries?.points.at(-1);
        const secondLast = secondSeries?.points.at(-1);
        return (
            <svg className={className} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={description}>
                {GRID_STEPS.map((value) => (
                    <g key={value}>
                        <line className={value === 0 ? styles.axis : styles.grid} x1={left} x2={right} y1={y(value)} y2={y(value)} />
                        <text className={styles.tick} x={left - 8} y={y(value) + 4} textAnchor="end">
                            {value}
                        </text>
                    </g>
                ))}
                {years
                    .filter((year) => isLabeledYear(year, firstYear, lastYear))
                    .map((year) => (
                        <text key={year} className={styles.tick} x={x(year)} y={bottom + 22} textAnchor="middle">
                            {year}
                        </text>
                    ))}
                {series.map((item) => (
                    <g key={item.label}>
                        <polyline
                            className={item.line === "dashed" ? styles.dashed : styles.solid}
                            points={item.points.map((point) => `${x(point.year)},${y(point.value)}`).join(" ")}
                        />
                        {changePoints(item.points).map((point) => (
                            <circle key={point.year} className={styles.dot} cx={x(point.year)} cy={y(point.value)} r={4.5} />
                        ))}
                    </g>
                ))}
                {mainSeries && mainFirst && (
                    <text className={styles.value} x={x(mainFirst.year)} y={y(mainFirst.value) - 12} textAnchor="start">
                        {`${mainSeries.label}: US$ ${money(mainFirst.value)}`}
                    </text>
                )}
                {mainLast && (
                    <text className={styles.value} x={x(mainLast.year)} y={y(mainLast.value) - 12} textAnchor="end">
                        {money(mainLast.value)}
                    </text>
                )}
                {secondSeries && secondLast && (
                    <text className={styles.value} x={x(secondLast.year)} y={y(secondLast.value) + 24} textAnchor="end">
                        {`${secondSeries.label}: ${money(secondLast.value)}`}
                    </text>
                )}
            </svg>
        );
    }

    return (
        <figure className={styles.chart}>
            <figcaption className={styles.unit}>Dólares por quilowatt por mês (US$/kW)</figcaption>
            {drawing(NARROW, styles.narrow ?? "")}
            {drawing(WIDE, styles.wide ?? "")}
            <ul className={styles.legend}>
                {series.map((item) => (
                    <li key={item.label}>
                        <svg viewBox="0 0 40 8" aria-hidden="true">
                            <line className={item.line === "dashed" ? styles.sampleDashed : styles.sampleSolid} x1="0" x2="40" y1="4" y2="4" />
                        </svg>
                        {item.label}
                    </li>
                ))}
            </ul>
            <p className={styles.note}>
                <GlossaryText text={note} />
            </p>
            <details className={styles.table}>
                <summary>Ver os números em tabela</summary>
                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Ano</th>
                                {series.map((item) => (
                                    <th key={item.label} scope="col">
                                        {item.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {years.map((year) => (
                                <tr key={year}>
                                    <td>{year}</td>
                                    {series.map((item) => {
                                        const point = item.points.find((candidate) => candidate.year === year);
                                        return <td key={item.label}>{point ? money(point.value) : "–"}</td>;
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </figure>
    );
}