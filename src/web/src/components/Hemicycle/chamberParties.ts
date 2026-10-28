import type { ChamberSeat } from "@polar/db";

// fewer counted votes than this and the deputy has no rate, see "Metrics" in USE_CASES.md
export const MIN_COUNTED_VOTES = 30;
export const NO_PARTY_ACRONYM = "S.PART.";

export interface SeatWithRates extends ChamberSeat {
    governmentRate: number | null;
    partyRate: number | null;
}

export interface ChamberParty {
    acronym: string;
    label: string;
    // most aligned to the government first, deputies without a rate at the end
    seats: SeatWithRates[];
    governmentRate: number | null;
    partyRate: number | null;
}

function rate(aligned: number, counted: number): number | null {
    return counted >= MIN_COUNTED_VOTES ? aligned / counted : null;
}

function average(values: (number | null)[]): number | null {
    const measured = values.filter((value): value is number => value !== null);
    return measured.length > 0 ? measured.reduce((sum, value) => sum + value, 0) / measured.length : null;
}

export function partyLabel(acronym: string): string {
    return acronym === NO_PARTY_ACRONYM ? "Sem partido" : acronym;
}

function compareRates(first: number | null, second: number | null): number {
    return (second ?? -1) - (first ?? -1);
}

// parties from the most to the least aligned to the government; parties without a rate at the right end, alphabetically
export function groupSeatsByParty(seats: ChamberSeat[]): ChamberParty[] {
    const seatsByParty = new Map<string, SeatWithRates[]>();
    for (const seat of seats) {
        const acronym = seat.partyAcronym ?? NO_PARTY_ACRONYM;
        const partySeats = seatsByParty.get(acronym) ?? [];
        partySeats.push({
            ...seat,
            governmentRate: rate(seat.governmentAligned, seat.governmentVotes),
            partyRate: rate(seat.partyAligned, seat.partyVotes),
        });
        seatsByParty.set(acronym, partySeats);
    }

    const parties = [...seatsByParty.entries()].map(([acronym, partySeats]) => ({
        acronym,
        label: partyLabel(acronym),
        seats: partySeats.sort((first, second) => compareRates(first.governmentRate, second.governmentRate)),
        governmentRate: average(partySeats.map((seat) => seat.governmentRate)),
        partyRate: average(partySeats.map((seat) => seat.partyRate)),
    }));

    return parties.sort((first, second) => {
        if (first.governmentRate === null || second.governmentRate === null) {
            if (first.governmentRate === second.governmentRate) {
                return first.label.localeCompare(second.label, "pt-BR");
            }
            return first.governmentRate === null ? 1 : -1;
        }
        return second.governmentRate - first.governmentRate;
    });
}