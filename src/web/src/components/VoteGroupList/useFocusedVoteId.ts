"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
}

function readFocusedVoteId(): string | null {
    const voteId = new URLSearchParams(window.location.search).get("votacao");
    return voteId && /^\d{1,10}-\d{1,6}$/.test(voteId) ? voteId : null;
}

// the vote in ?votacao=, sent by the vote pages; the page is prerendered without query string (server snapshot), so the
// focus applies after hydration
export function useFocusedVoteId(): string | null {
    return useSyncExternalStore(subscribe, readFocusedVoteId, () => null);
}