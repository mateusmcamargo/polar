import type { Source, Sources } from "./sources";

// site wide glossary: the same term is always explained the same way, see "Glossary" in docs/DESIGN.md
// texts mark a term as [[id]] (shows the term as written here) or [[id|shown text]], and an unknown id fails the build

const ACCESSED_ON = "2026-11-05";

function planalto(title: string, path: string): Source {
    return { title, publisher: "Planalto", url: `https://www.planalto.gov.br/ccivil_03/${path}`, accessedOn: ACCESSED_ON };
}

const CONSTITUTION = planalto("Constituição Federal de 1988", "constituicao/constituicao.htm");
const CRIMINAL_PROCEDURE_CODE = planalto("Código de Processo Penal (Decreto-Lei nº 3.689, de 1941)", "decreto-lei/del3689.htm");

export interface GlossaryEntry {
    id: string;
    term: string;
    // other name or form, such as the full name of an acronym
    alsoKnownAs?: string;
    definition: string;
    example?: string;
    seeAlso?: readonly string[];
    sources: Sources;
}

// alphabetical by term; the panel and the /glossario page group them by first letter
export const GLOSSARY: readonly GlossaryEntry[] = [
    {
        id: "anistiado-politico",
        term: "Anistiado político",
        alsoKnownAs: "ou anistiada política",
        definition:
            "Pessoa que o Estado reconhece como perseguida por motivo político, principalmente durante a ditadura militar (1964 a 1985). Pode receber uma reparação em dinheiro.",
        example: "Quem foi preso ou perdeu o emprego por motivo político pode pedir para ser reconhecido como anistiado.",
        sources: [planalto("Lei nº 10.559, de 2002 (Lei da Anistia)", "leis/2002/l10559.htm")],
    },
    {
        id: "arquivamento",
        term: "Arquivamento",
        definition: "Quando uma investigação ou um processo é encerrado sem condenação, por exemplo porque não há provas ou porque o fato não é crime.",
        example: "Uma investigação arquivada pode ser reaberta se aparecerem provas novas.",
        sources: [CRIMINAL_PROCEDURE_CODE],
    },
    {
        id: "casa-civil",
        term: "Casa Civil",
        definition: "Ministério que ajuda diretamente o presidente e coordena o trabalho dos outros ministérios.",
        sources: [planalto("Lei nº 14.600, de 2023 (organização da Presidência e dos ministérios), art. 3º", "_ato2023-2026/2023/lei/l14600.htm")],
    },
    {
        id: "cassacao",
        term: "Cassação",
        definition: "Decisão que tira o mandato de quem foi eleito, como um deputado ou um presidente.",
        example: "A Justiça Eleitoral pode cassar quem abusou do poder político ou econômico na campanha.",
        sources: [planalto("Lei Complementar nº 64, de 1990", "leis/lcp/lcp64.htm")],
    },
    {
        id: "crime-de-responsabilidade",
        term: "Crime de responsabilidade",
        definition:
            "Infração que só autoridades podem cometer, como desrespeitar a Constituição ou as leis do orçamento. Não é um crime comum: não leva à prisão, mas pode tirar a pessoa do cargo.",
        example: "O presidente acusado de crime de responsabilidade é julgado pelo Senado.",
        seeAlso: ["impeachment"],
        sources: [planalto("Lei nº 1.079, de 1950", "leis/l1079.htm"), CONSTITUTION],
    },
    {
        id: "delacao-premiada",
        term: "Delação premiada",
        alsoKnownAs: "colaboração premiada",
        definition: "Acordo em que a pessoa acusada conta o que sabe sobre um crime e, em troca, pode receber uma pena menor.",
        sources: [planalto("Lei nº 12.850, de 2013", "_ato2011-2014/2013/lei/l12850.htm")],
    },
    {
        id: "denuncia",
        term: "Denúncia",
        definition: "Acusação formal que o Ministério Público apresenta à Justiça. Se a Justiça aceita a denúncia, a pessoa vira ré.",
        seeAlso: ["reu"],
        sources: [CRIMINAL_PROCEDURE_CODE],
    },
    {
        id: "impeachment",
        term: "Impeachment",
        definition: "Processo em que o Congresso pode tirar o presidente do cargo por crime de responsabilidade. A Câmara autoriza a abertura e o Senado julga.",
        seeAlso: ["crime-de-responsabilidade"],
        sources: [CONSTITUTION, planalto("Lei nº 1.079, de 1950", "leis/l1079.htm")],
    },
    {
        id: "improbidade-administrativa",
        term: "Improbidade administrativa",
        definition:
            "Mau uso do cargo público, feito de propósito, como enriquecer de forma ilegal ou causar prejuízo aos cofres públicos. Pode levar a multa, perda do cargo e suspensão dos direitos políticos, mas não à prisão.",
        sources: [planalto("Lei nº 8.429, de 1992", "leis/l8429.htm"), planalto("Lei nº 14.230, de 2021", "_ato2019-2022/2021/lei/l14230.htm")],
    },
    {
        id: "plano-safra",
        term: "Plano Safra",
        definition: "Programa do governo federal que oferece crédito rural, com condições melhores, para quem produz no campo.",
        sources: [
            {
                title: "Plano Safra",
                publisher: "Ministério da Agricultura e Pecuária",
                url: "https://www.gov.br/agricultura/pt-br/assuntos/politica-agricola/plano-safra",
                accessedOn: ACCESSED_ON,
            },
        ],
    },
    {
        id: "portaria",
        term: "Portaria",
        definition: "Documento oficial em que um ministro ou outra autoridade toma uma decisão. É publicado no Diário Oficial da União.",
        sources: [planalto("Decreto nº 9.191, de 2017 (regras para atos oficiais)", "_ato2015-2018/2017/decreto/d9191.htm")],
    },
    {
        id: "procuradoria-geral-da-republica",
        term: "Procuradoria-Geral da República",
        alsoKnownAs: "PGR",
        definition: "Parte do Ministério Público Federal que acusa autoridades, como ministros e o presidente, no Supremo Tribunal Federal.",
        sources: [CONSTITUTION, planalto("Lei Complementar nº 75, de 1993", "leis/lcp/lcp75.htm")],
    },
    {
        id: "reu",
        term: "Réu",
        alsoKnownAs: "ou ré",
        definition: "Pessoa que responde a um processo na Justiça, depois que a acusação foi aceita. Ser réu não é o mesmo que ser condenado.",
        seeAlso: ["denuncia"],
        sources: [CRIMINAL_PROCEDURE_CODE],
    },
    {
        id: "tcu",
        term: "TCU",
        alsoKnownAs: "Tribunal de Contas da União",
        definition:
            "Órgão que fiscaliza como o dinheiro público federal é gasto. Não faz parte da Justiça, mas pode mandar devolver dinheiro e aplicar multas.",
        sources: [CONSTITUTION],
    },
    {
        id: "tse",
        term: "TSE",
        alsoKnownAs: "Tribunal Superior Eleitoral",
        definition: "Tribunal que organiza as eleições e julga os casos ligados a elas, como abuso de poder na campanha.",
        sources: [CONSTITUTION],
    },
];

const GLOSSARY_BY_ID: ReadonlyMap<string, GlossaryEntry> = new Map(GLOSSARY.map((entry) => [entry.id, entry]));

export function findGlossaryEntry(id: string): GlossaryEntry | null {
    return GLOSSARY_BY_ID.get(id) ?? null;
}

export type GlossarySegment = { kind: "text"; value: string } | { kind: "term"; id: string; label: string };

const TERM_MARKUP = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

// splits a text into plain parts and glossary terms; throws on an unknown id, so a typo fails the static build
export function parseGlossaryText(text: string): GlossarySegment[] {
    const segments: GlossarySegment[] = [];
    let cursor = 0;
    for (const match of text.matchAll(TERM_MARKUP)) {
        const [whole, id = "", label] = match;
        const entry = GLOSSARY_BY_ID.get(id);
        if (!entry) {
            throw new Error(`unknown glossary term "${id}" in: ${text}`);
        }
        if (match.index > cursor) {
            segments.push({ kind: "text", value: text.slice(cursor, match.index) });
        }
        segments.push({ kind: "term", id, label: label ?? entry.term });
        cursor = match.index + whole.length;
    }
    if (cursor < text.length) {
        segments.push({ kind: "text", value: text.slice(cursor) });
    }
    return segments;
}

// text without the markup, for metadata, share images and the "Ouvir" button
export function plainGlossaryText(text: string): string {
    return parseGlossaryText(text)
        .map((segment) => (segment.kind === "text" ? segment.value : segment.label))
        .join("");
}

// checks every seeAlso link when the module loads, so a broken link fails the build too
for (const entry of GLOSSARY) {
    for (const id of entry.seeAlso ?? []) {
        if (!GLOSSARY_BY_ID.has(id)) {
            throw new Error(`glossary entry "${entry.id}" points to unknown "${id}"`);
        }
    }
}