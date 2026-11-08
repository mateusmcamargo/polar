"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { GLOSSARY } from "@polar/db/glossary";
import { groupByLetter, GlossaryList, withoutAccents } from "@/components/GlossaryList/GlossaryList";
import { GLOSSARY_PAGE_PATH, glossaryEntryAnchor } from "@/components/GlossaryText/GlossaryText";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import styles from "./GlossaryContent.module.scss";

const TERM_NAMES: Readonly<Record<string, string>> = Object.fromEntries(GLOSSARY.map((entry) => [entry.id, entry.term]));

interface GlossaryContentProps {
    // keeps ids unique, because the side panel and the header each render their own copy
    idPrefix: string;
    // term to show at the top; give the component a new key for every request, so the search clears and the list scrolls again
    currentId: string | null;
}

// search, letters and the list of the glossary, shared by the panel of computers and the header of phones. The parent gives it
// the free height
export function GlossaryContent({ idPrefix, currentId }: Readonly<GlossaryContentProps>) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");

    const groups = useMemo(() => {
        const normalizedQuery = withoutAccents(query.trim());
        const entries = normalizedQuery
            ? GLOSSARY.filter((entry) => withoutAccents(`${entry.term} ${entry.alsoKnownAs ?? ""} ${entry.definition}`).includes(normalizedQuery))
            : GLOSSARY;
        return groupByLetter(entries);
    }, [query]);

    // moves the list itself and nothing around it: the parent may be sliding open, and scrollIntoView would scroll it too
    function scrollListTo(element: HTMLElement | null) {
        const body = bodyRef.current;
        if (body && element) {
            body.scrollTop += element.getBoundingClientRect().top - body.getBoundingClientRect().top;
        }
    }

    // An entry stops below the sticky letter of its group, which would otherwise cover its top (the "Você clicou aqui" flag),
    // and keeps its own top margin, so the outline of the highlighted entry is not cut either
    function scrollListToEntry(entry: HTMLElement | null) {
        const body = bodyRef.current;
        if (body && entry) {
            const letter = entry.closest("section")?.querySelector<HTMLElement>(":scope > h2, :scope > h3");
            const coveredHeight = (letter?.getBoundingClientRect().height ?? 0) + Number.parseFloat(getComputedStyle(entry).marginTop || "0");
            body.scrollTop += entry.getBoundingClientRect().top - body.getBoundingClientRect().top - coveredHeight;
        }
    }

    // the parent mounts a fresh copy for every request, so this runs once per request
    useEffect(() => {
        if (!currentId) {
            return;
        }
        const entry = document.getElementById(`${idPrefix}${glossaryEntryAnchor(currentId)}`);
        scrollListToEntry(entry);
        entry?.focus({ preventScroll: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.content}>
            <div className={styles.head}>
                <label className={styles.search}>
                    <span className="visually-hidden">Procurar uma palavra</span>
                    <Search aria-hidden="true" />
                    <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Procurar uma palavra" autoComplete="off" />
                </label>
                {groups.length > 0 && (
                    <nav className={styles.letters} aria-label="Letras do dicionário">
                        {groups.map((group) => (
                            <button key={group.letter} type="button" onClick={() => scrollListTo(document.getElementById(`${idPrefix}letra-${group.letter}`))}>
                                {group.letter}
                            </button>
                        ))}
                    </nav>
                )}
            </div>
            <ScrollSlider direction="vertical" ref={bodyRef} className={styles.body} frameClassName={styles.bodyFrame}>
                {groups.length > 0 ? (
                    <GlossaryList
                        groups={groups}
                        idPrefix={idPrefix}
                        termNames={TERM_NAMES}
                        currentId={query ? null : currentId}
                        seeAlsoHref={(id) => `${GLOSSARY_PAGE_PATH}#${glossaryEntryAnchor(id)}`}
                    />
                ) : (
                    <p className={styles.empty}>Nenhuma palavra encontrada. Tente escrever de outro jeito.</p>
                )}
                <p className={styles.more}>
                    <a href={GLOSSARY_PAGE_PATH}>Abrir o dicionário completo numa página</a>
                </p>
            </ScrollSlider>
        </div>
    );
}