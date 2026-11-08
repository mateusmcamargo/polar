"use client";

import { useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import type { VoteSeat } from "@polar/db";
import { NO_PARTY_ACRONYM, partyLabel } from "@/components/Hemicycle/chamberParties";
import { CENTER_X, CENTER_Y, HEMICYCLE_HEIGHT, HEMICYCLE_WIDTH, layoutSeats, SEAT_SIZE } from "@/components/Hemicycle/seatLayout";
import { NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import { SkeletonArea } from "@/components/Skeleton/Skeleton";
import { VOTE_CHOICE_ORDER, VOTE_CHOICE_WORDS } from "@/components/VoterList/voteChoices";
import { deputyVoteHref } from "@/components/VoterList/deputyVoteHref";
import styles from "./VoteHemicycle.module.scss";

const DESKTOP_QUERY = "(min-width: 900px)";

const SEAT_CLASSES: Readonly<Record<string, string | undefined>> = {
    YES: styles.yes,
    NO: styles.no,
    ABSTENTION: styles.abstain,
    OBSTRUCTION: styles.obstruct,
    ARTICLE_17: styles.presiding,
    NOT_VOTED: styles.notVoted,
};

function choiceRank(choice: string): number {
    const rank = VOTE_CHOICE_ORDER.findIndex((candidate) => candidate === choice);
    return rank === -1 ? VOTE_CHOICE_ORDER.length : rank;
}

// parties in the given order (the same as the hemicycle of /deputados), parties missing from it after them, no party last;
// inside a party the seats go by choice, so each slice shows how the party split
function orderSeats(seats: readonly VoteSeat[], partyOrder: readonly string[]): VoteSeat[][] {
    const seatsByParty = new Map<string, VoteSeat[]>();
    for (const seat of seats) {
        const acronym = seat.partyAcronym ?? NO_PARTY_ACRONYM;
        seatsByParty.set(acronym, [...(seatsByParty.get(acronym) ?? []), seat]);
    }
    const position = (acronym: string) => {
        if (acronym === NO_PARTY_ACRONYM) {
            return Number.MAX_SAFE_INTEGER;
        }
        const index = partyOrder.indexOf(acronym);
        return index === -1 ? partyOrder.length : index;
    };
    return [...seatsByParty.entries()]
        .sort(([first], [second]) => position(first) - position(second) || first.localeCompare(second, "pt-BR"))
        .map(([, partySeats]) =>
            partySeats.sort(
                (first, second) =>
                    choiceRank(first.choice) - choiceRank(second.choice) || first.politicalName.localeCompare(second.politicalName, "pt-BR"),
            ),
        );
}

interface VoteHemicycleProps {
    seats: readonly VoteSeat[];
    // acronyms from the most to the least aligned to the government, as in the hemicycle of /deputados
    partyOrder: readonly string[];
    // deputies whose seats are lit by the filters, null when no filter is active
    litIds: ReadonlySet<number> | null;
    // deputy singled out by ?deputado=, drawn with an ink outline
    focusedId: number | null;
    // the vote of the seats: a click on a seat opens the deputy already focused on this vote
    voteId: string;
    occurredAt: Date;
}

// one seat per deputy, colored by the vote; the list of voters is the accessible equivalent of the drawing
export function VoteHemicycle({ seats, partyOrder, litIds, focusedId, voteId, occurredAt }: Readonly<VoteHemicycleProps>) {
    const router = useRouter();
    const figureRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [hoveredSeat, setHoveredSeat] = useState<VoteSeat | null>(null);

    const ordered = useMemo(() => orderSeats(seats, partyOrder), [seats, partyOrder]);
    const positions = useMemo(() => layoutSeats(ordered.map((partySeats) => partySeats.length)), [ordered]);
    const seatList = useMemo(() => ordered.flat(), [ordered]);
    const litCount = litIds ? seats.filter((seat) => litIds.has(seat.deputyId)).length : seats.length;

    // drawn once per filter change: hovering never re-renders the 513 seats
    const seatElements = useMemo(() => {
        let seatIndex = 0;
        return ordered.map((partySeats, partyIndex) => (
            <g key={partySeats[0]?.partyAcronym ?? NO_PARTY_ACRONYM}>
                {partySeats.map((seat, indexInParty) => {
                    const position = positions[partyIndex]?.[indexInParty];
                    const index = seatIndex++;
                    if (!position) {
                        return null;
                    }
                    const isDimmed = litIds !== null && !litIds.has(seat.deputyId);
                    const classNames = [SEAT_CLASSES[seat.choice], isDimmed ? styles.dimmed : "", seat.deputyId === focusedId ? styles.focused : ""];
                    return (
                        <rect
                            key={seat.deputyId}
                            data-seat={index}
                            className={classNames.filter(Boolean).join(" ")}
                            x={(position.x - SEAT_SIZE / 2).toFixed(2)}
                            y={(position.y - SEAT_SIZE / 2).toFixed(2)}
                            width={SEAT_SIZE}
                            height={SEAT_SIZE}
                            rx={1.6}
                            transform={`rotate(${position.rotation} ${position.x} ${position.y})`}
                        />
                    );
                })}
            </g>
        ));
    }, [ordered, positions, litIds, focusedId]);

    function seatFromEvent(target: EventTarget): VoteSeat | null {
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
        if (seat?.deputyId !== hoveredSeat?.deputyId) {
            setHoveredSeat(seat);
        }
    }

    // seats are too small to tap on phones, there the list below is the way in
    function handleClick(event: MouseEvent<SVGSVGElement>) {
        const seat = seatFromEvent(event.target);
        if (seat && window.matchMedia(DESKTOP_QUERY).matches) {
            router.push(deputyVoteHref(seat.deputyId, voteId, occurredAt), { transitionTypes: NAV_FORWARD });
        }
    }

    const countsText = VOTE_CHOICE_ORDER.map((choice) => ({ choice, count: seats.filter((seat) => seat.choice === choice).length }))
        .filter(({ count }) => count > 0)
        .map(({ choice, count }) => `${VOTE_CHOICE_WORDS[choice]}, ${count}`)
        .join("; ");
    const description = `Semicírculo com ${seats.length} cadeiras, uma por deputado, agrupadas por partido e coloridas pelo voto: ${countsText}. A lista abaixo traz os mesmos dados.`;

    return (
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
                    {litIds ? `de ${seats.length} deputados` : "deputados"}
                </text>
            </svg>
            <div ref={tooltipRef} className={styles.tooltip} hidden={!hoveredSeat} aria-hidden="true">
                {hoveredSeat && (
                    <>
                        <strong className={styles.tooltipName}>{hoveredSeat.politicalName}</strong>
                        <span>
                            {partyLabel(hoveredSeat.partyAcronym ?? NO_PARTY_ACRONYM)} · {hoveredSeat.stateCode}
                        </span>
                        <span>{VOTE_CHOICE_WORDS[hoveredSeat.choice] ?? hoveredSeat.choice}</span>
                    </>
                )}
            </div>
        </figure>
    );
}

// the drawing while it loads, with the proportions of the seats
export function VoteHemicycleSkeleton() {
    return <SkeletonArea ratio={`${HEMICYCLE_WIDTH} / ${HEMICYCLE_HEIGHT}`} />;
}