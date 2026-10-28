"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import type { DeputySearchEntry } from "@polar/db";
import { PARTY_COLORS } from "@polar/db/party-colors";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { StateMap } from "@/components/StateMap/StateMap";
import { BRAZILIAN_REGIONS, BRAZILIAN_STATES, FEDERAL_DISTRICT_CODE, inState, ofState, stateName } from "./brazilianStates";
import { matchesOnlyCivilName, normalizeSearchText, searchByName, splitSearchTokens } from "./searchDeputies";
import styles from "./DeputySearch.module.scss";

const SEATS_IN_CHAMBER = 513;
const NO_PARTY_ACRONYM = "S.PART.";
const LIST_HINT_MIN_ROWS = 8;

interface Filters {
    name: string;
    stateCode: string;
    partyAcronym: string;
    onlyInOffice: boolean;
}

const FILTERS_CHANGE_EVENT = "deputy-filters-change";

// filters live in the url (?nome=, ?estado=, ?partido=, ?todos=1) so a search can be shared or bookmarked
function parseFilters(search: string): Filters {
    const params = new URLSearchParams(search);
    const stateCode = (params.get("estado") ?? "").toUpperCase();
    return {
        name: params.get("nome") ?? "",
        stateCode: stateCode in BRAZILIAN_STATES ? stateCode : "",
        partyAcronym: params.get("partido") ?? "",
        onlyInOffice: params.get("todos") !== "1",
    };
}

function writeFiltersToUrl(filters: Filters) {
    const params = new URLSearchParams();
    // the name keeps its spaces while the user types a second word
    if (filters.name.trim()) params.set("nome", filters.name);
    if (filters.stateCode) params.set("estado", filters.stateCode);
    if (filters.partyAcronym) params.set("partido", filters.partyAcronym);
    if (!filters.onlyInOffice) params.set("todos", "1");
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

function partyLabel(acronym: string): string {
    return acronym === NO_PARTY_ACRONYM ? "Sem partido" : acronym;
}

function deputiesWord(count: number): string {
    return count === 1 ? "deputado" : "deputados";
}

// "de 12 estados e do Distrito Federal", because the distrito federal is not a state
function placesText(countsByState: Record<string, number>): string {
    const statesWithDeputies = Object.entries(countsByState).filter(([code, count]) => count > 0 && code !== FEDERAL_DISTRICT_CODE).length;
    if (statesWithDeputies + ((countsByState[FEDERAL_DISTRICT_CODE] ?? 0) > 0 ? 1 : 0) === Object.keys(BRAZILIAN_STATES).length) {
        return "de todo o Brasil";
    }
    const parts: string[] = [];
    if (statesWithDeputies > 0) parts.push(`${statesWithDeputies} ${statesWithDeputies === 1 ? "estado" : "estados"}`);
    if ((countsByState[FEDERAL_DISTRICT_CODE] ?? 0) > 0) parts.push("do Distrito Federal");
    return parts.length > 0 ? `de ${parts.join(" e ")}` : "";
}

const NAME_PARTICLES = new Set(["da", "das", "de", "do", "dos", "e"]);

// the source publishes civil names in capitals, which is harder to read
function readableName(name: string): string {
    return name
        .toLocaleLowerCase("pt-BR")
        .split(" ")
        .map((word, index) => (index > 0 && NAME_PARTICLES.has(word) ? word : word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1)))
        .join(" ");
}

function initials(name: string): string {
    const words = name.split(" ").filter((word) => word.length > 2);
    const first = words[0] ?? name;
    const last = words.length > 1 ? words[words.length - 1] : "";
    return `${first[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

// underlines the start of each name word that matches a typed word
function HighlightedName({ name, tokens }: Readonly<{ name: string; tokens: string[] }>) {
    const characters = [...name];
    const plain = characters.map((character) => normalizeSearchText(character) || " ").join("");
    if (tokens.length === 0 || plain.length !== characters.length) {
        return <>{name}</>;
    }
    const marked = characters.map(() => false);
    for (const token of tokens) {
        let index = plain.indexOf(token);
        while (index !== -1) {
            if (index === 0 || plain[index - 1] === " ") {
                for (let offset = index; offset < index + token.length; offset++) marked[offset] = true;
            }
            index = plain.indexOf(token, index + 1);
        }
    }
    const pieces: ReactNode[] = [];
    let start = 0;
    for (let index = 1; index <= characters.length; index++) {
        if (index === characters.length || marked[index] !== marked[start]) {
            const text = characters.slice(start, index).join("");
            pieces.push(marked[start] ? <mark key={start}>{text}</mark> : text);
            start = index;
        }
    }
    return <>{pieces}</>;
}

interface DeputySearchProps {
    deputies: DeputySearchEntry[];
    sourceNote: ReactNode;
}

export function DeputySearch({ deputies, sourceNote }: Readonly<DeputySearchProps>) {
    // the page is prerendered without query string (server snapshot), the url filters apply after hydration
    const search = useSyncExternalStore(subscribeToUrl, () => window.location.search, () => "");
    const filters = useMemo(() => parseFilters(search), [search]);

    function updateFilters(changes: Partial<Filters>) {
        writeFiltersToUrl({ ...filters, ...changes });
    }

    const officePool = useMemo(
        () => deputies.filter((deputy) => !filters.onlyInOffice || deputy.isInOffice),
        [deputies, filters.onlyInOffice],
    );
    const partyPool = useMemo(
        () => officePool.filter((deputy) => !filters.partyAcronym || deputy.partyAcronym === filters.partyAcronym),
        [officePool, filters.partyAcronym],
    );

    const countsByState = useMemo(() => {
        const counts: Record<string, number> = Object.fromEntries(Object.keys(BRAZILIAN_STATES).map((code) => [code, 0]));
        for (const deputy of partyPool) {
            counts[deputy.stateCode] = (counts[deputy.stateCode] ?? 0) + 1;
        }
        return counts;
    }, [partyPool]);

    const partyOptions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const deputy of officePool) {
            if (!filters.stateCode || deputy.stateCode === filters.stateCode) {
                const acronym = deputy.partyAcronym ?? NO_PARTY_ACRONYM;
                counts.set(acronym, (counts.get(acronym) ?? 0) + 1);
            }
        }
        if (filters.partyAcronym && !counts.has(filters.partyAcronym)) {
            counts.set(filters.partyAcronym, 0);
        }
        return [...counts.entries()].sort(([first], [second]) => partyLabel(first).localeCompare(partyLabel(second), "pt-BR"));
    }, [officePool, filters.stateCode, filters.partyAcronym]);

    const statePool = filters.stateCode ? partyPool.filter((deputy) => deputy.stateCode === filters.stateCode) : partyPool;
    const { deputies: results, isSimilarMatch } = searchByName(statePool, filters.name);
    const searchTokens = splitSearchTokens(filters.name);
    // similar matches do not contain the typed words, so nothing is underlined
    const tokens = isSimilarMatch ? [] : searchTokens;
    const partyText = filters.partyAcronym ? ` do ${partyLabel(filters.partyAcronym)}` : "";
    const selectedCount = filters.stateCode ? (countsByState[filters.stateCode] ?? 0) : partyPool.length;

    let emptyAction: { label: string; changes: Partial<Filters> } | null = null;
    if (filters.stateCode) {
        emptyAction = { label: "Procurar em todos os estados", changes: { stateCode: "" } };
    } else if (filters.partyAcronym) {
        emptyAction = { label: "Procurar em todos os partidos", changes: { partyAcronym: "" } };
    } else if (filters.onlyInOffice) {
        emptyAction = { label: "Incluir quem saiu do cargo", changes: { onlyInOffice: false } };
    }
    const where = filters.stateCode ? ` ${inState(filters.stateCode)}` : "";

    return (
        <>
            <div className={styles.search} role="search">
                <label htmlFor="deputy-name" className={styles.searchLabel}>
                    Buscar pelo nome
                </label>
                <div className={styles.searchBox}>
                    <Search className={styles.searchIcon} aria-hidden="true" />
                    <input
                        id="deputy-name"
                        className={styles.searchInput}
                        type="search"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Exemplo: Maria, Silva, Joao"
                        value={filters.name}
                        onChange={(event) => updateFilters({ name: event.target.value })}
                    />
                    {filters.name && (
                        <button type="button" className={styles.clearButton} aria-label="Apagar o nome digitado" onClick={() => updateFilters({ name: "" })}>
                            <X aria-hidden="true" />
                        </button>
                    )}
                </div>
                <p className={styles.searchHint}>Pode digitar sem acento ou só parte do nome.</p>
            </div>

            <div className={styles.layout}>
                <section className={styles.places} aria-labelledby="places-title">
                    <div className={styles.blockLabel}>
                        <h2 id="places-title" className={styles.blockTitle}>
                            Estados
                        </h2>
                        <span className={styles.blockCount}>{filters.stateCode ? <strong>{stateName(filters.stateCode)}</strong> : "Todos"}</span>
                    </div>

                    <div className={styles.mapArea}>
                        <StateMap
                            countsByState={countsByState}
                            selectedStateCode={filters.stateCode}
                            legendTitle={`Número de deputados${partyText} em cada estado`}
                            scaleColor={PARTY_COLORS[filters.partyAcronym]?.color}
                            onSelectState={(code) => updateFilters({ stateCode: filters.stateCode === code ? "" : code })}
                        />
                    </div>

                    <div className={styles.figure} aria-live="polite">
                        <span className={styles.figureNumber}>{selectedCount.toLocaleString("pt-BR")}</span>
                        <span className={styles.figureText}>
                            {deputiesWord(selectedCount)}
                            {partyText} {filters.stateCode ? ofState(filters.stateCode) : placesText(countsByState)}
                        </span>
                        {!filters.partyAcronym && (
                            <p className={styles.figureNote}>
                                {filters.stateCode &&
                                    filters.onlyInOffice &&
                                    `${((selectedCount / SEATS_IN_CHAMBER) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% das ${SEATS_IN_CHAMBER} vagas. `}
                                Cada estado tem de 8 a 70 vagas, conforme o tamanho da população.
                            </p>
                        )}
                    </div>

                    <div className={styles.picker}>
                        <p className={styles.pickerTitle}>Toque no seu estado</p>
                        <div className={styles.regions}>
                            {BRAZILIAN_REGIONS.map((region) => (
                                <div key={region.name} className={styles.region} role="group" aria-labelledby={`region-${region.name}`}>
                                    <h3 id={`region-${region.name}`} className={styles.regionName}>
                                        {region.name}
                                    </h3>
                                    <div className={styles.stateButtons}>
                                        {region.stateCodes.map((code) => (
                                            <button
                                                key={code}
                                                type="button"
                                                className={styles.stateButton}
                                                aria-pressed={filters.stateCode === code}
                                                aria-label={stateName(code)}
                                                title={stateName(code)}
                                                onClick={() => updateFilters({ stateCode: filters.stateCode === code ? "" : code })}
                                            >
                                                {code}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className={styles.results} aria-labelledby="results-title">
                    <div className={styles.blockLabel}>
                        <h2 id="results-title" className={styles.blockTitle}>
                            Deputados
                        </h2>
                        <span className={styles.blockCount} aria-live="polite">
                            <strong>{results.length.toLocaleString("pt-BR")}</strong> de {partyPool.length.toLocaleString("pt-BR")}
                        </span>
                    </div>

                    <div className={styles.filters}>
                        <div className={styles.field}>
                            <label htmlFor="party-filter" className={styles.fieldLabel}>
                                Partido
                            </label>
                            <div className={styles.selectBox}>
                                <select
                                    id="party-filter"
                                    className={styles.select}
                                    value={filters.partyAcronym}
                                    onChange={(event) => updateFilters({ partyAcronym: event.target.value })}
                                >
                                    <option value="">Todos os partidos</option>
                                    {partyOptions.map(([acronym, count]) => (
                                        <option key={acronym} value={acronym}>
                                            {partyLabel(acronym)} ({count})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className={styles.selectIcon} aria-hidden="true" />
                            </div>
                        </div>
                        <label htmlFor="only-in-office" className={styles.check}>
                            <input
                                id="only-in-office"
                                type="checkbox"
                                checked={filters.onlyInOffice}
                                onChange={(event) => updateFilters({ onlyInOffice: event.target.checked })}
                            />
                            Só quem está no cargo agora
                        </label>
                    </div>

                    {(filters.stateCode || filters.partyAcronym) && (
                        <div className={styles.activeFilters}>
                            {filters.stateCode && (
                                <button
                                    type="button"
                                    className={styles.chip}
                                    aria-label={`Tirar o filtro de estado ${stateName(filters.stateCode)}`}
                                    onClick={() => updateFilters({ stateCode: "" })}
                                >
                                    {stateName(filters.stateCode)}
                                    <X aria-hidden="true" />
                                </button>
                            )}
                            {filters.partyAcronym && (
                                <button
                                    type="button"
                                    className={styles.chip}
                                    aria-label={`Tirar o filtro de partido ${partyLabel(filters.partyAcronym)}`}
                                    onClick={() => updateFilters({ partyAcronym: "" })}
                                >
                                    {partyLabel(filters.partyAcronym)}
                                    <X aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    )}

                    {isSimilarMatch && results.length > 0 && (
                        <p className={styles.similarNote}>Nenhum nome igual a “{filters.name.trim()}”. Estes são os mais parecidos:</p>
                    )}

                    {results.length > 0 ? (
                        <>
                            {/* own scroll with a max height, the page keeps scrolling outside the list */}
                            <div className={styles.listScroll} tabIndex={0} role="region" aria-label="Lista de deputados">
                                <ul className={styles.list}>
                                    {results.map((deputy) => (
                                        <li key={deputy.id} className={styles.item}>
                                            <Link href={`/deputados/${deputy.id}`} className={styles.deputy}>
                                                <span className={styles.avatar} aria-hidden="true">
                                                    {deputy.photoUrl ? (
                                                        <Image src={deputy.photoUrl} alt="" fill sizes="56px" className={styles.photo} />
                                                    ) : (
                                                        initials(deputy.politicalName)
                                                    )}
                                                </span>
                                                <span className={styles.who}>
                                                    <span className={styles.name}>
                                                        <HighlightedName name={deputy.politicalName} tokens={tokens} />
                                                    </span>
                                                    {deputy.civilName && searchTokens.length > 0 && matchesOnlyCivilName(deputy, searchTokens) && (
                                                        <span className={styles.civilName}>
                                                            Nome de registro: <HighlightedName name={readableName(deputy.civilName)} tokens={tokens} />
                                                        </span>
                                                    )}
                                                    <span className={styles.meta}>
                                                        <PartyBadge acronym={deputy.partyAcronym} />
                                                        <span>{stateName(deputy.stateCode)}</span>
                                                        {!deputy.isInOffice && <span className={styles.status}>Fora do cargo</span>}
                                                    </span>
                                                </span>
                                                <ChevronRight className={styles.chevron} aria-hidden="true" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {results.length >= LIST_HINT_MIN_ROWS && <p className={styles.listHint}>Role a lista para ver todos os nomes.</p>}
                        </>
                    ) : (
                        <div className={styles.emptyField}>
                            <div className={styles.empty}>
                                <p className={styles.emptyLabel}>
                                    <strong>Ninguém encontrado</strong>
                                </p>
                                <p>
                                    {filters.name.trim()
                                        ? `Não achamos “${filters.name.trim()}”${partyText}${where}. Confira se o nome está certo.`
                                        : `Não há deputados${partyText}${where} com esses filtros.`}
                                </p>
                                {emptyAction && (
                                    <button type="button" className={styles.sticker} onClick={() => updateFilters(emptyAction.changes)}>
                                        {emptyAction.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {sourceNote}
                </section>
            </div>
        </>
    );
}