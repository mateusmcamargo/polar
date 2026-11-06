"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { GlossaryContent } from "@/components/GlossaryContent/GlossaryContent";
import { useHeader } from "@/components/SiteHeader/HeaderProvider";
import styles from "./GlossaryDialog.module.scss";

const PANEL_PREFIX = "painel-";
// the same width where the top navigation replaces the bottom one; below it the glossary opens inside the header
const PANEL_MEDIA_QUERY = "(min-width: 900px)";

function isPlainClick(event: MouseEvent): boolean {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

// side panel of the glossary on computers, mounted in the root layout: a click on any glossary term, or the glossary button of
// the header, asks the HeaderProvider to open it, and this panel answers from 900 px (on phones the header answers). Without
// JavaScript the term link opens the /glossario page
export function GlossaryDialog() {
    const { glossaryRequest, openGlossary } = useHeader();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const [termId, setTermId] = useState<string | null>(null);
    // a new copy of the content for every request clears the search and scrolls to the term again
    const [contentKey, setContentKey] = useState(0);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            const link = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-glossary-term]") : null;
            const id = link?.dataset.glossaryTerm;
            if (!link || !id || !isPlainClick(event)) {
                return;
            }
            event.preventDefault();
            openGlossary(id, link);
        }
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [openGlossary]);

    useEffect(() => {
        if (glossaryRequest.count === 0 || !window.matchMedia(PANEL_MEDIA_QUERY).matches) {
            return;
        }
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }
        // a term opened from inside the panel (see also) keeps the first opener
        if (!dialog.open) {
            openerRef.current = glossaryRequest.opener;
        }
        setTermId(glossaryRequest.termId);
        setContentKey((key) => key + 1);
        if (!dialog.open) {
            dialog.showModal();
        }
    }, [glossaryRequest]);

    function close() {
        dialogRef.current?.close();
    }

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-labelledby="glossary-title"
            onClose={() => {
                setTermId(null);
                openerRef.current?.focus();
            }}
            onClick={(event) => {
                // a click on the backdrop lands on the dialog element itself
                if (event.target === dialogRef.current) {
                    close();
                }
            }}
        >
            <div className={styles.grip} aria-hidden="true" />
            <header className={styles.header}>
                <h2 id="glossary-title" className={styles.title}>
                    <BookOpen aria-hidden="true" />
                    Glossário
                </h2>
                <button type="button" className={styles.close} onClick={close} aria-label="Fechar o glossário">
                    <X aria-hidden="true" />
                </button>
            </header>
            <GlossaryContent key={contentKey} idPrefix={PANEL_PREFIX} currentId={termId} />
        </dialog>
    );
}