"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import type { VoteSeat } from "@polar/db";
import { NO_PARTY_ACRONYM, partyLabel } from "@/components/Hemicycle/chamberParties";
import { BRAZILIAN_REGIONS, BRAZILIAN_STATES, ofState, stateName } from "@/components/DeputySearch/brazilianStates";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import { ListboxSelect, type ListboxOption } from "@/components/ListboxSelect/ListboxSelect";
import { NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { VoteBadge } from "@/components/VoteBadge/VoteBadge";
import { VoteHemicycle } from "@/components/VoteHemicycle/VoteHemicycle";
import { deputyVoteHref } from "./deputyVoteHref";
import { choiceFromSlug, choiceVerb, VOTE_CHOICE_ORDER, VOTE_CHOICE_SLUGS, VOTE_CHOICE_WORDS } from "./voteChoices";
import styles from "./VoterList.module.scss";

const LIST_HINT_MIN_ROWS = 8;
const VOTER_FILTERS_CHANGE_EVENT = "voter-filters-change";

interface VoterFilters {
    stateCode: string;
    partyAcronym: string;
    choice: string;
    // deputy singled out by ?deputado=, for links from other pages
    deputyId: number | null;
}

// filters live in the url (?estado=, ?partido=, ?voto=) so a filtered list can be shared
function parseFilters(search: string): VoterFilters {
    const params = new URLSearchParams(search);
    const stateCode = (params.get("estado") ?? "").toUpperCase();
    const deputyText = params.get("deputado");
    return {
        stateCode: stateCode in BRAZILIAN_STATES ? stateCode : "",
        partyAcronym: params.get("partido") ?? "",
        choice: choiceFromSlug(params.get("voto")),
        deputyId: deputyText && /^[1-9]\d{0,9}$/.test(deputyText) ? Number(deputyText) : null,
    };
}

function writeFilters(filters: VoterFilters) {
    const params = new URLSearchParams();
    if (filters.stateCode) params.set("estado", filters.stateCode);
    if (filters.partyAcronym) params.set("partido", filters.partyAcronym);
    if (filters.choice) params.set("voto", VOTE_CHOICE_SLUGS[filters.choice] ?? "");
    if (filters.deputyId !== null) params.set("deputado", String(filters.deputyId));
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    window.dispatchEvent(new Event(VOTER_FILTERS_CHANGE_EVENT));
}

function subscribeToUrl(onChange: () => void): () => void {
    window.addEventListener("popstate", onChange);
    window.addEventListener(VOTER_FILTERS_CHANGE_EVENT, onChange);
    return () => {
        window.removeEventListener("popstate", onChange);
        window.removeEventListener(VOTER_FILTERS_CHANGE_EVENT, onChange);
    };
}

function deputiesWord(count: number): string {
    return count === 1 ? "deputado" : "deputados";
}

interface VoterListProps {
    seats: readonly VoteSeat[];
    partyOrder: readonly string[];
    // the vote of the seats: each deputy opens already focused on this vote
    voteId: string;
    occurredAt: Date;
}

// the hemicycle, its legend, the filters and the list of voters share one set of filters, so a filter lights the seats
// that match and dims the others
export function VoterList({ seats, partyOrder, voteId, occurredAt }: Readonly<VoterListProps>) {
    // the page is prerendered without query string (server snapshot), the url filters apply after hydration
    const search = useSyncExternalStore(
        subscribeToUrl,
        () => window.location.search,
        () => "",
    );
    const filters = useMemo(() => parseFilters(search), [search]);

    const countsByChoice = useMemo(() => {
        const counts = new Map<string, number>();
        for (const seat of seats) {
            counts.set(seat.choice, (counts.get(seat.choice) ?? 0) + 1);
        }
        return counts;
    }, [seats]);
    const countsByParty = useMemo(() => {
        const counts = new Map<string, number>();
        for (const seat of seats) {
            const acronym = seat.partyAcronym ?? NO_PARTY_ACRONYM;
            counts.set(acronym, (counts.get(acronym) ?? 0) + 1);
        }
        return counts;
    }, [seats]);
    const countsByState = useMemo(() => {
        const counts = new Map<string, number>();
        for (const seat of seats) {
            counts.set(seat.stateCode, (counts.get(seat.stateCode) ?? 0) + 1);
        }
        return counts;
    }, [seats]);

    const hasFilters = filters.stateCode !== "" || filters.partyAcronym !== "" || filters.choice !== "";
    const matching = useMemo(
        () =>
            seats
                .filter(
                    (seat) =>
                        (!filters.stateCode || seat.stateCode === filters.stateCode) &&
                        (!filters.partyAcronym || (seat.partyAcronym ?? NO_PARTY_ACRONYM) === filters.partyAcronym) &&
                        (!filters.choice || seat.choice === filters.choice),
                )
                .sort((first, second) => first.politicalName.localeCompare(second.politicalName, "pt-BR")),
        [seats, filters.stateCode, filters.partyAcronym, filters.choice],
    );
    const litIds = useMemo(() => (hasFilters ? new Set(matching.map((seat) => seat.deputyId)) : null), [hasFilters, matching]);
    const focusedSeat = filters.deputyId === null ? null : (seats.find((seat) => seat.deputyId === filters.deputyId) ?? null);

    function updateFilters(changes: Partial<VoterFilters>) {
        writeFilters({ ...filters, ...changes });
    }

    const partyOptions: ListboxOption[] = [
        { value: "", text: "Todos os partidos", content: "Todos os partidos" },
        ...[...countsByParty.entries()]
            .sort(([first], [second]) => first.localeCompare(second, "pt-BR"))
            .map(([acronym, count]) => ({
                value: acronym,
                text: partyLabel(acronym),
                content: (
                    <>
                        <PartyBadge acronym={acronym} />
                        <span className={styles.optionCount}>
                            {count} {deputiesWord(count)}
                        </span>
                    </>
                ),
            })),
    ];
    const stateOptions: ListboxOption[] = [
        { value: "", text: "Todos os estados", content: "Todos os estados" },
        ...BRAZILIAN_REGIONS.flatMap((region) =>
            region.stateCodes.map((code) => ({
                value: code,
                text: stateName(code),
                group: region.name,
                content: (
                    <>
                        <span className={styles.stateCode}>{code}</span>
                        <span className={styles.optionName}>{stateName(code)}</span>
                        <span className={styles.optionCount}>{countsByState.get(code) ?? 0}</span>
                    </>
                ),
            })),
        ),
    ];
    const choices = VOTE_CHOICE_ORDER.filter((choice) => (countsByChoice.get(choice) ?? 0) > 0);
    const choiceOptions: ListboxOption[] = [
        { value: "", text: "Todos os votos", content: "Todos os votos" },
        ...choices.map((choice) => ({
            value: choice,
            text: VOTE_CHOICE_WORDS[choice] ?? choice,
            content: (
                <>
                    <VoteBadge choice={choice} size="small" />
                    <span className={styles.optionCount}>{countsByChoice.get(choice)}</span>
                </>
            ),
        })),
    ];

    const who = [
        filters.stateCode ? ofState(filters.stateCode) : "",
        filters.partyAcronym ? `do ${partyLabel(filters.partyAcronym)}` : "",
    ]
        .filter(Boolean)
        .join(", ");
    const summary = `${matching.length} ${deputiesWord(matching.length)}${who ? ` ${who}` : ""}${filters.choice ? `: ${choiceVerb(filters.choice, matching.length)}` : ""}.`;

    return (
        <div className={styles.voters}>
            <VoteHemicycle seats={seats} partyOrder={partyOrder} litIds={litIds} focusedId={focusedSeat?.deputyId ?? null} voteId={voteId} occurredAt={occurredAt} />

            <ul className={styles.legend} aria-label="Votos, para filtrar a lista e o desenho">
                {choices.map((choice) => (
                    <li key={choice}>
                        <button
                            type="button"
                            className={styles.legendButton}
                            aria-pressed={filters.choice === choice}
                            onClick={() => updateFilters({ choice: filters.choice === choice ? "" : choice })}
                        >
                            <VoteBadge choice={choice} size="fill" />
                            <span className={styles.legendCount}>{countsByChoice.get(choice)}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <p className={styles.hint}>
                As cadeiras seguem a ordem dos partidos do hemiciclo de Deputados. A cadeira vazia, com borda tracejada, é de quem estava no cargo e
                não votou. Toque num voto acima para acender só essas cadeiras.
            </p>

            {focusedSeat && (
                <div className={styles.focus}>
                    <p>
                        <strong>{focusedSeat.politicalName}</strong> ({partyLabel(focusedSeat.partyAcronym ?? NO_PARTY_ACRONYM)}, {focusedSeat.stateCode})
                    </p>
                    <VoteBadge choice={focusedSeat.choice} />
                </div>
            )}

            <div className={styles.filters}>
                <ListboxSelect
                    id="voter-state-filter"
                    label="Estado"
                    value={filters.stateCode}
                    options={stateOptions}
                    onChange={(stateCode) => updateFilters({ stateCode })}
                />
                <ListboxSelect
                    id="voter-party-filter"
                    label="Partido"
                    value={filters.partyAcronym}
                    options={partyOptions}
                    onChange={(partyAcronym) => updateFilters({ partyAcronym })}
                />
                <ListboxSelect
                    id="voter-choice-filter"
                    label="Voto"
                    value={filters.choice}
                    options={choiceOptions}
                    onChange={(choice) => updateFilters({ choice })}
                />
            </div>

            <div className={styles.status}>
                <p aria-live="polite">{summary}</p>
                {hasFilters && (
                    <button type="button" className={styles.clear} onClick={() => updateFilters({ stateCode: "", partyAcronym: "", choice: "" })}>
                        Limpar filtros
                    </button>
                )}
            </div>

            {matching.length === 0 ? (
                <p className={styles.empty}>Nenhum deputado com esses filtros.</p>
            ) : (
                <>
                    <ScrollSlider direction="vertical" className={styles.scroll} tabIndex={0} role="region" aria-label="Deputados e votos">
                        <ul className={styles.rows}>
                            {matching.map((seat) => (
                                <li key={seat.deputyId} className={seat.deputyId === filters.deputyId ? styles.current : undefined}>
                                    <Link className={styles.row} href={deputyVoteHref(seat.deputyId, voteId, occurredAt)} transitionTypes={NAV_FORWARD}>
                                        <span className={styles.name}>{seat.politicalName}</span>
                                        <VoteBadge choice={seat.choice} size="small" />
                                        <span className={styles.tags}>
                                            <PartyBadge acronym={seat.partyAcronym} />
                                            <span className={styles.state}>{seat.stateCode}</span>
                                        </span>
                                        <LinkPending />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </ScrollSlider>
                    {matching.length >= LIST_HINT_MIN_ROWS && <p className={styles.hint}>Role a lista para ver todos os nomes.</p>}
                </>
            )}
        </div>
    );
}