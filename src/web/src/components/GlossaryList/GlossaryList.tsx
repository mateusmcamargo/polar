import type { GlossaryEntry } from "@polar/db/glossary";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import styles from "./GlossaryList.module.scss";

export interface GlossaryLetterGroup {
    letter: string;
    entries: GlossaryEntry[];
}

export function withoutAccents(text: string): string {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function groupByLetter(entries: readonly GlossaryEntry[]): GlossaryLetterGroup[] {
    const groups = new Map<string, GlossaryEntry[]>();
    for (const entry of entries) {
        const letter = withoutAccents(entry.term).charAt(0).toUpperCase();
        groups.set(letter, [...(groups.get(letter) ?? []), entry]);
    }
    return [...groups.entries()].map(([letter, letterEntries]) => ({ letter, entries: letterEntries }));
}

interface GlossaryListProps {
    groups: readonly GlossaryLetterGroup[];
    // keeps ids unique when the page and the panel are on screen together
    idPrefix: string;
    termNames: Readonly<Record<string, string>>;
    currentId?: string | null;
    seeAlsoHref: (id: string) => string;
    // heading level of the letters: h2 under the page h1, h3 under the panel title (h2)
    letterHeading?: "h2" | "h3";
}

// the dictionary itself, shared by the /glossario page and the panel; no state, so it renders on the server too
export function GlossaryList({ groups, idPrefix, termNames, currentId = null, seeAlsoHref, letterHeading: LetterHeading = "h3" }: Readonly<GlossaryListProps>) {
    return (
        <div className={styles.list}>
            {groups.map((group) => (
                <section key={group.letter} aria-labelledby={`${idPrefix}letra-${group.letter}`}>
                    <LetterHeading id={`${idPrefix}letra-${group.letter}`} className={styles.letter}>
                        {group.letter}
                    </LetterHeading>
                    <dl className={styles.entries}>
                        {group.entries.map((entry) => (
                            <div
                                key={entry.id}
                                id={`${idPrefix}termo-${entry.id}`}
                                className={entry.id === currentId ? `${styles.entry} ${styles.current}` : styles.entry}
                                tabIndex={-1}
                            >
                                {entry.id === currentId && (
                                    <p className={styles.flag}>
                                        <span className={styles.onTouch}>Você tocou aqui</span>
                                        <span className={styles.onPointer}>Você clicou aqui</span>
                                    </p>
                                )}
                                <dt className={styles.term}>
                                    {entry.term}
                                    {entry.alsoKnownAs && <span className={styles.alias}> {entry.alsoKnownAs}</span>}
                                </dt>
                                <dd className={styles.body}>
                                    <p>{entry.definition}</p>
                                    {entry.example && <p className={styles.example}>Exemplo: {entry.example}</p>}
                                    {entry.seeAlso && entry.seeAlso.length > 0 && (
                                        <p className={styles.seeAlso}>
                                            Veja também:{" "}
                                            {entry.seeAlso.map((id, index) => (
                                                <span key={id}>
                                                    {index > 0 && ", "}
                                                    <a href={seeAlsoHref(id)} data-glossary-term={id}>
                                                        {termNames[id] ?? id}
                                                    </a>
                                                </span>
                                            ))}
                                        </p>
                                    )}
                                    <EditorialSources sources={entry.sources} />
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ))}
        </div>
    );
}