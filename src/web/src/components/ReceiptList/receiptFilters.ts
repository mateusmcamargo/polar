"use client";

import { useMemo, useSyncExternalStore } from "react";

export interface ReceiptFilters {
    expenseTypeCode: number | null;
    month: number | null;
    supplierId: number | null;
}

const RECEIPT_FILTERS_CHANGE_EVENT = "receipt-filters-change";
export const RECEIPTS_SECTION_ID = "comprovantes";

function positiveInteger(text: string | null): number | null {
    return text && /^[1-9]\d{0,9}$/.test(text) ? Number(text) : null;
}

// filters live in the url (?categoria=, ?mes=, ?fornecedor=) so a filtered list can be shared
function parseReceiptFilters(search: string): ReceiptFilters {
    const params = new URLSearchParams(search);
    const month = positiveInteger(params.get("mes"));
    return {
        expenseTypeCode: positiveInteger(params.get("categoria")),
        month: month !== null && month <= 12 ? month : null,
        supplierId: positiveInteger(params.get("fornecedor")),
    };
}

export function writeReceiptFilters(filters: ReceiptFilters) {
    const params = new URLSearchParams();
    if (filters.expenseTypeCode !== null) params.set("categoria", String(filters.expenseTypeCode));
    if (filters.month !== null) params.set("mes", String(filters.month));
    if (filters.supplierId !== null) params.set("fornecedor", String(filters.supplierId));
    const query = params.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    window.dispatchEvent(new Event(RECEIPT_FILTERS_CHANGE_EVENT));
}

function subscribeToUrl(onChange: () => void): () => void {
    window.addEventListener("popstate", onChange);
    window.addEventListener(RECEIPT_FILTERS_CHANGE_EVENT, onChange);
    return () => {
        window.removeEventListener("popstate", onChange);
        window.removeEventListener(RECEIPT_FILTERS_CHANGE_EVENT, onChange);
    };
}

// the page is prerendered without query string (server snapshot), the url filters apply after hydration
export function useReceiptFilters(): ReceiptFilters {
    const search = useSyncExternalStore(subscribeToUrl, () => window.location.search, () => "");
    return useMemo(() => parseReceiptFilters(search), [search]);
}