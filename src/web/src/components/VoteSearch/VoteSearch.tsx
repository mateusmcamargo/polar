"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Search, X } from "lucide-react";
import type { PlenaryVoteGroup, PlenaryVoteGroupList } from "@polar/db";
import { normalizeSearchText, splitSearchTokens } from "@/components/DeputySearch/searchDeputies";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import { ListboxSelect, type ListboxOption } from "@/components/ListboxSelect/ListboxSelect";
import { classifyVote } from "@/components/RecentVotes/voteKinds";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import { VoteGroupList } from "@/components/VoteGroupList/VoteGroupList";
import { useDataEnabled } from "@/components/DebugDataToggle/debugData";
import styles from "./VoteSearch.module.scss";

// proposals shown at a time: the list is the whole page, so it grows with the page instead of scrolling inside a box
const PAGE_SIZE = 20;
const FILTERS_CHANGE_EVENT = "vote-filters-change";
const TIME_ZONE = "America/Sao_Paulo";
const RESULT_VALUES = ["aprovado", "rejeitado"] as const;

interface Filters {
    year: string;
    type: string;
    result: string;
    // "sim" keeps only the propositions with a plain language summary
    summary: string;
    text: string;
}

function parseFilters(search: string): Filters {
    const params = new URLSearchParams(search);
    const year = params.get("ano") ?? "";
    const result = params.get("resultado") ?? "";
    return {
        year: /^\d{4}$/.test(year) ? year : "",
        type: /^[A-Za-z]{1,10}$/.test(params.get("tipo") ?? "") ? (params.get("tipo") ?? "").toUpperCase() : "",
        result: (RESULT_VALUES as readonly string[]).includes(result) ? result : "",
        summary: params.get("resumo") === "sim" ? "sim" : "",
        text: params.get("busca") ?? "",
    };
}

function writeFilters(filters: Filters) {
    const params = new URLSearchParams();
    if (filters.year) params.set("ano", filters.year);
    if (filters.type) params.set("tipo", filters.type);
    if (filters.result) params.set("resultado", filters.result);
    if (filters.summary) params.set("resumo", filters.summary);
    // the text keeps its spaces while the user types a second word
    if (filters.text.trim()) params.set("busca", filters.text);
    const query = params.toString();
    window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
    window.dispatchEvent(new Event(FILTERS_CHANGE_EVENT));
}

function subscribeToUrl(onChange: () => void): () => void {
    window.addEventListener("popstate", onChange);
    window.addEventListener(FILTERS_CHANGE_EVENT, onChange);
    return () => {
        window.removeEventListener("popstate", onChange);
        window.removeEventListener(FILTERS_CHANGE_EVENT, onChange);
    };
}

const yearFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric" });

// a proposition has one row with all its votes, so it stays in a year when any of its votes was cast in that year
function hasVoteInYear(group: PlenaryVoteGroup, year: string): boolean {
    return group.votes.some((vote) => yearFormat.format(vote.occurredAt) === year);
}

// the result of a group is the one of its main text vote, or of its latest vote when it has none
function approvedOfGroup(group: PlenaryVoteGroup): boolean | null {
    const main = group.votes.find((vote) => classifyVote(vote.description, vote.approved).isMainText) ?? group.votes[0];
    return main?.approved ?? null;
}

function searchableText(group: PlenaryVoteGroup): string {
    const proposition = group.proposition;
    return proposition ? normalizeSearchText(`${proposition.typeCode} ${proposition.number}/${proposition.year} ${proposition.summary}`) : "";
}

// every typed word must start a word of the type, number, year or official summary
function matchesText(group: PlenaryVoteGroup, tokens: string[]): boolean {
    const text = ` ${searchableText(group)}`;
    return tokens.every((token) => text.includes(` ${token}`));
}

interface VoteSearchProps {
    data: PlenaryVoteGroupList;
    // propositions with a plain language summary, which get a badge
    summaryPropositionIds: readonly number[];
}

export function VoteSearch({ data, summaryPropositionIds }: Readonly<VoteSearchProps>) {
    // the page is prerendered without query string (server snapshot), the url filters apply after hydration
    const search = useSyncExternalStore(
        subscribeToUrl,
        () => window.location.search,
        () => "",
    );
    const filters = useMemo(() => parseFilters(search), [search]);
    const isDataEnabled = useDataEnabled();
    const filterKey = `${filters.year}|${filters.type}|${filters.result}|${filters.summary}|${filters.text}`;
    const [visible, setVisible] = useState({ filterKey, count: PAGE_SIZE });
    const visibleCount = visible.filterKey === filterKey ? visible.count : PAGE_SIZE;

    const types = useMemo(
        () => [...new Set(data.groups.flatMap((group) => (group.proposition ? [group.proposition.typeCode] : [])))].sort((first, second) => first.localeCompare(second)),
        [data.groups],
    );
    const tokens = splitSearchTokens(filters.text);
    const results = useMemo(
        () =>
            data.groups.filter(
                (group) =>
                    (!filters.year || hasVoteInYear(group, filters.year)) &&
                    (!filters.type || group.proposition?.typeCode === filters.type) &&
                    (!filters.result || approvedOfGroup(group) === (filters.result === "aprovado")) &&
                    (!filters.summary || (group.proposition !== null && summaryPropositionIds.includes(group.proposition.id))) &&
                    matchesText(group, tokens),
            ),
        [data.groups, filters.year, filters.type, filters.result, filters.summary, summaryPropositionIds, tokens],
    );
    const voteCount = results.reduce((sum, group) => sum + group.votes.length, 0);
    const hasFilters = filterKey !== "||||";

    function updateFilters(changes: Partial<Filters>) {
        writeFilters({ ...filters, ...changes });
    }

    const yearOptions: ListboxOption[] = [
        { value: "", text: "Todos os anos", content: "Todos os anos" },
        ...data.years.map((year) => ({ value: String(year), text: String(year), content: String(year) })),
    ];
    const typeOptions: ListboxOption[] = [
        { value: "", text: "Todos os tipos", content: "Todos os tipos" },
        ...types.map((type) => ({ value: type, text: type, content: type })),
    ];
    const resultOptions: ListboxOption[] = [
        { value: "", text: "Todos os resultados", content: "Todos os resultados" },
        { value: "aprovado", text: "Aprovadas", content: "Aprovadas" },
        { value: "rejeitado", text: "Rejeitadas", content: "Rejeitadas" },
    ];

    return (
        <div className={styles.search}>
            <div className={styles.searchField}>
                <label htmlFor="vote-text">Número ou palavras do resumo</label>
                <div className={styles.searchBox}>
                    <Search className={styles.searchIcon} aria-hidden="true" />
                    <input
                        id="vote-text"
                        className={styles.searchInput}
                        type="search"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Exemplo: 66/2023 ou aposentadoria"
                        value={filters.text}
                        onChange={(event) => updateFilters({ text: event.target.value })}
                    />
                    {filters.text && (
                        <button type="button" className={styles.clearText} aria-label="Apagar o que foi digitado" onClick={() => updateFilters({ text: "" })}>
                            <X aria-hidden="true" />
                        </button>
                    )}
                </div>
                <p className={styles.hint}>Pode digitar sem acento. O número vale com ou sem o ano.</p>
            </div>

            <div className={styles.filters}>
                <ListboxSelect id="vote-year-filter" label="Ano" value={filters.year} options={yearOptions} isLoading={!isDataEnabled} onChange={(year) => updateFilters({ year })} />
                <ListboxSelect id="vote-type-filter" label="Tipo de proposta" value={filters.type} options={typeOptions} isLoading={!isDataEnabled} onChange={(type) => updateFilters({ type })} />
                <ListboxSelect id="vote-result-filter" label="Resultado" value={filters.result} options={resultOptions} isLoading={!isDataEnabled} onChange={(result) => updateFilters({ result })} />
            </div>

            <Checkbox id="vote-summary-filter" checked={filters.summary === "sim"} onChange={(checked) => updateFilters({ summary: checked ? "sim" : "" })}>
                Só propostas com resumo fácil de ler
            </Checkbox>

            <div className={styles.status}>
                <p aria-live="polite">
                    <strong>{results.length}</strong> {results.length === 1 ? "proposta" : "propostas"}, com <strong>{voteCount}</strong>{" "}
                    {voteCount === 1 ? "votação" : "votações"}.
                </p>
                {hasFilters && (
                    <button type="button" className={styles.clear} onClick={() => writeFilters({ year: "", type: "", result: "", summary: "", text: "" })}>
                        Limpar filtros
                    </button>
                )}
            </div>

            {!isDataEnabled ? (
                <SkeletonRows count={5} hasMeta hasValue />
            ) : results.length > 0 ? (
                <>
                    <VoteGroupList groups={results.slice(0, visibleCount)} summaryPropositionIds={summaryPropositionIds} />
                    {visibleCount < results.length && (
                        <button
                            type="button"
                            className={styles.more}
                            onClick={() => setVisible({ filterKey, count: visibleCount + PAGE_SIZE })}
                        >
                            Ver mais {Math.min(PAGE_SIZE, results.length - visibleCount)} propostas
                        </button>
                    )}
                </>
            ) : (
                <div className={styles.emptyField}>
                    <div className={styles.empty}>
                        <p className={styles.emptyLabel}>
                            <strong>Nenhuma votação</strong>
                        </p>
                        <p>Não há votações nominais com esses filtros. Confira o número ou tente menos filtros.</p>
                        <button type="button" className={styles.sticker} onClick={() => writeFilters({ year: "", type: "", result: "", summary: "", text: "" })}>
                            Ver todas as votações
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}