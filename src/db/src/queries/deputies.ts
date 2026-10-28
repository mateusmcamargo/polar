import { prisma } from "../client";

export interface DeputySearchEntry {
    id: number;
    politicalName: string;
    civilName: string | null;
    searchName: string;
    photoUrl: string | null;
    stateCode: string;
    partyAcronym: string | null;
    isInOffice: boolean;
}

export interface DeputySearchData {
    deputies: DeputySearchEntry[];
    collectedAt: Date | null;
}

// every deputy of the legislature, small enough (about 650 rows) to filter in the browser
export async function listDeputiesForSearch(): Promise<DeputySearchData> {
    const rows = await prisma.deputy.findMany({
        select: {
            id: true,
            politicalName: true,
            civilName: true,
            searchName: true,
            photoUrl: true,
            stateCode: true,
            isInOffice: true,
            collectedAt: true,
            party: { select: { acronym: true } },
        },
        orderBy: { searchName: "asc" },
    });

    let collectedAt: Date | null = null;
    const deputies = rows.map((row) => {
        if (!collectedAt || row.collectedAt > collectedAt) {
            collectedAt = row.collectedAt;
        }
        return {
            id: row.id,
            politicalName: row.politicalName,
            civilName: row.civilName,
            searchName: row.searchName,
            photoUrl: row.photoUrl,
            stateCode: row.stateCode,
            partyAcronym: row.party?.acronym ?? null,
            isInOffice: row.isInOffice,
        };
    });

    return { deputies, collectedAt };
}