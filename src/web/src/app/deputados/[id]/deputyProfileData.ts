import { cache } from "react";
import { getDeputyProfile, getDeputySpending, getDeputyVotes, getDeputyYear, type DeputyProfile } from "@polar/db";

// metadata, the page and the share image read the same profile in one render
export const loadDeputyProfile = cache(getDeputyProfile);
export const loadDeputyYear = cache(getDeputyYear);
export const loadDeputySpending = cache(getDeputySpending);
export const loadDeputyVotes = cache(getDeputyVotes);

// a valid id is a positive integer without leading zeros or signs
export function parseDeputyId(text: string): number | null {
    return /^[1-9]\d{0,9}$/.test(text) ? Number(text) : null;
}

export interface ResolvedProfile {
    profile: DeputyProfile;
    // null when the deputy has no data in any year
    year: number | null;
}

// the newest year has no year segment; an older one must be one of the years with data, written without extra characters
export async function resolveProfileYear(id: string, ano: string[] | undefined): Promise<ResolvedProfile | null> {
    const deputyId = parseDeputyId(id);
    if (deputyId === null || (ano && ano.length > 1)) {
        return null;
    }
    const profile = await loadDeputyProfile(deputyId);
    if (!profile) {
        return null;
    }
    const requestedYear = ano?.[0];
    if (requestedYear === undefined) {
        return { profile, year: profile.years[0] ?? null };
    }
    const year = Number(requestedYear);
    return profile.years.includes(year) && String(year) === requestedYear ? { profile, year } : null;
}