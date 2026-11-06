"use client";

import { useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ChamberSeat } from "@polar/db";
import { PARTY_COLORS } from "@polar/db/party-colors";
import { NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { groupSeatsByParty, MIN_COUNTED_VOTES, partyLabel, type SeatWithRates } from "./chamberParties";
import { CENTER_X, CENTER_Y, HEMICYCLE_HEIGHT, HEMICYCLE_WIDTH, layoutSeats, SEAT_SIZE } from "./seatLayout";
import { SkeletonArea } from "@/components/Skeleton/Skeleton";
import styles from "./Hemicycle.module.scss";

const DESKTOP_QUERY = "(min-width: 900px)";
const NEUTRAL_SEAT_COLOR = "var(--color-fg-3)";

// phones show the legend as a slider of two packed rows: odd items on top, even items below, so the order still reads from
// left to right. The list gets the width of its longest row, measured, because css cannot size a wrapping row on its own
function fitLegendRows(list: HTMLUListElement) {
    // the items stretch to fill their row only once fitted, so they are measured with the stretch turned off
    list.removeAttribute("data-fitted");
    const widths = [...list.children].map((item) => item.getBoundingClientRect().width);
    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
    const rowWidth = (parity: number) => {
        const row = widths.filter((_, index) => index % 2 === parity);
        return row.reduce((total, width) => total + width, 0) + gap * Math.max(row.length - 1, 0);
    };
    list.style.setProperty("--legend-row-width", `${Math.ceil(Math.max(rowWidth(0), rowWidth(1)))}px`);
    list.setAttribute("data-fitted", "");
}

function percent(rate: number): string {
    return `${Math.round(rate * 100)}%`;
}

// "28% (95 de 340 votações)", or the reason there is no rate
function rateText(rate: number | null, aligned: number, counted: number): string {
    return rate === null ? "poucos votos para calcular" : `${percent(rate)} (${aligned} de ${counted} votações)`;
}

function deputiesLabel(count: number): string {
    return `${count} ${count === 1 ? "deputado" : "deputados"}`;
}

interface HemicycleProps {
    seats: ChamberSeat[];
    periodText: string;
    // seats lit by the filters of the deputy search, null when no filter is active
    highlightedIds: ReadonlySet<number> | null;
    // what the lit seats are, read after the count in the center ("de São Paulo")
    highlightText: string;
    // the party filter of the deputy search, shared with the legend
    selectedAcronym: string;
    onSelectParty: (acronym: string) => void;
}

// controlled by DeputySearch: the map, the party filter and the name search light the matching seats and dim the others,
// which keep their place, so the drawing shows where those deputies sit
export function Hemicycle({ seats, periodText, highlightedIds, highlightText, selectedAcronym, onSelectParty }: Readonly<HemicycleProps>) {
    const router = useRouter();
    const figureRef = useRef<HTMLElement>(null);
    const legendRef = useRef<HTMLUListElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [hoveredSeat, setHoveredSeat] = useState<SeatWithRates | null>(null);
    const [isListOpen, setIsListOpen] = useState(false);
    const [isMethodOpen, setIsMethodOpen] = useState(false);

    const parties = useMemo(() => groupSeatsByParty(seats), [seats]);
    // measured before the first paint after hydration, again when the parties change and after the web font loads, which
    // changes the width of the labels
    useLayoutEffect(() => {
        const list = legendRef.current;
        if (!list) {
            return;
        }
        fitLegendRows(list);
        let isCurrent = true;
        void document.fonts.ready.then(() => {
            if (isCurrent) {
                fitLegendRows(list);
            }
        });
        return () => {
            isCurrent = false;
        };
    }, [parties]);
    const positions = useMemo(() => layoutSeats(parties.map((party) => party.seats.length)), [parties]);
    const selectedParty = parties.find((party) => party.acronym === selectedAcronym) ?? null;
    const litCount = highlightedIds ? seats.filter((seat) => highlightedIds.has(seat.id)).length : seats.length;
    const seatList = useMemo(() => parties.flatMap((party) => party.seats), [parties]);

    // drawn once per filter change: hovering never re-renders the 513 seats
    const seatElements = useMemo(() => {
        let seatIndex = 0;
        // one group per party, so the entry animation moves 21 groups in turn instead of 513 seats
        return parties.map((party, partyIndex) => {
            const fill = PARTY_COLORS[party.acronym]?.color ?? NEUTRAL_SEAT_COLOR;
            const seatRects = party.seats.map((seat, indexInParty) => {
                const position = positions[partyIndex]?.[indexInParty];
                const index = seatIndex++;
                if (!position) {
                    return null;
                }
                const isDimmed = highlightedIds !== null && !highlightedIds.has(seat.id);
                return (
                    <rect
                        key={seat.id}
                        data-seat={index}
                        className={isDimmed ? styles.dimmedSeat : styles.seat}
                        x={(position.x - SEAT_SIZE / 2).toFixed(2)}
                        y={(position.y - SEAT_SIZE / 2).toFixed(2)}
                        width={SEAT_SIZE}
                        height={SEAT_SIZE}
                        rx={1.6}
                        transform={`rotate(${position.rotation} ${position.x} ${position.y})`}
                        style={{ fill }}
                    />
                );
            });
            return (
                <g key={party.acronym} data-reveal="rise">
                    {seatRects}
                </g>
            );
        });
    }, [parties, positions, highlightedIds]);

    function seatFromEvent(target: EventTarget): SeatWithRates | null {
        const index = target instanceof Element ? target.getAttribute("data-seat") : null;
        return index === null ? null : (seatList[Number(index)] ?? null);
    }

    // one listener for the whole drawing; the tooltip moves through the dom and state changes only when the seat changes
    function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
        const seat = window.matchMedia(DESKTOP_QUERY).matches ? seatFromEvent(event.target) : null;
        const frame = figureRef.current?.getBoundingClientRect();
        if (seat && frame && tooltipRef.current) {
            tooltipRef.current.style.left = `${event.clientX - frame.left}px`;
            tooltipRef.current.style.top = `${event.clientY - frame.top}px`;
        }
        if (seat?.id !== hoveredSeat?.id) {
            setHoveredSeat(seat);
        }
    }

    // seats are too small to tap on phones, there the legend is the way in
    function handleClick(event: MouseEvent<SVGSVGElement>) {
        const seat = seatFromEvent(event.target);
        if (seat && window.matchMedia(DESKTOP_QUERY).matches) {
            router.push(`/deputados/${seat.id}`, { transitionTypes: NAV_FORWARD });
        }
    }

    const description =
        `Semicírculo com as ${seats.length} cadeiras da Câmara, agrupadas por partido, do mais ao menos alinhado ao governo: ` +
        `${parties.map((party) => `${party.label}, ${party.seats.length}`).join("; ")}. A mesma informação está na lista de partidos.`;

    return (
        <div className={styles.hemicycle}>
            <figure className={styles.figure} ref={figureRef}>
                <svg
                    className={styles.drawing}
                    viewBox={`0 0 ${HEMICYCLE_WIDTH} ${HEMICYCLE_HEIGHT}`}
                    role="img"
                    aria-label={description}
                    onPointerMove={handlePointerMove}
                    onPointerLeave={() => setHoveredSeat(null)}
                    onClick={handleClick}
                >
                    {seatElements}
                    <text x={CENTER_X} y={CENTER_Y - 26} className={styles.total}>
                        {litCount}
                    </text>
                    <text x={CENTER_X} y={CENTER_Y - 4} className={styles.totalLabel}>
                        {highlightedIds ? `de ${seats.length} deputados` : "deputados"}
                    </text>
                </svg>
                <div ref={tooltipRef} className={styles.tooltip} hidden={!hoveredSeat} aria-hidden="true">
                    {hoveredSeat && (
                        <>
                            <strong className={styles.tooltipName}>{hoveredSeat.politicalName}</strong>
                            <span>
                                {partyLabel(hoveredSeat.partyAcronym ?? "S.PART.")} · {hoveredSeat.stateCode}
                            </span>
                            <span>Com o governo: {rateText(hoveredSeat.governmentRate, hoveredSeat.governmentAligned, hoveredSeat.governmentVotes)}</span>
                            <span>Com o partido: {rateText(hoveredSeat.partyRate, hoveredSeat.partyAligned, hoveredSeat.partyVotes)}</span>
                        </>
                    )}
                </div>
            </figure>

            <div className={styles.axis} aria-hidden="true">
                <span className={styles.axisEnd}>
                    <ArrowLeft />
                    Mais alinhados ao governo
                </span>
                <span className={styles.axisEnd}>
                    Menos alinhados ao governo
                    <ArrowRight />
                </span>
            </div>

            <ScrollSlider className={styles.legendScroll}>
                <ul ref={legendRef} className={styles.legend} aria-label="Partidos, do mais ao menos alinhado ao governo">
                    {parties.map((party) => (
                        <li key={party.acronym}>
                            <button
                                type="button"
                                className={styles.legendButton}
                                aria-pressed={party.acronym === selectedAcronym}
                                onClick={() => onSelectParty(party.acronym === selectedAcronym ? "" : party.acronym)}
                            >
                                <span className={styles.swatch} style={{ background: PARTY_COLORS[party.acronym]?.color ?? NEUTRAL_SEAT_COLOR }} />
                                <span className={styles.legendAcronym}>{party.label}</span>
                                <span className={styles.legendSeats}>{party.seats.length}</span>
                                {party.governmentRate === null && <span className={styles.legendFlag}>poucos votos</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </ScrollSlider>
            <p className={styles.hint}>Toque em um partido, ou num estado do mapa abaixo, para ver onde estão os seus deputados.</p>

            <p className={styles.litSummary} aria-live="polite">
                {highlightedIds && highlightedIds.size === 0 ? (
                    "Nenhum deputado com esses filtros, então nenhuma cadeira está acesa."
                ) : highlightedIds ? (
                    <>
                        <strong>{litCount}</strong> {litCount === 1 ? "cadeira acesa" : "cadeiras acesas"}: {highlightText}.
                        {litCount < highlightedIds.size && " Quem saiu do cargo aparece na lista, mas não tem cadeira na Câmara."}
                    </>
                ) : (
                    "Todas as cadeiras acesas. Use o mapa, o partido ou o nome para acender só algumas."
                )}
            </p>

            <div className={styles.detailArea} aria-live="polite">
                {selectedParty && (
                    <div className={styles.detail}>
                        <div className={styles.facts}>
                            <p className={styles.detailName}>
                                <PartyBadge acronym={selectedParty.acronym} /> {deputiesLabel(selectedParty.seats.length)}
                            </p>
                            <p className={styles.fact}>
                                {selectedParty.governmentRate === null ? (
                                    "Poucos votos para calcular o alinhamento ao governo."
                                ) : (
                                    <>
                                        Votou como o governo orientou em <strong>{percent(selectedParty.governmentRate)}</strong> das votações.
                                    </>
                                )}
                            </p>
                            {selectedParty.partyRate !== null && (
                                <p className={styles.fact}>
                                    Votou igual à maioria do próprio partido em <strong>{percent(selectedParty.partyRate)}</strong> das votações.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                <button type="button" className={styles.control} aria-expanded={isListOpen} aria-controls="chamber-party-list" onClick={() => setIsListOpen(!isListOpen)}>
                    {isListOpen ? "Esconder lista" : "Ver como lista"}
                </button>
                <button type="button" className={styles.control} aria-expanded={isMethodOpen} aria-controls="chamber-method" onClick={() => setIsMethodOpen(!isMethodOpen)}>
                    Como calculamos
                </button>
            </div>

            {isMethodOpen && (
                <div id="chamber-method" className={styles.balloon}>
                    <p className={styles.balloonLabel}>
                        <strong>Como calculamos</strong>
                    </p>
                    <p>
                        Em cada votação do Plenário, o líder do governo diz como os deputados aliados devem votar. Contamos em quantas dessas votações
                        cada deputado votou do mesmo jeito.
                    </p>
                    <p>&quot;Com o partido&quot; conta em quantas votações o deputado votou igual à maioria dos deputados do seu partido naquele dia.</p>
                    <p>
                        O número do partido é a média dos seus deputados. Quem tem menos de {MIN_COUNTED_VOTES} votos contados fica sem número. Não contam as
                        votações em que o governo liberou o voto.
                    </p>
                    <p>{periodText}</p>
                </div>
            )}

            {isListOpen && (
                <ScrollSlider direction="vertical" id="chamber-party-list" className={styles.tableScroll} tabIndex={0} role="region" aria-label="Partidos em lista">
                    <table className={styles.table}>
                        <caption className="visually-hidden">Partidos da Câmara, do mais ao menos alinhado ao governo</caption>
                        <thead>
                            <tr>
                                <th scope="col">Partido</th>
                                <th scope="col" className={styles.number}>
                                    Cadeiras
                                </th>
                                <th scope="col" className={styles.number}>
                                    Com o governo
                                </th>
                                <th scope="col" className={styles.number}>
                                    Com o partido
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {parties.map((party) => (
                                <tr key={party.acronym}>
                                    <td>
                                        <PartyBadge acronym={party.acronym} />
                                    </td>
                                    <td className={styles.number}>{party.seats.length}</td>
                                    <td className={styles.number}>{party.governmentRate === null ? "poucos votos" : percent(party.governmentRate)}</td>
                                    <td className={styles.number}>{party.partyRate === null ? "poucos votos" : percent(party.partyRate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </ScrollSlider>
            )}
        </div>
    );
}

// the chamber drawing while it loads, with the proportions of the seats
export function HemicycleSkeleton() {
    return <SkeletonArea ratio={`${HEMICYCLE_WIDTH} / ${HEMICYCLE_HEIGHT}`} />;
}