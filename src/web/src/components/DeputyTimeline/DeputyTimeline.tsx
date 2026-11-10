import type { DeputyMovement } from "@polar/db";
import { SkeletonArea } from "@/components/Skeleton/Skeleton";
import { percentLabel, quarterLabel, quarterName, round2 } from "@/components/PartyMap/movementText";
import styles from "./DeputyTimeline.module.scss";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });
const moneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DAY_MS = 86_400_000;

interface TimelineLayout {
    key: "wide" | "narrow";
    width: number;
    left: number;
    right: number;
    topHeight: number;
    quotaHeight: number;
    // the narrow drawing writes only the number at the end of each line, the legend names the lines
    shortLabels: boolean;
}

const WIDE: TimelineLayout = { key: "wide", width: 640, left: 54, right: 22, topHeight: 200, quotaHeight: 130, shortLabels: false };
const NARROW: TimelineLayout = { key: "narrow", width: 360, left: 54, right: 14, topHeight: 160, quotaHeight: 110, shortLabels: true };
const GAP_HEIGHT = 40;
const AXIS_HEIGHT = 30;
// the narrow axis writes the quarter on two lines
const NARROW_AXIS_HEIGHT = 48;
// an end label closer than this to the top of the panel goes below its line, so it does not touch the title of the panel
const END_LABEL_TOP_ROOM = 22;
const END_LABEL_LINE_HEIGHT = 17;
const HEAD_HEIGHT = 58;
// room for a second row of party change labels
const EXTRA_HEAD_HEIGHT = 30;

function quarterStartMs(quarter: string): number {
    const [year = 0, month = 1] = quarter.split("-").map(Number);
    return Date.UTC(year, month - 1, 1);
}

function nextQuarterMs(ms: number): number {
    const date = new Date(ms);
    return Date.UTC(date.getUTCFullYear(), Math.floor(date.getUTCMonth() / 3) * 3 + 3, 1);
}

function isoDay(ms: number): string {
    return new Date(ms).toISOString().slice(0, 10);
}

// the next step of a round scale above the value, so the bars have a few labeled lines
function niceCeiling(value: number): number {
    const step = [10_000, 20_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000].find((candidate) => value / candidate <= 4) ?? 1_000_000;
    return Math.max(step, Math.ceil(value / step) * step);
}

function shortMoney(value: number): string {
    return value === 0 ? "R$ 0" : `${Math.round(value / 1000)} mil`;
}

interface PartyChange {
    from: string;
    to: string;
    at: Date;
}

// the history is newest first: each period began with a change from the one after it
function partyChanges(history: DeputyMovement["partyHistory"], fromMs: number): PartyChange[] {
    const changes: PartyChange[] = [];
    for (let index = 0; index < history.length - 1; index++) {
        const period = history[index];
        const before = history[index + 1];
        if (period && before && period.startsAt.getTime() >= fromMs) {
            changes.push({ from: before.party?.acronym ?? "outro partido", to: period.party?.acronym ?? "outro partido", at: period.startsAt });
        }
    }
    return changes.sort((first, second) => first.at.getTime() - second.at.getTime());
}

interface DeputyTimelineProps {
    deputyName: string;
    movement: DeputyMovement;
}

// votes and money of the whole legislature on one time axis (DESIGN.md, "Deputy timeline"): the rate of votes equal to the government
// and to the party by quarter, the party changes as vertical marks, and the quota by month. Benefits are yearly at the source, so they
// are written by year under the chart and never split by month. The chart puts the numbers side by side and says nothing about why
export function DeputyTimeline({ deputyName, movement }: Readonly<DeputyTimelineProps>) {
    const firstQuarter = movement.quarters[0];
    const lastQuarter = movement.quarters.at(-1);
    if (!firstQuarter || !lastQuarter) {
        return null;
    }
    const startMs = quarterStartMs(firstQuarter);
    const changes = partyChanges(movement.partyHistory, startMs);
    const lastQuarterEnd = nextQuarterMs(quarterStartMs(lastQuarter));
    const latestChange = Math.max(0, ...changes.map((change) => change.at.getTime()));
    // the axis reaches the quarter of the latest party change, even when there are no votes after it yet
    const endMs = latestChange > lastQuarterEnd ? nextQuarterMs(latestChange) : lastQuarterEnd;
    const quarterStarts: number[] = [];
    for (let ms = startMs; ms < endMs; ms = nextQuarterMs(ms)) {
        quarterStarts.push(ms);
    }
    const dataEndMs = movement.lastVoteAt ? movement.lastVoteAt.getTime() + DAY_MS : endMs;
    const hasNoDataYet = endMs - dataEndMs > 20 * DAY_MS;
    const quotaMax = niceCeiling(Math.max(1, ...movement.monthlyQuota.map((month) => month.total)));
    const headHeight = HEAD_HEIGHT + (changes.length > 1 ? EXTRA_HEAD_HEIGHT : 0);

    const changeText = changes.map((change) => `de ${change.from} para ${change.to} em ${dateFormat.format(change.at)}`).join("; ");
    const description = `Linha do tempo de ${deputyName}, de ${quarterName(isoDay(startMs))} a ${quarterName(isoDay(endMs - DAY_MS))}: votos iguais ao governo e ao partido por trimestre${
        changes.length > 0 ? `, ${changes.length === 1 ? "troca de partido" : "trocas de partido"} (${changeText})` : ""
    } e cota parlamentar por mês. A tabela abaixo traz os mesmos números.`;

    function drawing(layout: TimelineLayout, className: string) {
        const plotWidth = layout.width - layout.left - layout.right;
        const x = (ms: number) => round2(layout.left + ((ms - startMs) / (endMs - startMs)) * plotWidth);
        const topY = (rate: number) => round2(headHeight + (1 - rate) * layout.topHeight);
        const quotaTop = headHeight + layout.topHeight + GAP_HEIGHT;
        const quotaY = (value: number) => round2(quotaTop + (1 - value / quotaMax) * layout.quotaHeight);
        const bottom = quotaTop + layout.quotaHeight;
        const height = bottom + (layout.shortLabels ? NARROW_AXIS_HEIGHT : AXIS_HEIGHT);
        const midOf = (quarter: string) => quarterStartMs(quarter) + 45 * DAY_MS;

        const series = [
            { key: "governmentRate" as const, name: "Governo", dash: undefined },
            { key: "partyRate" as const, name: "Partido", dash: "7 5" },
        ].map((item) => {
            const points = movement.metrics.flatMap((metric) => {
                const rate = metric[item.key];
                return rate === null ? [] : [{ quarter: metric.quarter, rate }];
            });
            // a quarter without a rate leaves a gap: the line is drawn in separate pieces
            let path = "";
            let previousIndex = -2;
            for (const point of points) {
                const index = movement.quarters.indexOf(point.quarter);
                path += `${index === previousIndex + 1 ? "L" : "M"}${x(midOf(point.quarter))} ${topY(point.rate)} `;
                previousIndex = index;
            }
            return { ...item, points, path: path.trim(), last: points.at(-1) };
        });
        const lastGovernment = series[0]?.last?.rate ?? 0;
        const lastParty = series[1]?.last?.rate ?? 0;
        // the higher line writes its number above it and the other below, except near the top of the panel, where both go below
        // and the second one moves down so the two numbers never overlap
        const endLabels = series
            .flatMap((item) => {
                if (!item.last) {
                    return [];
                }
                const px = x(midOf(item.last.quarter));
                const isHigher = item.key === "governmentRate" ? lastGovernment >= lastParty : lastParty > lastGovernment;
                const above = isHigher && topY(item.last.rate) - headHeight > END_LABEL_TOP_ROOM;
                const y = topY(item.last.rate) + (above ? -8 : END_LABEL_LINE_HEIGHT);
                return [{ key: item.key, name: item.name, text: percentLabel(item.last.rate), px, y, atEdge: px > layout.width - (layout.shortLabels ? 40 : 100) }];
            })
            .sort((first, second) => first.y - second.y)
            .map((label, index, all) => {
                const previous = all[index - 1];
                return previous && label.y - previous.y < END_LABEL_LINE_HEIGHT - 1 ? { ...label, y: round2(previous.y + END_LABEL_LINE_HEIGHT) } : { ...label, y: round2(label.y) };
            });

        return (
            <svg className={className} viewBox={`0 0 ${layout.width} ${height}`} role="img" aria-label={description}>
                {[0, 0.25, 0.5, 0.75, 1].map((rate) => (
                    <g key={rate}>
                        <line className={styles.grid} x1={layout.left} x2={layout.left + plotWidth} y1={topY(rate)} y2={topY(rate)} />
                        <text className={styles.tick} x={layout.left - 6} y={topY(rate) + 4} textAnchor="end">
                            {percentLabel(rate)}
                        </text>
                    </g>
                ))}
                {[0, quotaMax / 2, quotaMax].map((value) => (
                    <g key={value}>
                        <line className={styles.grid} x1={layout.left} x2={layout.left + plotWidth} y1={quotaY(value)} y2={quotaY(value)} />
                        <text className={styles.tick} x={layout.left - 6} y={quotaY(value) + 4} textAnchor="end">
                            {shortMoney(value)}
                        </text>
                    </g>
                ))}
                <text className={styles.panelTitle} x={layout.left} y={headHeight - 8}>
                    Votos iguais ao governo e ao partido
                </text>
                <text className={styles.panelTitle} x={layout.left} y={quotaTop - 8}>
                    Cota parlamentar por mês
                </text>

                {quarterStarts.map((start, index) => {
                    const next = quarterStarts[index + 1] ?? endMs;
                    const label = isoDay(start);
                    return (
                        <g key={start}>
                            <line className={styles.separator} x1={x(start)} x2={x(start)} y1={headHeight} y2={bottom} />
                            <text className={styles.tick} x={round2((x(start) + x(next)) / 2)} y={layout.shortLabels ? bottom + 20 : height - 8} textAnchor="middle">
                                {layout.shortLabels ? (
                                    <>
                                        <tspan x={round2((x(start) + x(next)) / 2)}>{`${Math.ceil(Number(label.slice(5, 7)) / 3)}º tri`}</tspan>
                                        <tspan x={round2((x(start) + x(next)) / 2)} dy={15}>
                                            {label.slice(0, 4)}
                                        </tspan>
                                    </>
                                ) : (
                                    quarterLabel(label)
                                )}
                            </text>
                        </g>
                    );
                })}

                {hasNoDataYet && (
                    <g>
                        <rect className={styles.noData} x={x(dataEndMs)} y={headHeight} width={round2(x(endMs) - x(dataEndMs))} height={bottom - headHeight} />
                        <text className={styles.tick} x={round2(x(dataEndMs) + 6)} y={topY(0.2)}>
                            {layout.shortLabels ? (
                                <>
                                    <tspan x={round2(x(dataEndMs) + 6)}>sem</tspan>
                                    <tspan x={round2(x(dataEndMs) + 6)} dy={15}>
                                        dados
                                    </tspan>
                                </>
                            ) : (
                                "sem dados"
                            )}
                        </text>
                    </g>
                )}

                {series.map((item) => (
                    <g key={item.key}>
                        {item.path && <path className={item.dash ? styles.lineDashed : styles.line} d={item.path} />}
                        {item.points.map((point) => (
                            <circle key={point.quarter} className={styles.dot} cx={x(midOf(point.quarter))} cy={topY(point.rate)} r={4} />
                        ))}
                    </g>
                ))}
                {endLabels.map((label) => (
                    <text
                        key={label.key}
                        className={styles.endLabel}
                        x={label.atEdge ? label.px : label.px + 8}
                        y={label.y}
                        textAnchor={label.atEdge ? "end" : "start"}
                    >
                        {layout.shortLabels ? "" : `${label.name} `}
                        {label.text}
                    </text>
                ))}
                {movement.metrics
                    .filter((metric) => metric.governmentRate === null)
                    .map((metric) => (
                        <text key={metric.quarter} className={styles.tick} x={x(midOf(metric.quarter))} y={topY(0.5)} textAnchor="middle">
                            {layout.shortLabels ? "poucas" : "poucas votações"}
                        </text>
                    ))}

                {movement.monthlyQuota.map((month) => {
                    const from = Date.UTC(month.year, month.month - 1, 1);
                    const to = Date.UTC(month.year, month.month, 1);
                    const value = Math.max(0, month.total);
                    return (
                        <rect
                            key={`${month.year}-${month.month}`}
                            className={styles.bar}
                            x={round2(x(from) + 1)}
                            y={quotaY(value)}
                            width={Math.max(2, round2(x(to) - x(from) - 2))}
                            height={round2(quotaY(0) - quotaY(value))}
                        />
                    );
                })}
                <line className={styles.axis} x1={layout.left} x2={layout.left + plotWidth} y1={quotaY(0)} y2={quotaY(0)} />

                {changes.map((change, index) => {
                    const mx = x(change.at.getTime());
                    const toTheLeft = mx > layout.left + plotWidth * 0.55;
                    const labelY = 14 + (index % 2) * EXTRA_HEAD_HEIGHT;
                    return (
                        <g key={change.at.toISOString()}>
                            <line className={styles.change} x1={mx} x2={mx} y1={labelY - 12} y2={bottom} />
                            <text className={styles.changeLabel} x={mx + (toTheLeft ? -6 : 6)} y={labelY} textAnchor={toTheLeft ? "end" : "start"}>
                                {change.from} → {change.to}
                            </text>
                            <text className={styles.tick} x={mx + (toTheLeft ? -6 : 6)} y={labelY + 15} textAnchor={toTheLeft ? "end" : "start"}>
                                {dateFormat.format(change.at)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        );
    }

    return (
        <div className={styles.timeline}>
            <p className={styles.lead}>
                {changes.length === 1 && changes[0] && (
                    <>
                        {deputyName} trocou de {changes[0].from} para {changes[0].to} em {dateFormat.format(changes[0].at)}.{" "}
                    </>
                )}
                {changes.length > 1 && <>Trocas de partido desde {new Date(startMs).getUTCFullYear()}: {changeText}. </>}
                Em cima, a parte das votações em que o voto foi igual ao que o governo pediu e à maioria do próprio partido, trimestre a trimestre. Embaixo, o
                valor da cota parlamentar mês a mês, no mesmo período.
            </p>

            <figure className={styles.chart}>
                <ul className={styles.legend}>
                    <li>
                        <svg viewBox="0 0 32 8" aria-hidden="true">
                            <line className={styles.line} x1="0" x2="32" y1="4" y2="4" />
                        </svg>
                        Com o governo
                    </li>
                    <li>
                        <svg viewBox="0 0 32 8" aria-hidden="true">
                            <line className={styles.lineDashed} x1="0" x2="32" y1="4" y2="4" />
                        </svg>
                        Com o partido
                    </li>
                </ul>
                {drawing(NARROW, styles.narrow ?? "")}
                {drawing(WIDE, styles.wide ?? "")}
            </figure>

            <div className={styles.years}>
                <h3 className={styles.yearsTitle}>Valores por ano</h3>
                <p className={styles.note}>Estes dois valores vêm da Câmara por ano. Por isso não aparecem mês a mês.</p>
                <dl>
                    {movement.yearBenefits.map((year) => (
                        <div key={year.year}>
                            <dt>{year.year}</dt>
                            <dd>
                                Verba de gabinete usada: {year.officeBudgetSpent === null ? "sem registro" : moneyFormat.format(year.officeBudgetSpent)}
                                {" · "}
                                Auxílio-moradia: {year.housingAllowanceReceived > 0 ? moneyFormat.format(year.housingAllowanceReceived) : "não recebeu"}
                                {year.collectedAt.getFullYear() === year.year && ` (até ${dateFormat.format(year.collectedAt)})`}
                            </dd>
                        </div>
                    ))}
                </dl>
                <p>Salário: {moneyFormat.format(movement.salary.grossMonthlyValue)} por mês, igual para todos os deputados.</p>
            </div>

            <p className={styles.sentence}>Os gráficos mostram dados lado a lado. Um número não explica o outro.</p>

            <details className={styles.table}>
                <summary>Ver como tabela</summary>
                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Trimestre</th>
                                <th scope="col">Com o governo</th>
                                <th scope="col">Com o partido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movement.metrics.map((metric) => (
                                <tr key={metric.quarter}>
                                    <th scope="row">{quarterName(metric.quarter)}</th>
                                    <td>
                                        {metric.governmentRate === null
                                            ? `poucas votações (${metric.governmentVotes})`
                                            : `${percentLabel(metric.governmentRate)} (${metric.governmentAligned} de ${metric.governmentVotes})`}
                                    </td>
                                    <td>
                                        {metric.partyRate === null
                                            ? `poucas votações (${metric.partyVotes})`
                                            : `${percentLabel(metric.partyRate)} (${metric.partyAligned} de ${metric.partyVotes})`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Mês</th>
                                <th scope="col">Cota parlamentar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movement.monthlyQuota.map((month) => (
                                <tr key={`${month.year}-${month.month}`}>
                                    <th scope="row">{`${String(month.month).padStart(2, "0")}/${month.year}`}</th>
                                    <td>{moneyFormat.format(month.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}

// the timeline while it loads: the chart area and the yearly card
export function DeputyTimelineSkeleton() {
    return <SkeletonArea ratio="16 / 11" />;
}