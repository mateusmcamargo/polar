// committee names carry their whole purpose and can take five lines: special committees on a proposition become
// "Comissão Especial sobre a PEC 34/2024" with the quoted subject apart, and other long names are split at
// "destinada a" or "para", for example "Comissão Externa" with "Acompanhar as obras do túnel..." apart
const PROPOSITION_ACRONYMS: readonly [RegExp, string][] = [
    [/^Proposta de Emenda à Constituição/i, "PEC"],
    [/^Projeto de Lei Complementar/i, "PLP"],
    [/^Projeto de Lei/i, "PL"],
    [/^Medida Provisória/i, "MPV"],
];

const SPECIAL_COMMITTEE_PATTERN = /^Comissão Especial destinada a proferir parecer (?:à|ao) (.+?) n[ºo°] ([\d.]+), de (\d{4})/i;
const QUOTED_SUBJECT_PATTERN = /[“"]([^”"]+)[”"]/;
const PURPOSE_PATTERN = /^(.+?),?(?: sem ônus para a Câmara dos Deputados,)? (?:destinad[ao] a|para|com o objetivo de|criad[ao] pel[ao]) (.+)$/i;
const PARENTHESIS_PATTERN = /^(.+?) \((.+)\)$/;
const LONG_NAME_LENGTH = 80;

export interface OrganName {
    name: string;
    subject: string | null;
}

export function shortOrganName(publishedName: string): OrganName {
    // some names come with line breaks inside
    const officialName = publishedName.replace(/\s+/g, " ").trim();
    const match = SPECIAL_COMMITTEE_PATTERN.exec(officialName);
    const acronym = match ? PROPOSITION_ACRONYMS.find(([pattern]) => pattern.test(match[1] ?? ""))?.[1] : undefined;
    if (match && acronym) {
        const subject = QUOTED_SUBJECT_PATTERN.exec(officialName)?.[1] ?? /, que (.+)$/.exec(officialName)?.[1];
        return {
            name: `Comissão Especial sobre ${acronym === "PEC" || acronym === "MPV" ? "a" : "o"} ${acronym} ${match[2]?.replaceAll(".", "")}/${match[3]}`,
            subject: subject ? capitalize(subject) : null,
        };
    }
    if (officialName.length > LONG_NAME_LENGTH) {
        const split = PURPOSE_PATTERN.exec(officialName) ?? PARENTHESIS_PATTERN.exec(officialName);
        if (split?.[1] && split[2]) {
            return { name: split[1], subject: capitalize(split[2]) };
        }
    }
    return { name: officialName, subject: null };
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}