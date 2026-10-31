// what each plenary vote decided, read from the start of the official description,
// for example "Aprovada, em segundo turno, a Proposta de Emenda à Constituição nº 66, de 2023"

export interface VoteKind {
    label: string;
    // used in "no texto principal" next to the badge of a group
    phrase: string;
    isMainText: boolean;
    result: string;
}

interface KindRule {
    pattern: RegExp;
    label: string;
    phrase: string;
    feminine: boolean;
    isMainText?: boolean;
}

const KIND_RULES: readonly KindRule[] = [
    { pattern: /^requerimento/i, label: "Requerimento", phrase: "no requerimento", feminine: false },
    { pattern: /^prefer[eê]ncia/i, label: "Pedido de preferência", phrase: "no pedido de preferência", feminine: false },
    { pattern: /^reda[cç][aã]o final/i, label: "Redação final", phrase: "na redação final", feminine: true },
    { pattern: /^emendas? de reda[cç][aã]o/i, label: "Ajuste de redação", phrase: "no ajuste de redação", feminine: true },
    { pattern: /^emenda/i, label: "Emenda", phrase: "na emenda", feminine: true },
    { pattern: /^parecer/i, label: "Parecer", phrase: "no parecer", feminine: false },
    { pattern: /^recurso/i, label: "Recurso", phrase: "no recurso", feminine: false },
    { pattern: /^(dispositivos|parte|inclus[aã]o|destaque)/i, label: "Parte do texto", phrase: "na parte do texto", feminine: true },
    {
        pattern: /^(projeto|substitutivo|subemenda substitutiva|proposta de emenda|medida provis[oó]ria|mensagem)/i,
        label: "Texto principal",
        phrase: "no texto principal",
        feminine: false,
        isMainText: true,
    },
];

const DECISION_PATTERN = /^(aprovad|rejeitad)[oa]s?((?:, [^,]+)*,)? (?:o|a|os|as) ([\s\S]+)$/i;
const AMENDMENT_TEXT_PATTERN = /^(mantid|suprimid)[oa]s? (?:o|os) textos?/i;
const VOTE_COUNT_PATTERN = /Sim: (\d+); Não: (\d+)/;

function roundOf(clauses: string | undefined): string {
    if (/primeiro turno/i.test(clauses ?? "")) {
        return ", 1º turno";
    }
    if (/segundo turno/i.test(clauses ?? "")) {
        return ", 2º turno";
    }
    return "";
}

function resultWord(approved: boolean | null, feminine: boolean): string {
    if (approved === null) {
        return "Resultado não informado";
    }
    if (approved) {
        return feminine ? "Aprovada" : "Aprovado";
    }
    return feminine ? "Rejeitada" : "Rejeitado";
}

export function classifyVote(description: string, approved: boolean | null): VoteKind {
    const counts = VOTE_COUNT_PATTERN.exec(description);
    const countText = counts ? `. Sim ${counts[1]}, Não ${counts[2]}` : "";

    // a destaque asks whether a piece of the text stays: "Sim" keeps it
    const amendmentText = AMENDMENT_TEXT_PATTERN.exec(description);
    if (amendmentText) {
        const kept = amendmentText[1]?.toLowerCase() === "mantid";
        return {
            label: "Destaque: manter o texto",
            phrase: "no destaque",
            isMainText: false,
            result: `${kept ? "Mantido" : "Retirado"}${countText}`,
        };
    }

    const decision = DECISION_PATTERN.exec(description);
    const rule = decision ? KIND_RULES.find((candidate) => candidate.pattern.test(decision[3] ?? "")) : undefined;
    if (!rule) {
        return {
            label: "Outra votação",
            phrase: "nesta votação",
            isMainText: false,
            result: `${resultWord(approved, true)}${countText}`,
        };
    }
    return {
        label: `${rule.label}${rule.isMainText ? roundOf(decision?.[2]) : ""}`,
        phrase: rule.phrase,
        isMainText: rule.isMainText ?? false,
        result: `${resultWord(approved, rule.feminine)}${countText}`,
    };
}