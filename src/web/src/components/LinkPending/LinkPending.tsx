"use client";

import { useLinkStatus } from "next/link";
import styles from "./LinkPending.module.scss";

// goes inside a <Link> whose page may take a moment to render (a profile or a year on its first visit of the day, as the
// pages have no loading.tsx): while the navigation is pending, the skeleton sweep passes over the link and a hidden status
// says it is loading. The element is always there, only its opacity changes, so the link never shifts. The link needs
// position: relative
export function LinkPending() {
    const { pending } = useLinkStatus();
    return (
        <>
            <span className={pending ? `${styles.sweep} ${styles.pending}` : styles.sweep} aria-hidden="true" />
            <span className="visually-hidden" role="status">
                {pending ? "Carregando…" : ""}
            </span>
        </>
    );
}