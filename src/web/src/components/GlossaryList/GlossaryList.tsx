import type { GlossaryEntry } from "@polar/db/glossary";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import { VoteBadge, voteChoiceLabel } from "@/components/VoteBadge/VoteBadge";
import styles from "./GlossaryList.module.scss";

export interface GlossaryLetterGroup {
    // first letter, or the id part of a group of vote terms; the key of the group and part of its anchor
    letter: string;
    // heading of a group that is not a letter
    title?: string;
    entries: GlossaryEntry[];
}

const VOTE_KIND_CAPTIONS: Readonly<Record<NonNullable<GlossaryEntry["voteKind"]>, string>> = {
    vote: "Tipo de voto",
    voting: "Tipo de votação",
    orientation: "Tipo de orientação",
};

const VOTE_GROUPS: readonly { kind: NonNullable<GlossaryEntry["voteKind"]>; letter: string; title: string }[] = [
    { kind: "vote", letter: "tipos-de-voto", title: "Tipos de voto" },
    { kind: "orientation", letter: "tipos-de-orientacao", title: "Tipos de orientação" },
    { kind: "voting", letter: "tipos-de-votacao", title: "Tipos de votação" },
];

// the terms about votes, one group per kind, for the "Votações" shortcut; a kind with no entry left (after a search) has no group
export function groupVoteTerms(entries: readonly GlossaryEntry[]): GlossaryLetterGroup[] {
    return VOTE_GROUPS.map(({ kind, letter, title }) => ({ letter, title, entries: entries.filter((entry) => entry.voteKind === kind) })).filter(
        (group) => group.entries.length > 0,
    );
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
                        {group.title ?? group.letter}
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
                                    {entry.voteKind && <span className={styles.kind}>{VOTE_KIND_CAPTIONS[entry.voteKind]}</span>}
                                    {entry.voteChoice ? (
                                        <>
                                            {/* the badge is the term; when its word differs from the term, the term follows it in text */}
                                            <VoteBadge choice={entry.voteChoice} />
                                            {voteChoiceLabel(entry.voteChoice) !== entry.term && <span className={styles.name}>{entry.term}</span>}
                                        </>
                                    ) : (
                                        entry.term
                                    )}
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