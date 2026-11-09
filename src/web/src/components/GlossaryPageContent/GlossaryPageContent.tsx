"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GLOSSARY } from "@polar/db/glossary";
import { groupByLetter, groupVoteTerms, GlossaryList } from "@/components/GlossaryList/GlossaryList";
import { glossaryEntryAnchor } from "@/components/GlossaryText/GlossaryText";
import { VoteTermsToggle } from "@/components/VoteTermsToggle/VoteTermsToggle";
import styles from "./GlossaryPageContent.module.scss";

const TERM_NAMES: Readonly<Record<string, string>> = Object.fromEntries(GLOSSARY.map((entry) => [entry.id, entry.term]));
const LETTER_GROUPS = groupByLetter(GLOSSARY);
const VOTE_GROUPS = groupVoteTerms(GLOSSARY);

// letters, the "Votações" shortcut and the list of the /glossario page. Rendered on the server with the whole list, so without
// JavaScript the letters and the "Veja também" links still work and only the shortcut does nothing
export function GlossaryPageContent() {
    const [votesOnly, setVotesOnly] = useState(false);
    const pendingAnchor = useRef<string | null>(null);
    const groups = useMemo(() => (votesOnly ? VOTE_GROUPS : LETTER_GROUPS), [votesOnly]);

    // a link to a term the shortcut is hiding ("Veja também", or a letter) turns the shortcut off and then moves to the term
    useEffect(() => {
        function showTargetOfHash() {
            const anchor = decodeURIComponent(window.location.hash.slice(1));
            if (anchor && !document.getElementById(anchor)) {
                pendingAnchor.current = anchor;
                setVotesOnly(false);
            }
        }
        window.addEventListener("hashchange", showTargetOfHash);
        return () => window.removeEventListener("hashchange", showTargetOfHash);
    }, []);

    useEffect(() => {
        if (pendingAnchor.current) {
            document.getElementById(pendingAnchor.current)?.scrollIntoView();
            pendingAnchor.current = null;
        }
    }, [votesOnly]);

    return (
        <>
            <nav className={styles.shortcuts} aria-label="Atalhos do dicionário">
                <VoteTermsToggle isOn={votesOnly} onToggle={() => setVotesOnly((isOn) => !isOn)} />
                {!votesOnly &&
                    groups.map((group) => (
                        <a key={group.letter} href={`#letra-${group.letter}`}>
                            {group.letter}
                        </a>
                    ))}
            </nav>
            <GlossaryList groups={groups} idPrefix="" termNames={TERM_NAMES} seeAlsoHref={(id) => `#${glossaryEntryAnchor(id)}`} letterHeading="h2" />
        </>
    );
}