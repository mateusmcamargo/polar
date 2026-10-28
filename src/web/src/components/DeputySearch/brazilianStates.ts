export interface BrazilianState {
    code: string;
    name: string;
    // grammatical article of the name: "do Paraná", "da Bahia", "de São Paulo"
    article: "o" | "a" | null;
}

export interface BrazilianRegion {
    name: string;
    stateCodes: readonly string[];
}

export const BRAZILIAN_STATES: Readonly<Record<string, BrazilianState>> = {
    AC: { code: "AC", name: "Acre", article: "o" },
    AL: { code: "AL", name: "Alagoas", article: null },
    AM: { code: "AM", name: "Amazonas", article: "o" },
    AP: { code: "AP", name: "Amapá", article: "o" },
    BA: { code: "BA", name: "Bahia", article: "a" },
    CE: { code: "CE", name: "Ceará", article: "o" },
    DF: { code: "DF", name: "Distrito Federal", article: "o" },
    ES: { code: "ES", name: "Espírito Santo", article: "o" },
    GO: { code: "GO", name: "Goiás", article: null },
    MA: { code: "MA", name: "Maranhão", article: "o" },
    MG: { code: "MG", name: "Minas Gerais", article: null },
    MS: { code: "MS", name: "Mato Grosso do Sul", article: null },
    MT: { code: "MT", name: "Mato Grosso", article: null },
    PA: { code: "PA", name: "Pará", article: "o" },
    PB: { code: "PB", name: "Paraíba", article: "a" },
    PE: { code: "PE", name: "Pernambuco", article: null },
    PI: { code: "PI", name: "Piauí", article: "o" },
    PR: { code: "PR", name: "Paraná", article: "o" },
    RJ: { code: "RJ", name: "Rio de Janeiro", article: "o" },
    RN: { code: "RN", name: "Rio Grande do Norte", article: "o" },
    RO: { code: "RO", name: "Rondônia", article: null },
    RR: { code: "RR", name: "Roraima", article: null },
    RS: { code: "RS", name: "Rio Grande do Sul", article: "o" },
    SC: { code: "SC", name: "Santa Catarina", article: null },
    SE: { code: "SE", name: "Sergipe", article: null },
    SP: { code: "SP", name: "São Paulo", article: null },
    TO: { code: "TO", name: "Tocantins", article: "o" },
};

export const BRAZILIAN_REGIONS: readonly BrazilianRegion[] = [
    { name: "Norte", stateCodes: ["AC", "AM", "AP", "PA", "RO", "RR", "TO"] },
    { name: "Nordeste", stateCodes: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"] },
    { name: "Centro-Oeste", stateCodes: ["DF", "GO", "MS", "MT"] },
    { name: "Sudeste", stateCodes: ["ES", "MG", "RJ", "SP"] },
    { name: "Sul", stateCodes: ["PR", "RS", "SC"] },
];

// the distrito federal is not a state, texts that count states name it apart
export const FEDERAL_DISTRICT_CODE = "DF";

export function stateName(code: string): string {
    return BRAZILIAN_STATES[code]?.name ?? code;
}

// "do Paraná", "da Bahia", "de São Paulo"
export function ofState(code: string): string {
    const article = BRAZILIAN_STATES[code]?.article;
    const preposition = article === "o" ? "do" : article === "a" ? "da" : "de";
    return `${preposition} ${stateName(code)}`;
}

// "no Paraná", "na Bahia", "em São Paulo"
export function inState(code: string): string {
    const article = BRAZILIAN_STATES[code]?.article;
    const preposition = article === "o" ? "no" : article === "a" ? "na" : "em";
    return `${preposition} ${stateName(code)}`;
}