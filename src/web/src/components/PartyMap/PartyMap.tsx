"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { PartyMovementParty } from "@polar/db";
import { PARTY_COLORS } from "@polar/db/party-colors";
import { MIN_COUNTED_VOTES } from "@/components/Hemicycle/chamberParties";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { TwoRowSlider } from "@/components/TwoRowSlider/TwoRowSlider";
import { MIN_RADIUS, NARROW_MAP, placeLabels, WIDE_MAP, type MapLayout } from "./mapLayout";
import { percentLabel, quarterName, round2 } from "./movementText";
import styles from "./PartyMap.module.scss";

type SizeKey = "seats" | "wins" | "chairs";

const SIZE_OPTIONS: readonly { key: SizeKey; label: string; note: string }[] = [
    { key: "seats", label: "Cadeiras", note: "Cadeiras: quantos deputados votaram no trimestre, contados pelo partido que tinham no último voto." },
    {
        key: "wins",
        label: "Vitórias em votação",
        note: "Vitórias em votação: votações em que a maioria do partido votou Sim e a proposta foi aprovada, ou votou Não e foi rejeitada.",
    },
    {
        key: "chairs",
        label: "Comissões presididas",
        note: "Comissões presididas: presidências e vice-presidências de [[comissao-permanente|comissões permanentes]] ocupadas hoje por deputados do partido. Este número não muda de um trimestre para outro.",
    },
];

const NEUTRAL_COLOR = "var(--color-fg-3)";
const DIMMED_OPACITY = 0.18;

function colorOf(acronym: string): string {
    return PARTY_COLORS[acronym]?.color ?? NEUTRAL_COLOR;
}

function quarterOf(party: PartyMovementParty, quarter: string | undefined) {
    return party.quarters.find((item) => item.quarter === quarter);
}

function sizeValue(party: PartyMovementParty, quarter: string | undefined, size: SizeKey): number {
    if (size === "chairs") {
        return party.committeeChairs;
    }
    const at = quarterOf(party, quarter);
    if (!at) {
        return 0;
    }
    return size === "seats" ? at.seats : at.voteWins;
}

// the vertical axis starts at the lowest value of the data, rounded down, so the circles are not squeezed into the top
function lowestPartyRate(parties: readonly PartyMovementParty[]): number {
    let lowest = 1;
    for (const party of parties) {
        for (const item of party.quarters) {
            if (item.partyRate !== null) {
                lowest = Math.min(lowest, item.partyRate);
            }
        }
    }
    return Math.max(0, Math.floor((lowest - 0.03) * 10) / 10);
}

function ticks(from: number, step: number): number[] {
    const first = Math.ceil(from / step - 1e-9);
    const last = Math.floor(1 / step + 1e-9);
    return Array.from({ length: last - first + 1 }, (_, index) => (first + index) * step);
}

interface MapDrawingProps {
    layout: MapLayout;
    parties: readonly PartyMovementParty[];
    quarters: readonly string[];
    quarterIndex: number;
    size: SizeKey;
    showAll: boolean;
    highlight: string | null;
    lowRate: number;
    description: string;
    className: string;
    onToggle: (acronym: string) => void;
    onHover: (acronym: string | null) => void;
}

function MapDrawing({ layout, parties, quarters, quarterIndex, size, showAll, highlight, lowRate, description, className, onToggle, onHover }: Readonly<MapDrawingProps>) {
    const quarter = quarters[quarterIndex];
    const plotWidth = layout.width - layout.left - layout.right;
    const plotHeight = layout.height - layout.top - layout.bottom;
    const x = (rate: number) => round2(layout.left + rate * plotWidth);
    const y = (rate: number) => round2(layout.top + (1 - (rate - lowRate) / (1 - lowRate)) * plotHeight);
    const lastTrailIndex = showAll ? quarters.length - 1 : quarterIndex;

    const maxValue = Math.max(1, ...parties.map((party) => sizeValue(party, quarter, size)));
    const radiusOf = (value: number) => (value <= 0 ? MIN_RADIUS : 5 + (layout.maxRadius - 5) * Math.sqrt(value / maxValue));
    // the biggest circles first, so the small ones are drawn on top and stay visible
    const entries = parties
        .flatMap((party) => {
            const at = quarterOf(party, quarter);
            if (!at || at.governmentRate === null || at.partyRate === null) {
                return [];
            }
            const value = sizeValue(party, quarter, size);
            return [{ party, cx: x(at.governmentRate), cy: y(at.partyRate), value, radius: round2(radiusOf(value)) }];
        })
        .sort((first, second) => second.value - first.value);
    const labels = placeLabels(
        entries.map((entry) => ({ key: entry.party.acronym, cx: entry.cx, cy: entry.cy, radius: entry.radius, text: entry.party.acronym })),
        layout,
    );

    const opacityOf = (acronym: string) => (highlight && highlight !== acronym ? DIMMED_OPACITY : 1);

    return (
        <svg className={className} viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={description}>
            {ticks(0, layout.xStep).map((rate) => (
                <g key={`x${rate}`}>
                    <line className={styles.grid} x1={x(rate)} x2={x(rate)} y1={layout.top} y2={layout.top + plotHeight} />
                    <text className={styles.tick} x={x(rate)} y={layout.top + plotHeight + 18} textAnchor="middle">
                        {percentLabel(rate)}
                    </text>
                </g>
            ))}
            {ticks(lowRate, layout.yStep).map((rate) => (
                <g key={`y${rate}`}>
                    <line className={styles.grid} x1={layout.left} x2={layout.left + plotWidth} y1={y(rate)} y2={y(rate)} />
                    <text className={styles.tick} x={layout.left - 6} y={y(rate) + 4} textAnchor="end">
                        {percentLabel(rate)}
                    </text>
                </g>
            ))}
            <line className={styles.axis} x1={layout.left} x2={layout.left + plotWidth} y1={layout.top + plotHeight} y2={layout.top + plotHeight} />
            <line className={styles.axis} x1={layout.left} x2={layout.left} y1={layout.top} y2={layout.top + plotHeight} />
            <text className={styles.axisTitle} x={layout.left + plotWidth / 2} y={layout.height - 10} textAnchor="middle">
                Votou como o governo pediu
            </text>
            <text className={styles.axisTitle} transform={`translate(13 ${layout.top + plotHeight / 2}) rotate(-90)`} textAnchor="middle">
                {layout.key === "narrow" ? "Votou como seu partido" : "Votou como a maioria do próprio partido"}
            </text>

            {parties.map((party) => {
                const points = party.quarters.filter(
                    (item) => item.governmentRate !== null && item.partyRate !== null && quarters.indexOf(item.quarter) <= lastTrailIndex,
                );
                if (points.length === 0) {
                    return null;
                }
                const isHighlighted = highlight === party.acronym;
                return (
                    <g key={party.acronym} opacity={opacityOf(party.acronym)}>
                        <polyline
                            className={isHighlighted ? styles.trailStrong : styles.trail}
                            points={points.map((item) => `${x(item.governmentRate ?? 0)},${y(item.partyRate ?? 0)}`).join(" ")}
                        />
                        {points
                            .filter((item) => item.quarter !== quarter)
                            .map((item) => (
                                <circle key={item.quarter} className={styles.trailDot} cx={x(item.governmentRate ?? 0)} cy={y(item.partyRate ?? 0)} r={isHighlighted ? 4 : 2.5} />
                            ))}
                    </g>
                );
            })}

            {entries.map((entry) => (
                <circle
                    key={entry.party.acronym}
                    className={styles.party}
                    cx={entry.cx}
                    cy={entry.cy}
                    r={entry.radius}
                    style={{ fill: entry.value > 0 ? colorOf(entry.party.acronym) : undefined }}
                    data-empty={entry.value <= 0 || undefined}
                    data-selected={highlight === entry.party.acronym || undefined}
                    opacity={opacityOf(entry.party.acronym)}
                    onClick={() => onToggle(entry.party.acronym)}
                    onPointerEnter={(event) => event.pointerType === "mouse" && onHover(entry.party.acronym)}
                    onPointerLeave={() => onHover(null)}
                />
            ))}
            {entries.map((entry) => {
                const label = labels.get(entry.party.acronym);
                return label ? (
                    <text key={entry.party.acronym} className={styles.partyLabel} x={round2(label.x)} y={round2(label.y)} textAnchor={label.anchor} opacity={opacityOf(entry.party.acronym)}>
                        {entry.party.acronym}
                    </text>
                ) : null;
            })}
        </svg>
    );
}

interface PartyMapProps {
    parties: readonly PartyMovementParty[];
    // first day of every quarter of the period, oldest first
    quarters: readonly string[];
    nominalVotes: number;
    votesWithoutResult: number;
    sourceNote: ReactNode;
}

// where each party stands in relation to the government and to its own majority, quarter by quarter (DESIGN.md, "Party map").
// The drawing is only a view: the buttons of the legend and the table hold the same numbers, so nothing depends on the pointer
export function PartyMap({ parties, quarters, nominalVotes, votesWithoutResult, sourceNote }: Readonly<PartyMapProps>) {
    const [quarterIndex, setQuarterIndex] = useState(Math.max(0, quarters.length - 1));
    const [size, setSize] = useState<SizeKey>("seats");
    const [showAll, setShowAll] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);
    const highlight = hovered ?? selected;

    const lowRate = useMemo(() => lowestPartyRate(parties), [parties]);
    const quarter = quarters[quarterIndex];
    const sizeOption = SIZE_OPTIONS.find((option) => option.key === size) ?? SIZE_OPTIONS[0];
    const legendParties = useMemo(
        () => [...parties].sort((first, second) => sizeValue(second, quarter, size) - sizeValue(first, quarter, size) || first.acronym.localeCompare(second.acronym)),
        [parties, quarter, size],
    );
    const legendKey = legendParties.map((party) => `${party.acronym}${sizeValue(party, quarter, size)}`).join("|");
    const drawnCount = parties.filter((party) => {
        const at = quarterOf(party, quarter);
        return at && at.governmentRate !== null && at.partyRate !== null;
    }).length;
    const description = `Mapa dos partidos no ${quarter ? quarterName(quarter) : ""}. ${drawnCount} partidos com votações suficientes. Os mesmos números estão na tabela abaixo.`;
    const highlightedParty = parties.find((party) => party.acronym === highlight);
    const highlightedAt = highlightedParty ? quarterOf(highlightedParty, quarter) : undefined;

    function toggle(acronym: string) {
        setSelected((current) => (current === acronym ? null : acronym));
    }

    const drawingProps = { parties, quarters, quarterIndex, size, showAll, highlight, lowRate, description, onToggle: toggle, onHover: setHovered };

    return (
        <div className={styles.map}>
            <div className={styles.controls}>
                <div role="group" aria-labelledby="map-quarter-label" className={styles.group}>
                    <span id="map-quarter-label" className={styles.groupLabel}>
                        Trimestre
                    </span>
                    <ScrollSlider className={styles.choices}>
                        {quarters.map((item, index) => (
                            <button key={item} type="button" className={styles.choice} aria-pressed={index === quarterIndex} onClick={() => setQuarterIndex(index)}>
                                {quarterName(item)}
                            </button>
                        ))}
                    </ScrollSlider>
                </div>
                <div role="group" aria-labelledby="map-size-label" className={styles.group}>
                    <span id="map-size-label" className={styles.groupLabel}>
                        Tamanho do círculo
                    </span>
                    <ScrollSlider className={styles.choices}>
                        {SIZE_OPTIONS.map((option) => (
                            <button key={option.key} type="button" className={styles.choice} aria-pressed={option.key === size} onClick={() => setSize(option.key)}>
                                {option.label}
                            </button>
                        ))}
                    </ScrollSlider>
                </div>
                <button type="button" className={styles.choice} aria-pressed={showAll} onClick={() => setShowAll((current) => !current)}>
                    Mostrar todos os trimestres
                </button>
            </div>

            <div className={styles.drawing}>
                <MapDrawing layout={NARROW_MAP} className={styles.narrow ?? ""} {...drawingProps} />
                <MapDrawing layout={WIDE_MAP} className={styles.wide ?? ""} {...drawingProps} />
            </div>
            <p className={styles.note}>{sizeOption && <GlossaryText text={sizeOption.note} />}</p>

            <TwoRowSlider label="Partidos, do maior ao menor valor escolhido" remeasureOn={legendKey}>
                {legendParties.map((party) => (
                    <li key={party.acronym}>
                        <button type="button" className={styles.legendButton} aria-pressed={party.acronym === selected} onClick={() => toggle(party.acronym)}>
                            <span className={styles.swatch} style={{ background: colorOf(party.acronym) }} />
                            <span className={styles.legendAcronym}>{party.acronym}</span>
                            <span className={styles.legendValue}>{sizeValue(party, quarter, size)}</span>
                        </button>
                    </li>
                ))}
            </TwoRowSlider>

            <div className={styles.card} aria-live="polite">
                {highlightedParty ? (
                    <>
                        <p className={styles.cardTitle}>
                            <PartyBadge acronym={highlightedParty.acronym} /> no {quarter ? quarterName(quarter) : ""}
                        </p>
                        {highlightedAt ? (
                            <dl className={styles.facts}>
                                <dt>Votou como o governo pediu</dt>
                                <dd>
                                    {highlightedAt.governmentRate === null ? "poucas votações" : percentLabel(highlightedAt.governmentRate)}
                                    <span className={styles.factNote}> (média de {highlightedAt.governmentDeputies} deputados)</span>
                                </dd>
                                <dt>Votou como a maioria do partido</dt>
                                <dd>
                                    {highlightedAt.partyRate === null ? "poucas votações" : percentLabel(highlightedAt.partyRate)}
                                    <span className={styles.factNote}> (média de {highlightedAt.partyDeputies} deputados)</span>
                                </dd>
                                <dt>Cadeiras</dt>
                                <dd>{highlightedAt.seats}</dd>
                                <dt>Vitórias em votação</dt>
                                <dd>
                                    {highlightedAt.voteWins} de {highlightedAt.decidedVotes}
                                </dd>
                                <dt>Comissões presididas hoje</dt>
                                <dd>{highlightedParty.committeeChairs}</dd>
                            </dl>
                        ) : (
                            <p>Sem votações neste trimestre.</p>
                        )}
                        <a className={styles.link} href={`/deputados?partido=${encodeURIComponent(highlightedParty.acronym)}`}>
                            Ver deputados do {highlightedParty.acronym}
                        </a>
                    </>
                ) : (
                    <p className={styles.hint}>Toque em um partido, no mapa ou nos botões, para destacar o caminho dele e ver os números do trimestre.</p>
                )}
            </div>

            <details className={styles.table}>
                <summary>Ver como tabela</summary>
                <div className={styles.tableScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Partido</th>
                                <th scope="col">Trimestre</th>
                                <th scope="col">Com o governo</th>
                                <th scope="col">Com o partido</th>
                                <th scope="col">Cadeiras</th>
                                <th scope="col">Vitórias</th>
                                <th scope="col">Comissões presididas hoje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parties.flatMap((party) =>
                                party.quarters.map((item) => (
                                    <tr key={`${party.acronym}-${item.quarter}`}>
                                        <th scope="row">{party.acronym}</th>
                                        <td>{quarterName(item.quarter)}</td>
                                        <td>{item.governmentRate === null ? "–" : percentLabel(item.governmentRate)}</td>
                                        <td>{item.partyRate === null ? "–" : percentLabel(item.partyRate)}</td>
                                        <td>{item.seats}</td>
                                        <td>
                                            {item.voteWins} de {item.decidedVotes}
                                        </td>
                                        <td>{party.committeeChairs}</td>
                                    </tr>
                                )),
                            )}
                        </tbody>
                    </table>
                </div>
            </details>

            <p className={styles.method}>
                <GlossaryText
                    text={`Cada ponto é a média dos deputados com pelo menos ${MIN_COUNTED_VOTES} votações contadas no trimestre. Das ${nominalVotes} [[votacao-nominal|votações nominais]] do [[plenario|Plenário]] desde 2025, ${votesWithoutResult} não têm o resultado registrado e ficam de fora das vitórias em votação.`}
                />
            </p>
            {sourceNote}
        </div>
    );
}