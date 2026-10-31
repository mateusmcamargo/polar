import { cache } from "react";
import { getDeputyProfile, getDeputyYear } from "@polar/db";

// metadata, the page and the share image read the same profile in one render
export const loadDeputyProfile = cache(getDeputyProfile);
export const loadDeputyYear = cache(getDeputyYear);

// a valid id is a positive integer without leading zeros or signs
export function parseDeputyId(text: string): number | null {
    return /^[1-9]\d{0,9}$/.test(text) ? Number(text) : null;
}