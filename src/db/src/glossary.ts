import type { Source, Sources } from "./sources";

// site wide glossary: the same term is always explained the same way, see "Glossary" in docs/DESIGN.md
// texts mark a term as [[id]] (shows the term as written here) or [[id|shown text]], and an unknown id fails the build
// definitions are plain text, so a hard word inside one gets a short explanation in parentheses instead of a link

const ACCESSED_ON = "2026-11-05";
const ACCESSED_ON_NEW_ENTRIES = "2026-11-06";

function planalto(title: string, path: string, accessedOn: string = ACCESSED_ON): Source {
    return { title, publisher: "Planalto", url: `https://www.planalto.gov.br/ccivil_03/${path}`, accessedOn };
}

const CONSTITUTION = planalto("Constituição Federal de 1988", "constituicao/constituicao.htm");
const CONSTITUTION_READ_AGAIN = planalto("Constituição Federal de 1988", "constituicao/constituicao.htm", ACCESSED_ON_NEW_ENTRIES);
const CONSTITUTION_OF_1824 = planalto("Constituição Política do Império do Brasil, de 1824", "constituicao/constituicao24.htm", ACCESSED_ON_NEW_ENTRIES);
const CRIMINAL_PROCEDURE_CODE = planalto("Código de Processo Penal (Decreto-Lei nº 3.689, de 1941)", "decreto-lei/del3689.htm");
const PRESIDENCY_LIBRARY_GALLERY: Source = {
    title: "Galeria de ex-presidentes",
    publisher: "Biblioteca da Presidência da República",
    url: "https://www.biblioteca.presidencia.gov.br/presidencia/ex-presidentes",
    accessedOn: ACCESSED_ON,
};

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
        id: "brics",
        term: "BRICS",
        definition:
            "Grupo de países que se reúnem para cooperar em temas de economia e política. Os fundadores são Brasil, Rússia, Índia, China e África do Sul. O grupo tem um banco próprio, o Novo Banco de Desenvolvimento, chamado de Banco do BRICS, que apoia o desenvolvimento dos países do grupo.",
        sources: [
            {
                title: "Dilma continua à frente do Banco do Brics por mais 5 anos",
                publisher: "Agência Brasil",
                url: "https://agenciabrasil.ebc.com.br/internacional/noticia/2025-03/dilma-continua-frente-do-banco-do-brics-por-mais-5-anos",
                accessedOn: ACCESSED_ON_NEW_ENTRIES,
            },
        ],
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
            "Infração (uma falta grave) que só autoridades podem cometer, como desrespeitar a Constituição ou as leis do orçamento (as leis que dizem como o governo pode gastar o dinheiro). Não é um crime comum: não leva à prisão, mas pode tirar a pessoa do cargo.",
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
        definition:
            "Acusação formal que o Ministério Público (o órgão que defende a lei e a sociedade) apresenta à Justiça. Se a Justiça aceita a denúncia, a pessoa vira ré.",
        seeAlso: ["reu", "ministerio-publico"],
        sources: [CRIMINAL_PROCEDURE_CODE],
    },
    {
        id: "diario-oficial-da-uniao",
        term: "Diário Oficial da União",
        alsoKnownAs: "DOU",
        definition: "Jornal oficial do governo federal. É nele que saem as leis, os decretos, as portarias e outros atos do governo.",
        seeAlso: ["portaria"],
        sources: [planalto("Decreto nº 9.191, de 2017 (regras para atos oficiais), art. 41", "_ato2015-2018/2017/decreto/d9191.htm", ACCESSED_ON_NEW_ENTRIES)],
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
            "Mau uso do cargo público, feito de propósito, como enriquecer de forma ilegal ou causar prejuízo aos cofres públicos (o dinheiro do governo). Pode levar a multa, perda do cargo e suspensão dos direitos políticos (ficar sem poder votar nem ser candidato), mas não à prisão.",
        sources: [planalto("Lei nº 8.429, de 1992", "leis/l8429.htm"), planalto("Lei nº 14.230, de 2021", "_ato2019-2022/2021/lei/l14230.htm")],
    },
    {
        id: "junta-militar",
        term: "Junta militar",
        definition:
            "Grupo pequeno de militares que governa o país por um tempo, no lugar do presidente. No Brasil, houve juntas em 1930 e em 1969.",
        sources: [PRESIDENCY_LIBRARY_GALLERY],
    },
    {
        id: "lei-de-responsabilidade-fiscal",
        term: "Lei de Responsabilidade Fiscal",
        alsoKnownAs: "LRF",
        definition:
            "Lei de 2000 que cria regras para o governo federal, os estados e os municípios gastarem com responsabilidade: planejar os gastos, respeitar limites e prestar contas. Ela proíbe, por exemplo, que o governo pegue um empréstimo em um banco público que ele mesmo controla.",
        sources: [planalto("Lei Complementar nº 101, de 2000 (Lei de Responsabilidade Fiscal), art. 36", "leis/lcp/lcp101.htm", ACCESSED_ON_NEW_ENTRIES)],
    },
    {
        id: "ministerio-publico",
        term: "Ministério Público",
        alsoKnownAs: "MP",
        definition:
            "Órgão que defende a lei, a democracia e os direitos da sociedade. Investiga, acusa na Justiça quem comete crimes e cobra o cumprimento das leis. Tem autonomia, ou seja, não recebe ordens do governo.",
        seeAlso: ["ministerio-publico-federal", "denuncia"],
        sources: [CONSTITUTION_READ_AGAIN],
    },
    {
        id: "ministerio-publico-federal",
        term: "Ministério Público Federal",
        alsoKnownAs: "MPF",
        definition:
            "Ramo do Ministério Público que atua nos tribunais e nos juízes federais, no Supremo Tribunal Federal (o tribunal mais alto do país) e na Justiça Eleitoral. O chefe é o procurador-geral da República.",
        seeAlso: ["ministerio-publico", "procuradoria-geral-da-republica"],
        sources: [planalto("Lei Complementar nº 75, de 1993, arts. 25 e 37", "leis/lcp/lcp75.htm", ACCESSED_ON_NEW_ENTRIES)],
    },
    {
        id: "nova-republica",
        term: "Nova República",
        definition: "Período da história do Brasil que começa em 1985, com o fim da ditadura militar, e continua até hoje.",
        sources: [PRESIDENCY_LIBRARY_GALLERY],
    },
    {
        id: "onu",
        term: "ONU",
        alsoKnownAs: "Organização das Nações Unidas",
        definition:
            "Organização que reúne países do mundo, criada em 1945 para manter a paz e a segurança entre eles. A Assembleia Geral é a reunião de todos os países que fazem parte dela.",
        sources: [planalto("Carta das Nações Unidas (Decreto nº 19.841, de 1945), arts. 1º e 9º", "decreto/1930-1949/d19841.htm", ACCESSED_ON_NEW_ENTRIES)],
    },
    {
        id: "operacao-lava-jato",
        term: "Operação Lava Jato",
        definition:
            "Investigação de corrupção e lavagem de dinheiro que começou em março de 2014. Uma das primeiras prisões foi a de um diretor da Petrobras, a empresa de petróleo do governo. O Ministério Público Federal atuou nos casos, que foram julgados pela Justiça Federal em Curitiba.",
        seeAlso: ["ministerio-publico-federal", "delacao-premiada"],
        sources: [
            {
                title: "Operação Lava Jato",
                publisher: "Ministério Público Federal",
                url: "https://www.mpf.mp.br/atuacao/grandes-casos/casos-historicos/operacao-lava-jato",
                accessedOn: ACCESSED_ON_NEW_ENTRIES,
            },
            {
                title: "Linha do tempo da Operação Lava Jato, 2014",
                publisher: "Ministério Público Federal",
                url: "https://linhadotempo.mpf.mp.br/www/linha-do-tempo/2014",
                accessedOn: ACCESSED_ON_NEW_ENTRIES,
            },
        ],
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
        id: "plenario",
        term: "Plenário",
        definition: "Reunião de todos os deputados para discutir e votar projetos. É no Plenário que a Câmara toma as suas decisões.",
        sources: [
            {
                title: "Plenário",
                publisher: "Câmara dos Deputados",
                url: "https://www.camara.leg.br/plenario",
                accessedOn: ACCESSED_ON_NEW_ENTRIES,
            },
        ],
    },
    {
        id: "portaria",
        term: "Portaria",
        definition: "Documento oficial em que um ministro ou outra autoridade toma uma decisão. É publicado no Diário Oficial da União, o jornal oficial do governo federal.",
        seeAlso: ["diario-oficial-da-uniao"],
        sources: [planalto("Decreto nº 9.191, de 2017 (regras para atos oficiais)", "_ato2015-2018/2017/decreto/d9191.htm")],
    },
    {
        id: "procuradoria-geral-da-republica",
        term: "Procuradoria-Geral da República",
        alsoKnownAs: "PGR",
        definition:
            "Parte do Ministério Público Federal (o ramo do Ministério Público que atua nos tribunais federais) que acusa autoridades, como ministros e o presidente, no Supremo Tribunal Federal (o tribunal mais alto do país).",
        seeAlso: ["ministerio-publico-federal", "supremo-tribunal-federal"],
        sources: [CONSTITUTION, planalto("Lei Complementar nº 75, de 1993", "leis/lcp/lcp75.htm")],
    },
    {
        id: "regencia",
        term: "Regência",
        definition:
            "Governo exercido por uma ou mais pessoas no lugar do imperador, quando ele não pode governar, por exemplo por ser menor de idade. Quando eram três pessoas, chamava-se regência trina.",
        sources: [
            CONSTITUTION_OF_1824,
            {
                title: "Regência (1831-1840), fundo Senado Imperial",
                publisher: "Arquivo do Senado Federal",
                url: "https://atom.senado.leg.br/index.php/reg-ncia-trina-permanente-ok",
                accessedOn: ACCESSED_ON,
            },
        ],
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
        id: "supremo-tribunal-federal",
        term: "Supremo Tribunal Federal",
        alsoKnownAs: "STF",
        definition:
            "O tribunal mais alto do país. Cuida de garantir que a Constituição seja respeitada e julga, nos crimes comuns, o presidente, o vice-presidente e os membros do Congresso.",
        sources: [CONSTITUTION_READ_AGAIN],
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
        id: "tribunal-regional-federal",
        term: "Tribunal Regional Federal",
        alsoKnownAs: "TRF",
        definition:
            "Tribunal que julga os recursos contra decisões de juízes federais. O país é dividido em regiões, e cada região tem o seu tribunal: o TRF da 1ª Região, por exemplo, é o da primeira delas.",
        sources: [CONSTITUTION_READ_AGAIN],
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

// the most recent access date among the sources, shown on the /glossario page (yyyy-mm-dd, so plain sorting works)
export const GLOSSARY_ACCESSED_ON: string = GLOSSARY.flatMap((entry) => entry.sources.map((source) => source.accessedOn)).sort().at(-1) ?? ACCESSED_ON;

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