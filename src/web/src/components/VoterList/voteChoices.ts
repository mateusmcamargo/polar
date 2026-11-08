// how each registered choice is ordered, worded and written in the address, shared by the vote hemicycle and the voter list

// the order of the legend, of the seats inside a party and of the vote filter
export const VOTE_CHOICE_ORDER = ["YES", "NO", "ABSTENTION", "OBSTRUCTION", "ARTICLE_17", "NOT_VOTED"] as const;

export const VOTE_CHOICE_WORDS: Readonly<Record<string, string>> = {
    YES: "Sim",
    NO: "Não",
    ABSTENTION: "Abstenção",
    OBSTRUCTION: "Obstrução",
    ARTICLE_17: "Presidia a sessão",
    NOT_VOTED: "Não votou",
};

// values of ?voto= in the address
export const VOTE_CHOICE_SLUGS: Readonly<Record<string, string>> = {
    YES: "sim",
    NO: "nao",
    ABSTENTION: "abstencao",
    OBSTRUCTION: "obstrucao",
    ARTICLE_17: "presidia",
    NOT_VOTED: "nao-votou",
};

// what the deputies of the summary sentence did, in the singular and the plural
const VOTE_CHOICE_VERBS: Readonly<Record<string, readonly [string, string]>> = {
    YES: ["votou Sim", "votaram Sim"],
    NO: ["votou Não", "votaram Não"],
    ABSTENTION: ["se absteve", "se abstiveram"],
    OBSTRUCTION: ["obstruiu a votação", "obstruíram a votação"],
    ARTICLE_17: ["presidia a sessão", "presidiam a sessão"],
    NOT_VOTED: ["não votou", "não votaram"],
};

export function choiceFromSlug(slug: string | null): string {
    return VOTE_CHOICE_ORDER.find((choice) => VOTE_CHOICE_SLUGS[choice] === slug) ?? "";
}

export function choiceVerb(choice: string, count: number): string {
    return VOTE_CHOICE_VERBS[choice]?.[count === 1 ? 0 : 1] ?? "";
}