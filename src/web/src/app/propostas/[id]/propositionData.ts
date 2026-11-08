import { cache } from "react";
import { getPropositionDetail } from "@polar/db";

// the largest value of the integer column of the proposition id
const MAX_PROPOSITION_ID = 2_147_483_647;

// metadata and page read the same proposition in one render
export const loadPropositionDetail = cache(getPropositionDetail);

// a proposition id is the id of the Câmara, for example "2270800"
export function parsePropositionId(text: string): number | null {
    if (!/^[1-9]\d{0,9}$/.test(text)) {
        return null;
    }
    const id = Number(text);
    return id <= MAX_PROPOSITION_ID ? id : null;
}