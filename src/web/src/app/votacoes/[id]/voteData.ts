import { cache } from "react";
import { getChamberComposition, getVoteDetail } from "@polar/db";
import { groupSeatsByParty } from "@/components/Hemicycle/chamberParties";

// metadata and page read the same vote in one render
export const loadVoteDetail = cache(getVoteDetail);

// a Câmara vote id is the proposition id and a sequence number, for example "2270800-135"
export function parseVoteId(text: string): string | null {
    return /^\d{1,10}-\d{1,6}$/.test(text) ? text : null;
}

// parties in the order of the hemicycle of /deputados (the most aligned to the government first), so the seats of a vote sit
// where the same party sits there
export const loadPartyOrder = cache(async (): Promise<string[]> => {
    const chamber = await getChamberComposition();
    return groupSeatsByParty(chamber.seats).map((party) => party.acronym);
});