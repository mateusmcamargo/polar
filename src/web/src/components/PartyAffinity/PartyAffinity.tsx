"use client";

import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { PartyAffinityPair, PartyMovementParty } from "@polar/db";
import { PARTY_COLORS } from "@polar/db/party-colors";
import { PartyBadge, prefersWhiteText } from "@/components/PartyBadge/PartyBadge";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { TwoRowSlider } from "@/components/TwoRowSlider/TwoRowSlider";
import { perHundredLabel, percentLabel, quarterName, round2 } from "@/components/PartyMap/movementText";
import styles from "./PartyAffinity.module.scss";

const THRESHOLDS = [0.7, 0.8, 0.9] as const;
const DEFAULT_THRESHOLD = 0.8;
const HIDE_DELAY_MS = 180;

interface RadarLayout {
    key: "wide" | "narrow";
    width: number;
    height: number;
    radius: number;
    // narrow layouts turn the names along their axis, because a phone has no room for them across
    rotated: boolean;
    labelGap: number;
    nodeRadius: number;
    strongNodeRadius: number;
}

const WIDE_RADAR: RadarLayout = { key: "wide", width: 700, height: 540, radius: 190, rotated: false, labelGap: 14, nodeRadius: 4, strongNodeRadius: 6 };
const NARROW_RADAR: RadarLayout = { key: "narrow", width: 360, height: 380, radius: 76, rotated: true, labelGap: 12, nodeRadius: 3, strongNodeRadius: 4.5 };

interface Affinity {
    ratio: number;
    commonVotes: number;
    sameVotes: number;
}

// where the mouse is inside the drawing, in pixels; the tooltip of a mouse follows it, the one of a finger or a keyboard stays on the node
interface PointerSpot {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Tip {
    acronym: string;
    layout: RadarLayout["key"];
    pointer: PointerSpot | null;
}

const CHIP_PADDING = 6;

// the party name written on a rectangle in the party color, with the text color chosen by contrast
function chipMetrics(text: string, rotated: boolean) {
    const width = round2(text.length * (rotated ? 6.6 : 7.8) + 2 * CHIP_PADDING);
    return rotated ? { width, height: 16, top: -11 } : { width, height: 19, top: -13 };
}

function pairKey(period: string | null, first: string, second: string): string {
    const [low, high] = first < second ? [first, second] : [second, first];
    return `${period ?? "all"}|${low}|${high}`;
}

function meanGovernmentRate(party: PartyMovementParty): number | null {
    const rates = party.quarters.flatMap((item) => (item.governmentRate === null ? [] : [item.governmentRate]));
    return rates.length > 0 ? rates.reduce((total, rate) => total + rate, 0) / rates.length : null;
}

interface RadarDrawingProps {
    layout: RadarLayout;
    className: string;
    selected: string;
    others: readonly string[];
    affinityOf: (acronym: string) => Affinity | null;
    threshold: number;
    description: string;
    tip: Tip | null;
    onShow: (tip: Tip) => void;
    onScheduleHide: () => void;
    onKeepTip: () => void;
    onHide: () => void;
    onSelect: (acronym: string) => void;
}

// radar: the chosen party at the center, one axis per other party, and the distance from the center is the share of votes on the same side
function RadarDrawing({ layout, className, selected, others, affinityOf, threshold, description, tip, onShow, onScheduleHide, onKeepTip, onHide, onSelect }: Readonly<RadarDrawingProps>) {
    const centerX = layout.width / 2;
    const centerY = layout.height / 2;
    const angleOf = (index: number) => -Math.PI / 2 + (index / others.length) * Math.PI * 2;
    const point = (index: number, share: number): [number, number] => [
        round2(centerX + Math.cos(angleOf(index)) * layout.radius * share),
        round2(centerY + Math.sin(angleOf(index)) * layout.radius * share),
    ];
    const polygon = (share: (index: number) => number) => others.map((_, index) => point(index, share(index)).join(",")).join(" ");
    // the ring values sit in the gap between the first two axes, so they never touch a party name
    const gapAngle = -Math.PI / 2 + Math.PI / others.length;
    const ringText = (share: number) => ({
        x: round2(centerX + Math.cos(gapAngle) * layout.radius * share + 2),
        y: round2(centerY + Math.sin(gapAngle) * layout.radius * share + 4),
    });
    const values = others.map((acronym) => affinityOf(acronym));
    const tipIndex = tip && tip.layout === layout.key ? others.indexOf(tip.acronym) : -1;
    const tipValue = tipIndex >= 0 ? (values[tipIndex] ?? null) : null;
    const tipPoint = tipIndex >= 0 ? point(tipIndex, tipValue?.ratio ?? 0) : null;

    return (
        <div className={className}>
            <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-label={description}>
                {[0.25, 0.5, 0.75, 1].map((share) => (
                    <polygon key={share} className={styles.ring} points={polygon(() => share)} />
                ))}
                {others.map((acronym, index) => {
                    const [x, y] = point(index, 1);
                    return <line key={acronym} className={styles.spoke} x1={centerX} y1={centerY} x2={x} y2={y} />;
                })}
                <polygon className={styles.limit} points={polygon(() => threshold)} />
                {[0.5, threshold, 1].map((share) => (
                    <text key={share} className={styles.ringValue} {...ringText(share)}>
                        {Math.round(share * 100)}
                    </text>
                ))}
                <polygon className={styles.shape} points={polygon((index) => values[index]?.ratio ?? 0)} />
                {others.map((acronym, index) => {
                    const value = values[index] ?? null;
                    const isStrong = value !== null && value.ratio >= threshold;
                    const [nodeX, nodeY] = point(index, value?.ratio ?? 0);
                    const angle = angleOf(index);
                    const cos = Math.cos(angle);
                    const labelX = round2(centerX + cos * (layout.radius + layout.labelGap));
                    const labelY = round2(centerY + Math.sin(angle) * (layout.radius + layout.labelGap) + 4);
                    const degrees = (angle * 180) / Math.PI + (cos < 0 ? 180 : 0);
                    const text = !layout.rotated && value ? `${acronym} ${Math.round(value.ratio * 100)}` : acronym;
                    const anchor = layout.rotated ? (cos < 0 ? "end" : "start") : Math.abs(cos) < 0.08 ? "middle" : cos > 0 ? "start" : "end";
                    const chip = chipMetrics(text, layout.rotated);
                    const chipX = round2(anchor === "end" ? -chip.width : anchor === "middle" ? -chip.width / 2 : 0);
                    const partyColor = PARTY_COLORS[acronym]?.color;
                    return (
                        <g key={acronym}>
                            <circle className={styles.node} data-strong={isStrong || undefined} cx={nodeX} cy={nodeY} r={isStrong ? layout.strongNodeRadius : layout.nodeRadius} />
                            <g
                                className={styles.chip}
                                transform={layout.rotated ? `translate(${labelX} ${labelY}) rotate(${round2(degrees)})` : `translate(${labelX} ${labelY})`}
                                onClick={() => onSelect(acronym)}
                            >
                                <rect
                                    className={styles.chipBox}
                                    data-strong={isStrong || undefined}
                                    x={chipX}
                                    y={chip.top}
                                    width={chip.width}
                                    height={chip.height}
                                    style={partyColor ? { fill: partyColor } : undefined}
                                />
                                <text
                                    className={styles.chipText}
                                    x={round2(chipX + CHIP_PADDING)}
                                    y={0}
                                    style={{ fill: partyColor ? (prefersWhiteText(partyColor) ? "var(--color-on-data-dark)" : "var(--color-on-data-light)") : undefined }}
                                >
                                    {text}
                                </text>
                            </g>
                        </g>
                    );
                })}
                <text className={styles.center} x={centerX} y={centerY + 4} textAnchor="middle">
                    {selected}
                </text>
                {others.map((acronym, index) => {
                    const value = values[index] ?? null;
                    if (!value) {
                        return null;
                    }
                    const [nodeX, nodeY] = point(index, value.ratio);
                    const showOnNode = () => onShow({ acronym, layout: layout.key, pointer: null });
                    // a mouse gets a tooltip that follows it; the position is measured against the box that holds the drawing
                    const follow = (event: PointerEvent<SVGCircleElement>) => {
                        const box = event.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect();
                        if (event.pointerType !== "mouse" || !box) {
                            return;
                        }
                        onShow({
                            acronym,
                            layout: layout.key,
                            pointer: { x: round2(event.clientX - box.left), y: round2(event.clientY - box.top), width: box.width, height: box.height },
                        });
                    };
                    return (
                        <circle
                            key={acronym}
                            className={styles.hit}
                            cx={nodeX}
                            cy={nodeY}
                            r={16}
                            tabIndex={0}
                            role="button"
                            aria-label={`${acronym}: ${perHundredLabel(value.ratio)}, ${value.sameVotes} de ${value.commonVotes} votações do mesmo lado. Ver detalhes`}
                            onPointerEnter={follow}
                            onPointerMove={follow}
                            onPointerLeave={onScheduleHide}
                            onFocus={showOnNode}
                            onBlur={onScheduleHide}
                            onClick={(event) => {
                                // a click of the mouse puts the party at the center; a tap or the keyboard opens the details
                                if ((event.nativeEvent as globalThis.PointerEvent).pointerType === "mouse") {
                                    onSelect(acronym);
                                } else {
                                    showOnNode();
                                }
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                    onHide();
                                }
                            }}
                        />
                    );
                })}
            </svg>
            {tipPoint && tipValue && tip && (
                <div
                    className={styles.tip}
                    role="status"
                    data-follow={tip.pointer ? "" : undefined}
                    data-horizontal={
                        (tip.pointer ? tip.pointer.x / tip.pointer.width : tipPoint[0] / layout.width) < 0.35
                            ? "start"
                            : (tip.pointer ? tip.pointer.x / tip.pointer.width : tipPoint[0] / layout.width) > 0.65
                              ? "end"
                              : "center"
                    }
                    data-vertical={(tip.pointer ? tip.pointer.y / tip.pointer.height : tipPoint[1] / layout.height) > 0.5 ? "above" : "below"}
                    style={
                        tip.pointer
                            ? { left: `${tip.pointer.x}px`, top: `${tip.pointer.y}px` }
                            : { left: `${round2((tipPoint[0] / layout.width) * 100)}%`, top: `${round2((tipPoint[1] / layout.height) * 100)}%` }
                    }
                    onPointerEnter={onKeepTip}
                    onPointerLeave={onScheduleHide}
                >
                    <PartyBadge acronym={tip.acronym} />
                    <p className={styles.tipFigure}>{perHundredLabel(tipValue.ratio)}</p>
                    <p>
                        {selected} e {tip.acronym} votaram do mesmo lado em {tipValue.sameVotes} de {tipValue.commonVotes} votações.
                    </p>
                    {!tip.pointer && (
                        <button type="button" className={styles.tipButton} onClick={() => onSelect(tip.acronym)}>
                            Ver o {tip.acronym} no centro
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

interface PartyAffinityProps {
    parties: readonly PartyMovementParty[];
    quarters: readonly string[];
    affinity: readonly PartyAffinityPair[];
    minCommonVotes: number;
    sourceNote: ReactNode;
}

// which parties vote on the same side, for the party chosen at the center (DESIGN.md, "Party affinity"). The list under the radar holds
// the same numbers, so nothing depends on the pointer
export function PartyAffinity({ parties, quarters, affinity, minCommonVotes, sourceNote }: Readonly<PartyAffinityProps>) {
    const [period, setPeriod] = useState<string | null>(null);
    const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
    const [tip, setTip] = useState<Tip | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const biggestParty = useMemo(
        () => [...parties].sort((first, second) => (second.quarters.at(-1)?.seats ?? 0) - (first.quarters.at(-1)?.seats ?? 0))[0]?.acronym ?? "",
        [parties],
    );
    const [selected, setSelected] = useState(biggestParty);

    // from the most to the least aligned to the government, so the shape of the radar can be compared between parties
    const alignmentOrder = useMemo(
        () =>
            [...parties]
                .sort((first, second) => (meanGovernmentRate(second) ?? -1) - (meanGovernmentRate(first) ?? -1) || first.acronym.localeCompare(second.acronym))
                .map((party) => party.acronym),
        [parties],
    );
    const alphabetical = useMemo(() => parties.map((party) => party.acronym).sort((first, second) => first.localeCompare(second)), [parties]);
    const affinityByPair = useMemo(() => {
        const map = new Map<string, Affinity>();
        for (const pair of affinity) {
            map.set(pairKey(pair.quarter, pair.firstAcronym, pair.secondAcronym), {
                ratio: pair.sameVotes / pair.commonVotes,
                commonVotes: pair.commonVotes,
                sameVotes: pair.sameVotes,
            });
        }
        return map;
    }, [affinity]);

    const others = alignmentOrder.filter((acronym) => acronym !== selected);
    const affinityOf = (acronym: string) => affinityByPair.get(pairKey(period, selected, acronym)) ?? null;
    const rows = alphabetical
        .filter((acronym) => acronym !== selected)
        .flatMap((acronym) => {
            const value = affinityOf(acronym);
            return value ? [{ acronym, ...value }] : [];
        })
        .sort((first, second) => second.ratio - first.ratio);
    const strongCount = rows.filter((row) => row.ratio >= threshold).length;
    const periodText = period ? `no ${quarterName(period)}` : "desde 2025";
    const closest = rows[0];
    const farthest = rows.at(-1);
    const description =
        closest && farthest
            ? `Radar de afinidade: ${selected}, ${periodText}. Mais parecido com ${closest.acronym}, ${perHundredLabel(closest.ratio)}. Menos parecido com ${farthest.acronym}, ${perHundredLabel(farthest.ratio)}. A lista de barras traz todos os partidos.`
            : `Radar de afinidade: ${selected}, ${periodText}, sem partidos com votações em comum suficientes.`;

    function select(acronym: string) {
        clearTimeout(hideTimer.current);
        setTip(null);
        setSelected(acronym);
    }

    function scheduleHide() {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setTip(null), HIDE_DELAY_MS);
    }

    function show(next: Tip) {
        clearTimeout(hideTimer.current);
        setTip(next);
    }

    const drawingProps = {
        selected,
        others,
        affinityOf,
        threshold,
        description,
        tip,
        onShow: show,
        onScheduleHide: scheduleHide,
        onKeepTip: () => clearTimeout(hideTimer.current),
        onHide: () => setTip(null),
        onSelect: select,
    };

    return (
        <div className={styles.affinity}>
            <div className={styles.setup}>
                <div className={styles.group} role="group" aria-labelledby="affinity-party-label">
                    <span id="affinity-party-label" className={styles.groupLabel}>
                        Partido
                    </span>
                    <TwoRowSlider label="Partidos" remeasureOn={alphabetical.join("|")}>
                        {alphabetical.map((acronym) => (
                            <li key={acronym}>
                                <button type="button" className={styles.partyButton} aria-pressed={acronym === selected} onClick={() => select(acronym)}>
                                    <span className={styles.swatch} style={{ background: PARTY_COLORS[acronym]?.color ?? "var(--color-fg-3)" }} />
                                    {acronym}
                                </button>
                            </li>
                        ))}
                    </TwoRowSlider>
                </div>

                <div className={styles.controls}>
                    <div className={styles.group} role="group" aria-labelledby="affinity-period-label">
                        <span id="affinity-period-label" className={styles.groupLabel}>
                            Período
                        </span>
                        <ScrollSlider className={styles.choices}>
                            <button type="button" className={styles.choice} aria-pressed={period === null} onClick={() => setPeriod(null)}>
                                Todo o período
                            </button>
                            {quarters.map((quarter) => (
                                <button key={quarter} type="button" className={styles.choice} aria-pressed={period === quarter} onClick={() => setPeriod(quarter)}>
                                    {quarterName(quarter)}
                                </button>
                            ))}
                        </ScrollSlider>
                    </div>
                    <div className={styles.group} role="group" aria-labelledby="affinity-limit-label">
                        <span id="affinity-limit-label" className={styles.groupLabel}>
                            Destacar quem vota igual em pelo menos
                        </span>
                        <ScrollSlider className={styles.choices}>
                            {THRESHOLDS.map((value) => (
                                <button key={value} type="button" className={styles.choice} aria-pressed={threshold === value} onClick={() => setThreshold(value)}>
                                    {percentLabel(value)}
                                </button>
                            ))}
                        </ScrollSlider>
                    </div>
                </div>
            </div>

            <div className={styles.chartColumn}>
                <div className={styles.chart}>
                    <RadarDrawing layout={NARROW_RADAR} className={styles.narrow ?? ""} {...drawingProps} />
                    <RadarDrawing layout={WIDE_RADAR} className={styles.wide ?? ""} {...drawingProps} />
                </div>
                <p className={styles.note}>
                    Os números do gráfico dizem em quantas votações, em cada 100, os dois partidos ficaram do mesmo lado. A linha tracejada marca o limite escolhido.
                </p>
            </div>
            <div className={styles.card} aria-live="polite">
                <p className={styles.cardTitle}>
                    <PartyBadge acronym={selected} /> votou do mesmo lado de cada partido, {periodText}:
                </p>
                {rows.length > 0 ? (
                    <ul className={styles.bars}>
                        {rows.map((row) => (
                            <li key={row.acronym}>
                                <PartyBadge acronym={row.acronym} />
                                <span className={styles.track} role="img" aria-label={perHundredLabel(row.ratio)}>
                                    <span className={styles.fill} data-strong={row.ratio >= threshold || undefined} style={{ width: `${round2(row.ratio * 100)}%` }} />
                                </span>
                                <span className={styles.value}>{Math.round(row.ratio * 100)} em 100</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Este partido não tem votações em comum suficientes com outro partido {periodText}.</p>
                )}
                <p className={styles.note}>
                    Barra escura: a partir de {Math.round(threshold * 100)} em cada 100 ({strongCount} de {rows.length} partidos). Barra cinza: abaixo disso.
                </p>
            </div>

            <div className={styles.notes}>
                <p className={styles.note}>
                    Contam só as votações em que os dois partidos tinham uma posição clara: a maioria dos deputados de cada um votou igual. Cada par precisa de
                    pelo menos {minCommonVotes} votações assim para aparecer.
                </p>
                {sourceNote}
            </div>
        </div>
    );
}