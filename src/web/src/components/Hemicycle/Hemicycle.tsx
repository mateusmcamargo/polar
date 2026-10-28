"use client";

import { useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ChamberSeat } from "@polar/db";
import { PARTY_COLORS } from "@polar/db/party-colors";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { groupSeatsByParty, MIN_COUNTED_VOTES, partyLabel, type SeatWithRates } from "./chamberParties";
import { CENTER_X, CENTER_Y, HEMICYCLE_HEIGHT, HEMICYCLE_WIDTH, layoutSeats, SEAT_SIZE } from "./seatLayout";
import styles from "./Hemicycle.module.scss";

const DESKTOP_QUERY = "(min-width: 900px)";
const NEUTRAL_SEAT_COLOR = "var(--color-fg-3)";

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
}

export function Hemicycle({ seats, periodText }: Readonly<HemicycleProps>) {
    const router = useRouter();
    const figureRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [selectedAcronym, setSelectedAcronym] = useState<string | null>(null);
    const [hoveredSeat, setHoveredSeat] = useState<SeatWithRates | null>(null);
    const [isListOpen, setIsListOpen] = useState(false);
    const [isMethodOpen, setIsMethodOpen] = useState(false);

    const parties = useMemo(() => groupSeatsByParty(seats), [seats]);
    const positions = useMemo(() => layoutSeats(parties.map((party) => party.seats.length)), [parties]);
    const selectedParty = parties.find((party) => party.acronym === selectedAcronym) ?? null;
    const seatList = useMemo(() => parties.flatMap((party) => party.seats), [parties]);

    // drawn once per party selection: hovering never re-renders the 513 seats
    const seatElements = useMemo(() => {
        let seatIndex = 0;
        return parties.flatMap((party, partyIndex) => {
            const isDimmed = selectedAcronym !== null && party.acronym !== selectedAcronym;
            const fill = PARTY_COLORS[party.acronym]?.color ?? NEUTRAL_SEAT_COLOR;
            return party.seats.map((seat, indexInParty) => {
                const position = positions[partyIndex]?.[indexInParty];
                const index = seatIndex++;
                if (!position) {
                    return null;
                }
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
        });
    }, [parties, positions, selectedAcronym]);

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
            router.push(`/deputados?nome=${encodeURIComponent(seat.politicalName)}`);
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
                        {seats.length}
                    </text>
                    <text x={CENTER_X} y={CENTER_Y - 4} className={styles.totalLabel}>
                        deputados
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

            <ul className={styles.legend} aria-label="Partidos, do mais ao menos alinhado ao governo">
                {parties.map((party) => (
                    <li key={party.acronym}>
                        <button
                            type="button"
                            className={styles.legendButton}
                            aria-pressed={party.acronym === selectedAcronym}
                            onClick={() => setSelectedAcronym(party.acronym === selectedAcronym ? null : party.acronym)}
                        >
                            <span className={styles.swatch} style={{ background: PARTY_COLORS[party.acronym]?.color ?? NEUTRAL_SEAT_COLOR }} />
                            <span className={styles.legendAcronym}>{party.label}</span>
                            <span className={styles.legendSeats}>{party.seats.length}</span>
                            {party.governmentRate === null && <span className={styles.legendFlag}>poucos votos</span>}
                        </button>
                    </li>
                ))}
            </ul>
            <p className={styles.hint}>Toque em um partido para ver onde estão os seus deputados.</p>

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
                        <Link href={`/deputados?partido=${encodeURIComponent(selectedParty.acronym)}`} className={styles.goButton}>
                            Ver os deputados do {selectedParty.label}
                            <ArrowRight aria-hidden="true" />
                        </Link>
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
                <div id="chamber-party-list" className={styles.tableScroll} tabIndex={0} role="region" aria-label="Partidos em lista">
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
                </div>
            )}
        </div>
    );
}