import type { PollPoint } from "@polar/db/rulers";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import styles from "./ApprovalChart.module.scss";

interface ApprovalChartProps {
    points: readonly PollPoint[];
    description: string;
}

interface ChartLayout {
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    dotRadius: number;
}

// the drawing keeps its own size and scales to the column, so a phone gets its own taller layout instead of the wide one
// squeezed to half its size (tiny text, flat line)
const WIDE: ChartLayout = { width: 640, height: 240, left: 44, right: 616, top: 20, bottom: 200, dotRadius: 4.5 };
const NARROW: ChartLayout = { width: 360, height: 320, left: 46, right: 340, top: 32, bottom: 276, dotRadius: 5.5 };
const MAX_PERCENT = 80;
const GRID_STEPS = [0, 20, 40, 60, 80];

function dayNumber(isoDate: string): number {
    return new Date(`${isoDate}T12:00:00Z`).getTime() / 86400000;
}

// line chart on a real time axis, so the gap between the polls of 2013 and 2015 shows; the table below has the same data
export function ApprovalChart({ points, description }: Readonly<ApprovalChartProps>) {
    const days = points.map((point) => dayNumber(point.fieldworkDate));
    const firstYear = new Date(`${points[0]?.fieldworkDate ?? "2013-01-01"}T12:00:00Z`).getUTCFullYear();
    const lastYear = new Date(`${points.at(-1)?.fieldworkDate ?? "2016-01-01"}T12:00:00Z`).getUTCFullYear() + 1;
    const start = dayNumber(`${firstYear}-01-01`);
    const end = dayNumber(`${lastYear}-01-01`);
    const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
    const highest = points.reduce((best, point) => (point.good > best.good ? point : best), points[0] ?? { good: 0 });
    const lowest = points.reduce((worst, point) => (point.good < worst.good ? point : worst), points[0] ?? { good: 0 });

    function drawing(layout: ChartLayout, className: string) {
        const { width, height, left, right, top, bottom, dotRadius } = layout;
        const x = (day: number) => left + ((right - left) * (day - start)) / (end - start);
        const y = (value: number) => bottom - ((bottom - top) * value) / MAX_PERCENT;
        const polyline = points.map((point, index) => `${x(days[index] ?? start)},${y(point.good)}`).join(" ");
        return (
            <svg className={className} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={description}>
                {GRID_STEPS.map((value) => (
                    <g key={value}>
                        <line className={value === 0 ? styles.axis : styles.grid} x1={left} x2={right} y1={y(value)} y2={y(value)} />
                        <text className={styles.tick} x={left - 8} y={y(value) + 4} textAnchor="end">
                            {value}%
                        </text>
                    </g>
                ))}
                {years.map((year) => (
                    <g key={year}>
                        <line className={styles.grid} x1={x(dayNumber(`${year}-01-01`))} x2={x(dayNumber(`${year}-01-01`))} y1={bottom} y2={bottom + 6} />
                        {year < lastYear && (
                            <text className={styles.tick} x={x(dayNumber(`${year}-07-01`))} y={bottom + 24} textAnchor="middle">
                                {year}
                            </text>
                        )}
                    </g>
                ))}
                <polyline className={styles.line} points={polyline} pathLength={1} data-reveal="draw" />
                {points.map((point, index) => (
                    <circle key={point.label} className={styles.dot} cx={x(days[index] ?? start)} cy={y(point.good)} r={dotRadius} />
                ))}
                {points.map((point, index) => {
                    if (point !== highest && point !== lowest) {
                        return null;
                    }
                    const pointX = x(days[index] ?? start);
                    // a label near the right edge ends at the point instead of running out of the drawing
                    const isNearEdge = pointX > right - 16;
                    return (
                        <text
                            key={`label-${point.label}`}
                            className={styles.value}
                            x={isNearEdge ? right : pointX}
                            y={y(point.good) - 12}
                            textAnchor={isNearEdge ? "end" : "middle"}
                        >
                            {point.good}%
                        </text>
                    );
                })}
            </svg>
        );
    }

    return (
        <figure className={styles.chart}>
            {drawing(NARROW, styles.narrow ?? "")}
            {drawing(WIDE, styles.wide ?? "")}
            <figcaption className={styles.caption}>Cada ponto é uma pesquisa. A linha liga pesquisas seguidas, não mostra o que aconteceu entre elas.</figcaption>
            <details className={styles.table}>
                <summary>Ver os números em tabela</summary>
                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Pesquisa</th>
                                <th scope="col">Ótimo ou bom</th>
                                <th scope="col">Fonte</th>
                            </tr>
                        </thead>
                        <tbody>
                            {points.map((point) => (
                                <tr key={point.label}>
                                    <td>{point.label}</td>
                                    <td>{point.good}%</td>
                                    <td>
                                        <EditorialSources sources={point.sources} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </figure>
    );
}