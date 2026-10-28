import type { DeputySearchEntry } from "@polar/db";

const MAX_SIMILAR_RESULTS = 12;
// same order of magnitude as the default pg_trgm threshold (0.3)
const MIN_WORD_SIMILARITY = 0.34;

// lowercase, without accents and punctuation, as the search_name column built at ingestion
export function normalizeSearchText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function splitSearchTokens(query: string): string[] {
    return normalizeSearchText(query).split(" ").filter(Boolean);
}

function trigrams(word: string): Set<string> {
    const padded = `  ${word} `;
    const result = new Set<string>();
    for (let index = 0; index < padded.length - 2; index++) {
        result.add(padded.slice(index, index + 3));
    }
    return result;
}

function trigramSimilarity(first: string, second: string): number {
    const firstTrigrams = trigrams(first);
    const secondTrigrams = trigrams(second);
    let shared = 0;
    for (const trigram of firstTrigrams) {
        if (secondTrigrams.has(trigram)) {
            shared++;
        }
    }
    return shared / (firstTrigrams.size + secondTrigrams.size - shared);
}

// optimal string alignment distance: insertions, deletions, substitutions and swapped neighbors
function editDistance(first: string, second: string): number {
    const rows = Array.from({ length: first.length + 1 }, (_, row) => Array.from({ length: second.length + 1 }, (_, column) => (row === 0 ? column : column === 0 ? row : 0)));
    for (let row = 1; row <= first.length; row++) {
        for (let column = 1; column <= second.length; column++) {
            const cost = first[row - 1] === second[column - 1] ? 0 : 1;
            let best = Math.min(rows[row - 1]![column]! + 1, rows[row]![column - 1]! + 1, rows[row - 1]![column - 1]! + cost);
            if (row > 1 && column > 1 && first[row - 1] === second[column - 2] && first[row - 2] === second[column - 1]) {
                best = Math.min(best, rows[row - 2]![column - 2]! + 1);
            }
            rows[row]![column] = best;
        }
    }
    return rows[first.length]![second.length]!;
}

// trigrams miss swapped letters ("sivla"), so short typos also count: one edit up to 6 letters, two above
function wordSimilarity(token: string, word: string): number {
    const trigramScore = trigramSimilarity(token, word);
    if (token.length < 4) {
        return trigramScore;
    }
    const allowedEdits = token.length > 6 ? 2 : 1;
    const distance = Math.min(editDistance(token, word), editDistance(token, word.slice(0, token.length)));
    return distance <= allowedEdits ? Math.max(trigramScore, 1 - distance / token.length) : trigramScore;
}

function matchesEveryToken(deputy: DeputySearchEntry, tokens: string[]): boolean {
    const words = deputy.searchName.split(" ");
    return tokens.every((token) => words.some((word) => word.startsWith(token)) || deputy.searchName.includes(token));
}

function similarityScore(deputy: DeputySearchEntry, tokens: string[]): number {
    const words = deputy.searchName.split(" ");
    let total = 0;
    for (const token of tokens) {
        const best = Math.max(...words.map((word) => wordSimilarity(token, word)));
        if (best < MIN_WORD_SIMILARITY) {
            return 0;
        }
        total += best;
    }
    return total / tokens.length;
}

// true when some typed word is not in the political name, so the match came from the civil name
export function matchesOnlyCivilName(deputy: DeputySearchEntry, tokens: string[]): boolean {
    const politicalWords = normalizeSearchText(deputy.politicalName).split(" ");
    return tokens.some((token) => !politicalWords.some((word) => word.startsWith(token)));
}

export interface NameSearchResult {
    deputies: DeputySearchEntry[];
    isSimilarMatch: boolean;
}

// exact prefix or substring matches first; when there are none, the most similar names, tolerating typos
export function searchByName(pool: DeputySearchEntry[], query: string): NameSearchResult {
    const tokens = splitSearchTokens(query);
    if (tokens.length === 0) {
        return { deputies: pool, isSimilarMatch: false };
    }

    const exactMatches = pool.filter((deputy) => matchesEveryToken(deputy, tokens));
    if (exactMatches.length > 0) {
        return { deputies: exactMatches, isSimilarMatch: false };
    }

    const similarMatches = pool
        .map((deputy) => ({ deputy, score: similarityScore(deputy, tokens) }))
        .filter(({ score }) => score > 0)
        .sort((first, second) => second.score - first.score)
        .slice(0, MAX_SIMILAR_RESULTS)
        .map(({ deputy }) => deputy);
    return { deputies: similarMatches, isSimilarMatch: true };
}