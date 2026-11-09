import type { Source, Sources } from "./sources";

// site wide glossary: the same term is always explained the same way, see "Glossary" in docs/DESIGN.md
// texts mark a term as [[id]] (shows the term as written here) or [[id|shown text]], and an unknown id fails the build
// definitions are plain text, so a hard word inside one gets a short explanation in parentheses instead of a link

const ACCESSED_ON = "2026-11-05";
const ACCESSED_ON_NEW_ENTRIES = "2026-11-06";

const ACCESSED_ON_VOTE_ENTRIES = "2026-11-06";
const ACCESSED_ON_VOTE_TERMS = "2026-11-08";

function chamberRules(article: string, accessedOn: string = ACCESSED_ON_VOTE_ENTRIES): Source {
    return {
        title: `Regimento Interno da Câmara dos Deputados, ${article}`,
        publisher: "Câmara dos Deputados",
        url: "https://www2.camara.leg.br/legin/fed/rescad/1989/resolucaodacamaradosdeputados-17-21-setembro-1989-320110-normaatualizada-pl.html",
        accessedOn,
    };
}

// source of the vote terms, read again on 2026-11-08
function voteTermRules(article: string): Source {
    return chamberRules(article, ACCESSED_ON_VOTE_TERMS);
}

function planalto(title: string, path: string, accessedOn: string = ACCESSED_ON): Source {
    return { title, publisher: "Planalto", url: `https://www.planalto.gov.br/ccivil_03/${path}`, accessedOn };
}

const CONSTITUTION = planalto("Constituição Federal de 1988", "constituicao/constituicao.htm");
const CONSTITUTION_READ_AGAIN = planalto("Constituição Federal de 1988", "constituicao/constituicao.htm", ACCESSED_ON_NEW_ENTRIES);
const CONSTITUTION_OF_1824 = planalto("Constituição Política do Império do Brasil, de 1824", "constituicao/constituicao24.htm", ACCESSED_ON_NEW_ENTRIES);
const CRIMINAL_PROCEDURE_CODE = planalto("Código de Processo Penal (Decreto-Lei nº 3.689, de 1941)", "decreto-lei/del3689.htm");
const ACCESSED_ON_LANDMARK_ENTRIES = "2026-11-07";

const ITAIPU_TREATY = planalto("Decreto nº 72.707, de 1973 (promulga o Tratado de Itaipu e o Anexo C)", "decreto/antigos/d72707.htm", ACCESSED_ON_LANDMARK_ENTRIES);
const ITAIPU_GENERATION_PAGE: Source = {
    title: "Geração",
    publisher: "Itaipu Binacional",
    url: "https://www.itaipu.gov.br/energia/geracao",
    accessedOn: ACCESSED_ON_LANDMARK_ENTRIES,
};
const ITAIPU_TARIFF_NEWS: Source = {
    title: "Itaipu define tarifa para exercício de 2023",
    publisher: "Itaipu Binacional",
    url: "https://www.itaipu.gov.br/noticias/sala-de-imprensa/itaipu-define-tarifa-para-exercicio-de-2023",
    accessedOn: ACCESSED_ON_LANDMARK_ENTRIES,
};
const ANEEL_ITAIPU_PASS_THROUGH_NEWS: Source = {
    title: "Tarifa de Repasse da usina Itaipu para 2026 é aprovada pela ANEEL",
    publisher: "Agência Nacional de Energia Elétrica",
    url: "https://www.gov.br/aneel/pt-br/assuntos/noticias/2025/tarifa-de-repasse-da-usina-itaipu-para-2026-e-aprovada-pela-aneel",
    accessedOn: ACCESSED_ON_LANDMARK_ENTRIES,
};

const PRESIDENCY_LIBRARY_GALLERY: Source = {
    title: "Galeria de ex-presidentes",
    publisher: "Biblioteca da Presidência da República",
    url: "https://www.biblioteca.presidencia.gov.br/presidencia/ex-presidentes",
    accessedOn: ACCESSED_ON,
};

// the choices the vote pages show as a badge (VoteBadge), so a term of the dictionary can wear the same color and icon
export type GlossaryVoteChoice = "YES" | "NO" | "ABSTENTION" | "OBSTRUCTION" | "ARTICLE_17" | "NOT_VOTED" | "LIBERATED";

// group of the vote terms, shown above the term: how a deputy votes, how a voting goes, how a leader guides the vote
export type GlossaryVoteKind = "vote" | "voting" | "orientation";

export interface GlossaryEntry {
    id: string;
    term: string;
    // vote terms only: the term is shown as the badge of this choice
    voteChoice?: GlossaryVoteChoice;
    voteKind?: GlossaryVoteKind;
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
        id: "abstencao",
        term: "Abstenção",
        voteChoice: "ABSTENTION",
        voteKind: "vote",
        definition:
            "Quando o deputado está na votação, mas não vota a favor nem contra. A abstenção conta para saber se havia deputados suficientes na votação (o quórum), mas não conta como voto Sim nem como voto Não.",
        seeAlso: ["votacao-nominal"],
        sources: [chamberRules("art. 183, § 2º")],
    },
    {
        id: "ajuste-de-redacao",
        term: "Ajuste de redação",
        voteKind: "voting",
        definition:
            "Mudança que só corrige erro de linguagem, defeito ou erro evidente no texto já aprovado. Não muda o que os deputados decidiram.",
        seeAlso: ["redacao-final"],
        sources: [voteTermRules("art. 195, caput e § 2º")],
    },
    {
        id: "anexo-c",
        term: "Anexo C",
        alsoKnownAs: "do Tratado de Itaipu",
        definition:
            "Parte do Tratado de Itaipu que diz como o custo da usina é calculado e dividido: quanto a usina paga de juros, de dívida, de operação e de royalties, e como esse custo vira a tarifa cobrada de quem compra a energia. O próprio Anexo C diz que deve ser revisto depois de 50 anos da entrada em vigor do Tratado.",
        seeAlso: ["cuse", "royalties", "tratado-de-itaipu"],
        sources: [ITAIPU_TREATY],
    },
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
        id: "bloco-parlamentar",
        term: "Bloco parlamentar",
        definition: "Grupo de dois ou mais partidos que decidem agir juntos, com um só líder. Na Câmara, o bloco é tratado como se fosse um partido.",
        example: "Os partidos de um bloco costumam seguir a mesma orientação de voto, mas cada deputado decide o próprio voto.",
        seeAlso: ["orientacao"],
        sources: [chamberRules("art. 12")],
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
        id: "cessao-de-energia",
        term: "Cessão de energia",
        definition:
            "Quando um dos países sócios de Itaipu não usa toda a energia a que tem direito e deixa a parte que sobrou para o outro país comprar. O tratado dá a cada país o direito de comprar a energia que o outro não usa, e quem cede recebe uma remuneração por isso (300 dólares por gigawatt-hora cedido, no texto do tratado).",
        example: "O Paraguai usa menos da metade da energia de Itaipu, e a parte que ele não usa pode ser comprada pelo Brasil.",
        seeAlso: ["anexo-c", "gigawatt-hora"],
        sources: [ITAIPU_TREATY],
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
        id: "cuse",
        term: "Cuse",
        alsoKnownAs: "Custo Unitário dos Serviços de Eletricidade",
        definition:
            "A tarifa de Itaipu: o valor, em dólares por quilowatt de potência contratada por mês, que cobre os custos da usina (operação, manutenção, administração, royalties e dívidas). É decidido pelo Conselho de Administração da Itaipu, formado por brasileiros e paraguaios. No Brasil, a tarifa que as distribuidoras pagam é a tarifa de repasse, que parte do Cuse.",
        seeAlso: ["tarifa-de-repasse", "royalties"],
        sources: [ITAIPU_TARIFF_NEWS],
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
        id: "destaque",
        term: "Destaque",
        voteKind: "voting",
        definition:
            "Pedido para votar separadamente uma parte de um projeto, ou uma emenda (proposta de mudança no texto). Assim, os deputados podem aprovar o texto principal e ainda decidir, à parte, sobre aquele trecho.",
        example: "Numa votação de destaque, o voto Sim pode manter o trecho no texto.",
        seeAlso: ["requerimento"],
        sources: [chamberRules("art. 161")],
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
        id: "emenda",
        term: "Emenda",
        voteKind: "voting",
        definition:
            "Proposta de mudança em outra proposição, como um projeto. Pode tirar um trecho, juntar outras emendas, trocar, mudar ou acrescentar um trecho. Quando a emenda vai a voto, os deputados decidem se a mudança entra.",
        seeAlso: ["destaque"],
        sources: [voteTermRules("art. 118, § 1º")],
    },
    {
        id: "gigawatt-hora",
        term: "Gigawatt-hora",
        alsoKnownAs: "GWh",
        definition: "Medida de energia. Um gigawatt-hora é um milhão de quilowatts-hora, a unidade que aparece na conta de luz.",
        example: "Em 2025, Itaipu produziu 72.879 gigawatts-hora.",
        seeAlso: ["mw-medio"],
        sources: [ITAIPU_GENERATION_PAGE],
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
        id: "liberacao-do-voto",
        term: "Liberação do voto",
        alsoKnownAs: "Liberado",
        voteChoice: "LIBERATED",
        voteKind: "orientation",
        definition: "Quando o líder do partido, do bloco ou do governo não indica como o grupo deve votar. Cada deputado decide sozinho.",
        seeAlso: ["orientacao"],
        sources: [chamberRules("art. 192, § 2º")],
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
        id: "mw-medio",
        term: "MW médio",
        alsoKnownAs: "megawatt médio",
        definition: "Quanta energia uma usina entrega, em média, em cada hora de um período. Serve para comparar anos de tamanhos diferentes e para dividir a energia entre quem a compra.",
        seeAlso: ["gigawatt-hora"],
        sources: [ITAIPU_GENERATION_PAGE],
    },
    {
        id: "nao",
        term: "Não",
        voteChoice: "NO",
        voteKind: "vote",
        definition:
            "Voto contra o que está sendo votado. Numa votação de destaque para manter o texto, o voto Não tira o trecho do texto.",
        seeAlso: ["sim", "destaque"],
        sources: [voteTermRules("art. 187, § 1º, VI")],
    },
    {
        id: "nao-votou",
        term: "Não votou",
        voteChoice: "NOT_VOTED",
        voteKind: "vote",
        definition:
            "O deputado estava em exercício no dia da votação, mas a lista de votos da Câmara não traz voto dele. A lista não informa o motivo, e o polar também não.",
        seeAlso: ["votacao-nominal"],
        sources: [voteTermRules("art. 187, § 1º, VI")],
    },
    {
        id: "nova-republica",
        term: "Nova República",
        definition: "Período da história do Brasil que começa em 1985, com o fim da ditadura militar, e continua até hoje.",
        sources: [PRESIDENCY_LIBRARY_GALLERY],
    },
    {
        id: "obstrucao",
        term: "Obstrução",
        voteChoice: "OBSTRUCTION",
        voteKind: "vote",
        definition:
            "Estratégia de um partido ou bloco para atrasar ou impedir uma votação, por exemplo não participando dela. Na lista de votos da Câmara aparece como Obstrução, no lugar de Sim ou Não. O Regimento chama de obstrução parlamentar legítima a que as bancadas ou as lideranças aprovam e comunicam à Mesa (a direção da Câmara): nesse caso, a ausência na votação não conta como falta.",
        example: "Se o líder do partido orienta Obstrução, os deputados do partido podem registrar esse voto em vez de Sim ou Não.",
        seeAlso: ["orientacao", "abstencao"],
        sources: [voteTermRules("art. 82, § 6º")],
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
        id: "orientacao",
        term: "Orientação",
        alsoKnownAs: "orientação de bancada",
        definition:
            "Indicação que o líder de um partido, de um bloco ou do governo dá sobre como os deputados do grupo devem votar. É um recado dado antes da votação: cada deputado decide o próprio voto.",
        example: "Se o líder do governo orienta Sim, o governo pede que os deputados aliados votem Sim.",
        seeAlso: ["bloco-parlamentar", "liberacao-do-voto"],
        sources: [chamberRules("art. 192, § 2º")],
    },
    {
        id: "parecer",
        term: "Parecer",
        voteKind: "voting",
        definition:
            "Posição escrita de uma comissão sobre um assunto que ela estudou. Quando um parecer é votado no Plenário, os deputados decidem sobre a posição da comissão.",
        seeAlso: ["texto-principal"],
        sources: [voteTermRules("art. 126")],
    },
    {
        id: "parte-do-texto",
        term: "Parte do texto",
        voteKind: "voting",
        definition:
            "Trecho de um projeto votado separadamente, geralmente porque um destaque pediu. O resto do projeto é votado em conjunto, no texto principal.",
        seeAlso: ["destaque", "texto-principal"],
        sources: [voteTermRules("arts. 161, I, e 189")],
    },
    {
        id: "pedido-de-preferencia",
        term: "Pedido de preferência",
        voteKind: "voting",
        definition:
            "Pedido de um deputado para votar ou discutir uma proposição antes de outras do mesmo grupo. Quando o pedido vai a voto, o resultado decide a ordem da votação, não o conteúdo do projeto.",
        seeAlso: ["requerimento"],
        sources: [voteTermRules("art. 160")],
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
        id: "presidia-a-sessao",
        term: "Presidia a sessão",
        voteChoice: "ARTICLE_17",
        voteKind: "vote",
        definition:
            "Na lista de votos, a Câmara registra “Artigo 17” para o deputado que presidia a sessão. Segundo o Regimento, o Presidente da Câmara só vota em Plenário em votação secreta ou para desempatar uma votação aberta.",
        seeAlso: ["votacao-nominal"],
        sources: [voteTermRules("art. 17, § 1º")],
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
        id: "recurso",
        term: "Recurso",
        voteKind: "voting",
        definition:
            "Pedido para que o Plenário (todos os deputados reunidos) examine uma decisão tomada em outra instância da Câmara. Um projeto aprovado só por comissões, por exemplo, vai ao Plenário se um décimo dos deputados fizer esse pedido e o Plenário aceitar.",
        seeAlso: ["requerimento"],
        sources: [voteTermRules("art. 132, § 2º")],
    },
    {
        id: "redacao-final",
        term: "Redação final",
        voteKind: "voting",
        definition:
            "Última votação do texto de um projeto, já escrito conforme o que os deputados decidiram nas votações anteriores. Faz parte do turno em que a votação terminou.",
        seeAlso: ["ajuste-de-redacao", "turno"],
        sources: [voteTermRules("art. 195, caput e § 1º")],
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
        id: "requerimento",
        term: "Requerimento",
        voteKind: "voting",
        definition:
            "Pedido feito por um deputado ao presidente da Câmara ou ao Plenário. Alguns são decididos na hora pelo presidente. Outros precisam ser votados pelos deputados, por exemplo o pedido para votar um projeto com urgência.",
        seeAlso: ["urgencia"],
        sources: [chamberRules("arts. 114 e 117")],
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
        id: "royalties",
        term: "Royalties",
        definition:
            "Pagamento feito pelo uso de um bem natural. Em Itaipu, a usina paga royalties, em partes iguais, aos governos do Brasil e do Paraguai pelo uso da água do rio Paraná. O tratado fixa o valor em 650 dólares por gigawatt-hora gerado, com um mínimo anual.",
        seeAlso: ["anexo-c", "gigawatt-hora"],
        sources: [ITAIPU_TREATY],
    },
    {
        id: "sim",
        term: "Sim",
        voteChoice: "YES",
        voteKind: "vote",
        definition:
            "Voto a favor do que está sendo votado. Numa votação de destaque para manter o texto, o voto Sim mantém o trecho no texto.",
        seeAlso: ["nao", "destaque"],
        sources: [voteTermRules("art. 187, § 1º, VI")],
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
        id: "tarifa-de-repasse",
        term: "Tarifa de repasse",
        alsoKnownAs: "de Itaipu",
        definition:
            "O valor que as distribuidoras de energia do Sul, do Sudeste e do Centro-Oeste pagam pela energia de Itaipu a que têm direito. É fixada pela Aneel em dólares por quilowatt por mês e soma o Cuse que vale para o Brasil e o custo da energia que o Paraguai cede ao Brasil.",
        seeAlso: ["cuse", "cessao-de-energia"],
        sources: [ANEEL_ITAIPU_PASS_THROUGH_NEWS],
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
        id: "texto-principal",
        term: "Texto principal",
        voteKind: "voting",
        definition:
            "Votação do projeto (ou do texto que o substitui) em conjunto, antes dos destaques, que votam à parte os trechos separados. Uma proposta pode ter mais de um turno.",
        seeAlso: ["parte-do-texto", "turno"],
        sources: [voteTermRules("arts. 162, II, e 189")],
    },
    {
        id: "tratado-de-itaipu",
        term: "Tratado de Itaipu",
        definition:
            "Acordo entre o Brasil e o Paraguai, assinado em Brasília em 26 de abril de 1973 e em vigor desde 13 de agosto de 1973, para usar juntos a energia do rio Paraná. Criou a Itaipu Binacional, dividiu a energia em partes iguais e deu a cada país o direito de comprar a que o outro não usar.",
        seeAlso: ["anexo-c", "cessao-de-energia"],
        sources: [ITAIPU_TREATY],
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
    {
        id: "turno",
        term: "Turno",
        definition: "Cada rodada de votação de uma proposta. Uma proposta de emenda à Constituição (PEC), por exemplo, precisa ser votada em dois turnos na Câmara.",
        sources: [CONSTITUTION],
    },
    {
        id: "urgencia",
        term: "Urgência",
        definition:
            "Pedido para um projeto ser votado logo, sem esperar a sua vez na fila. Para valer, precisa ser aprovado pela maioria absoluta dos deputados (a metade mais um de todos os deputados, e não só dos que estão presentes).",
        seeAlso: ["requerimento"],
        sources: [chamberRules("art. 155")],
    },
    {
        id: "votacao-nominal",
        term: "Votação nominal",
        definition:
            "Votação em que cada deputado vota pelo nome, e o voto de cada um fica registrado e público. É usada, por exemplo, quando a regra pede mais votos para aprovar (quórum especial) ou quando o Plenário aceita o pedido de um deputado.",
        example: "O polar mostra as votações nominais, porque só nelas dá para ver como cada deputado votou.",
        seeAlso: ["votacao-simbolica"],
        sources: [chamberRules("arts. 184 e 186")],
    },
    {
        id: "votacao-simbolica",
        term: "Votação simbólica",
        definition:
            "Votação em que o presidente da sessão pede que os deputados a favor fiquem sentados e anuncia o resultado. Ninguém vota pelo nome, então o voto de cada deputado não fica registrado.",
        seeAlso: ["votacao-nominal"],
        sources: [chamberRules("art. 185")],
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