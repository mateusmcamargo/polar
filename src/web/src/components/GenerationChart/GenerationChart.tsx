import type { GenerationPoint } from "@polar/db/marcos";
import styles from "./GenerationChart.module.scss";

interface GenerationChartProps {
    points: readonly GenerationPoint[];
    // the year drawn in sticker yellow, with its value written above the bar
    highlightYear: number;
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

// the drawing keeps its own size and scales to the column; a phone gets a taller layout instead of the wide one squeezed
const WIDE: ChartLayout = { width: 640, height: 270, left: 62, right: 622, top: 32, bottom: 234 };
const NARROW: ChartLayout = { width: 360, height: 340, left: 56, right: 342, top: 40, bottom: 298 };
const MAX_VALUE = 110000;
const GRID_STEPS = [0, 25000, 50000, 75000, 100000];

const numberFormat = new Intl.NumberFormat("pt-BR");

function tickText(value: number): string {
    return value === 0 ? "0" : `${value / 1000} mil`;
}

// years named under the bars: the first, the last and every decade between them, except decades that would touch the first or the
// last label on a phone
function isLabeledYear(year: number, first: number, last: number): boolean {
    if (year === first || year === last) {
        return true;
    }
    return year % 10 === 0 && year - first > 5 && last - year > 5;
}

// one bar per year on a single scale starting at zero; the table below has the same numbers
export function GenerationChart({ points, highlightYear, description, note }: Readonly<GenerationChartProps>) {
    const firstYear = points[0]?.year ?? 0;
    const lastYear = points.at(-1)?.year ?? 0;

    function drawing(layout: ChartLayout, className: string) {
        const { width, height, left, right, top, bottom } = layout;
        const pitch = (right - left) / points.length;
        const barWidth = pitch * 0.72;
        const y = (value: number) => bottom - ((bottom - top) * value) / MAX_VALUE;
        return (
            <svg className={className} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={description}>
                {GRID_STEPS.map((value) => (
                    <g key={value}>
                        <line className={value === 0 ? styles.axis : styles.grid} x1={left} x2={right} y1={y(value)} y2={y(value)} />
                        <text className={styles.tick} x={left - 8} y={y(value) + 4} textAnchor="end">
                            {tickText(value)}
                        </text>
                    </g>
                ))}
                {points.map((point, index) => {
                    const x = left + index * pitch + (pitch - barWidth) / 2;
                    const isHighlight = point.year === highlightYear;
                    return (
                        <g key={point.year}>
                            <rect
                                className={isHighlight ? styles.highlight : styles.bar}
                                x={x}
                                y={y(point.gigawattHours)}
                                width={barWidth}
                                height={bottom - y(point.gigawattHours)}
                            />
                            {isLabeledYear(point.year, firstYear, lastYear) && (
                                <text className={styles.tick} x={x + barWidth / 2} y={bottom + 20} textAnchor="middle">
                                    {point.year}
                                </text>
                            )}
                            {isHighlight && (
                                <text className={styles.value} x={x + barWidth / 2} y={y(point.gigawattHours) - 10} textAnchor="middle">
                                    {numberFormat.format(point.gigawattHours)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        );
    }

    return (
        <figure className={styles.chart}>
            <figcaption className={styles.unit}>Gigawatts-hora (GWh) por ano</figcaption>
            {drawing(NARROW, styles.narrow ?? "")}
            {drawing(WIDE, styles.wide ?? "")}
            <p className={styles.note}>{note}</p>
            <details className={styles.table}>
                <summary>Ver os números em tabela</summary>
                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Ano</th>
                                <th scope="col">Produção (GWh)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {points.map((point) => (
                                <tr key={point.year}>
                                    <td>{point.year}</td>
                                    <td>{numberFormat.format(point.gigawattHours)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </figure>
    );
}