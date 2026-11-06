import type { RulerPage, Source } from "./types";

// content of the dilma rousseff page, written from the sources below on 2026-11-05, see docs/EDITORIAL.md
// press outlets are cited only where no official record was found, always two outlets with different editorial lines

const ACCESSED_ON = "2026-11-05";

function source(title: string, publisher: string, url: string): Source {
    return { title, publisher, url, accessedOn: ACCESSED_ON };
}

const ARQUIVO_NACIONAL_BIOGRAPHY = source(
    "Dilma Vana Rousseff, biografia",
    "Arquivo Nacional, Centro de Referência de Acervos Presidenciais",
    "https://presidentes.an.gov.br/index.php/centro-de-referencia-de-acervos-presidenciais/assuntos/biografias/205-dilma-vana-rousseff",
);
const MEMORIAS_DA_DITADURA = source("Dilma Rousseff", "Memórias da Ditadura (Instituto Vladimir Herzog)", "https://memoriasdaditadura.org.br/personagens/dilma-rousseff/");
const CAMARA_IMPEACHMENT_VOTE = source(
    "Câmara autoriza instauração de processo de impeachment de Dilma com 367 votos a favor e 137 contra",
    "Agência Câmara de Notícias",
    "https://www2.camara.leg.br/camaranoticias/noticias/POLITICA/507325-CAMARA-AUTORIZA-INSTAURACAO-DE-PROCESSO-DE-IMPEACHMENT-DE-DILMA-COM-367-VOTOS-A-FAVOR-E-137-CONTRA.html",
);
const CAMARA_IMPEACHMENT_FILE = source(
    "Denúncia por crime de responsabilidade 1/2015, ficha de tramitação",
    "Câmara dos Deputados",
    "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2057823",
);
const SENADO_FINAL_VOTE = source(
    "Dilma Rousseff perde o mandato de presidente da República, mas mantém direitos políticos",
    "Agência Senado",
    "https://www12.senado.leg.br/noticias/materias/2016/08/31/dilma-rousseff-perde-o-mandato-de-presidente-da-republica-mas-mantem-direitos-politicos",
);
const SENADO_YEAR_REVIEW = source(
    "Impeachment de Dilma Rousseff marca ano de 2016 no Congresso e no Brasil",
    "Agência Senado",
    "https://www12.senado.leg.br/noticias/materias/2016/12/28/impeachment-de-dilma-rousseff-marca-ano-de-2016-no-congresso-e-no-brasil",
);
const SENATE_RESOLUTION = source(
    "Resolução nº 35, de 2016",
    "Senado Federal",
    "https://www2.camara.leg.br/legin/fed/ressen/2016/resolucao-35-31-agosto-2016-783556-publicacaooriginal-151006-pl.html",
);
const IMPEACHMENT_LAW = source("Lei nº 1.079, de 1950 (crimes de responsabilidade)", "Planalto", "https://www.planalto.gov.br/ccivil_03/leis/l1079.htm");

function planaltoLaw(title: string, path: string): Source {
    return source(title, "Planalto", `https://www.planalto.gov.br/ccivil_03/${path}`);
}

export const DILMA_ROUSSEFF: RulerPage = {
    slug: "dilma-rousseff",
    grammaticalGender: "feminine",
    officeLabel: "Presidente de 2011 a 2016",
    civilName: "Dilma Vana Rousseff",
    partyAcronym: "PT",
    tags: ["Eleita pelo voto direto", "Saiu por impeachment"],
    summary:
        "Primeira mulher a presidir o Brasil. Foi eleita em 2010 e reeleita em 2014. Em 2016, o Senado tirou Dilma do cargo por [[crime-de-responsabilidade|crime de responsabilidade]], que é desrespeitar a Constituição ou as leis do orçamento. O Senado manteve o direito dela de se candidatar.",
    facts: {
        rows: [
            { label: "Nascimento", value: "14 de dezembro de 1947, em Belo Horizonte (MG)" },
            { label: "Formação", value: "Economia, na Universidade Federal do Rio Grande do Sul" },
            { label: "Partido no mandato", value: "PT (Partido dos Trabalhadores)" },
            { label: "Vice", value: "Michel Temer (PMDB), que assumiu a presidência em 2016" },
            { label: "Eleição de 2010", value: "Venceu José Serra (PSDB) no segundo turno" },
            { label: "Eleição de 2014", value: "Venceu Aécio Neves (PSDB) no segundo turno" },
            { label: "No cargo", value: "1º de janeiro de 2011 a 31 de agosto de 2016, afastada desde 12 de maio de 2016" },
        ],
        sources: [ARQUIVO_NACIONAL_BIOGRAPHY, SENATE_RESOLUTION],
    },
    before: [
        {
            when: "anos 60",
            statements: [
                {
                    text: "Ainda jovem, entra em organizações de esquerda contra a ditadura militar, como a Colina e a VAR-Palmares. Esses grupos defendiam a luta armada.",
                    sources: [ARQUIVO_NACIONAL_BIOGRAPHY, MEMORIAS_DA_DITADURA],
                },
            ],
        },
        {
            when: "1970",
            statements: [
                {
                    text: "É presa em São Paulo, em janeiro, aos 22 anos. Em depoimentos, contou que foi torturada na Operação Bandeirante (Oban). A Justiça Militar condenou Dilma, e ela ficou presa até o fim de 1972.",
                    sources: [MEMORIAS_DA_DITADURA, ARQUIVO_NACIONAL_BIOGRAPHY],
                },
            ],
        },
        {
            when: "1986",
            statements: [
                {
                    text: "Vira secretária da Fazenda de Porto Alegre. Depois, é secretária de Energia, Minas e Comunicações do Rio Grande do Sul.",
                    sources: [ARQUIVO_NACIONAL_BIOGRAPHY],
                },
            ],
        },
        {
            when: "2003",
            statements: [
                {
                    text: "Lula nomeia Dilma ministra de Minas e Energia. Ela também passa a presidir o conselho da Petrobras.",
                    sources: [ARQUIVO_NACIONAL_BIOGRAPHY],
                },
            ],
        },
        {
            when: "2005",
            statements: [
                {
                    text: "Vira ministra-chefe da [[casa-civil|Casa Civil]], o ministério que coordena o governo. Em 2010, Lula apoia Dilma como candidata à presidência.",
                    sources: [ARQUIVO_NACIONAL_BIOGRAPHY],
                },
            ],
        },
    ],
    policies: {
        intro: "Leis sancionadas no governo, com o número oficial de cada uma.",
        entries: [
            {
                when: "2011",
                statements: [
                    {
                        lead: "Lei de Acesso à Informação",
                        text: "(Lei 12.527/2011). Qualquer pessoa pode pedir dados ao governo.",
                        sources: [planaltoLaw("Lei nº 12.527, de 2011", "_ato2011-2014/2011/lei/l12527.htm")],
                    },
                    {
                        lead: "Comissão Nacional da Verdade",
                        text: "(Lei 12.528/2011). Investigou violações de direitos humanos, como as da ditadura.",
                        sources: [planaltoLaw("Lei nº 12.528, de 2011", "_ato2011-2014/2011/lei/l12528.htm")],
                    },
                ],
            },
            {
                when: "2012",
                statements: [
                    {
                        lead: "Lei de Cotas",
                        text: "(Lei 12.711/2012). Reserva vagas em universidades federais para estudantes de escola pública.",
                        sources: [planaltoLaw("Lei nº 12.711, de 2012", "_ato2011-2014/2012/lei/l12711.htm")],
                    },
                ],
            },
            {
                when: "2013",
                statements: [
                    {
                        lead: "Mais Médicos",
                        text: "(Lei 12.871/2013). Leva médicos, inclusive estrangeiros, para lugares com falta de atendimento.",
                        sources: [planaltoLaw("Lei nº 12.871, de 2013", "_ato2011-2014/2013/lei/l12871.htm")],
                    },
                    {
                        lead: "Lei Anticorrupção",
                        text: "(Lei 12.846/2013). Pune empresas que corrompem agentes públicos.",
                        sources: [planaltoLaw("Lei nº 12.846, de 2013", "_ato2011-2014/2013/lei/l12846.htm")],
                    },
                    {
                        lead: "Lei das Organizações Criminosas",
                        text: "(Lei 12.850/2013). Define as regras da [[delacao-premiada|delação premiada]], um acordo em que a pessoa acusada conta o que sabe em troca de uma pena menor. A delação foi usada depois na Operação Lava Jato.",
                        sources: [planaltoLaw("Lei nº 12.850, de 2013", "_ato2011-2014/2013/lei/l12850.htm")],
                    },
                ],
            },
            {
                when: "2014",
                statements: [
                    {
                        lead: "Marco Civil da Internet",
                        text: "(Lei 12.965/2014). Define direitos e deveres de quem usa a internet no Brasil.",
                        sources: [planaltoLaw("Lei nº 12.965, de 2014", "_ato2011-2014/2014/lei/l12965.htm")],
                    },
                ],
            },
            {
                when: "2015",
                statements: [
                    {
                        text: "A economia do país (o PIB) encolhe 3,5% em 2015 e mais 3,3% em 2016.",
                        sources: [
                            source(
                                "IBGE revisa PIB e economia teve queda menor que a anunciada em 2015: 3,5%",
                                "Agência Brasil",
                                "https://agenciabrasil.ebc.com.br/economia/noticia/2017-11/ibge-revisa-pib-e-economia-teve-queda-menor-que-anunciada-em-2015-35",
                            ),
                            source(
                                "Revisão do PIB de 2016 mostra queda de 3,3% em relação ao ano anterior",
                                "IBGE",
                                "https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/22966-revisao-do-pib-de-2016-mostra-queda-de-3-3-em-relacao-ao-ano-anterior",
                            ),
                        ],
                    },
                ],
            },
        ],
    },
    world: [
        {
            when: "2011",
            statements: [
                {
                    text: "É a primeira mulher a abrir os debates da Assembleia Geral da ONU.",
                    sources: [
                        source(
                            "Em discurso histórico na Assembleia Geral, Dilma Rousseff destaca papel de liderança global das mulheres",
                            "ONU Brasil",
                            "https://brasil.un.org/pt-br/57860-em-discurso-hist%C3%B3rico-na-assembleia-geral-dilma-rousseff-destaca-papel-de-lideran%C3%A7a-global",
                        ),
                    ],
                },
            ],
        },
        {
            when: "2013",
            statements: [
                {
                    text: "Documentos vazados mostram que a agência de espionagem dos Estados Unidos (NSA) monitorou comunicações de Dilma. Ela adia a visita de Estado que faria a Washington e critica a espionagem na ONU.",
                    sources: [
                        source(
                            "Discurso da Presidenta da República na abertura do Debate Geral da 68ª Assembleia Geral das Nações Unidas",
                            "Ministério das Relações Exteriores",
                            "https://www.gov.br/mre/pt-br/centrais-de-conteudo/publicacoes/discursos-artigos-e-entrevistas/presidente-da-republica/presidente-da-republica-federativa-do-brasil-discursos/dilma-vana-rousseff-2011-2016/discurso-da-presidenta-da-republica-dilma-rousseff-na-abertura-do-debate-geral-da-68-assembleia-geral-das-nacoes-unidas",
                        ),
                    ],
                },
            ],
        },
        {
            when: "2015",
            statements: [
                {
                    text: "Vai aos Estados Unidos em visita de trabalho e encontra o presidente Barack Obama.",
                    sources: [
                        source(
                            "Dilma anuncia ida aos EUA e indica que crise de espionagem foi superada",
                            "Agência Brasil",
                            "https://agenciabrasil.ebc.com.br/internacional/noticia/2015-04/dilma-anuncia-ida-aos-eua-e-indica-que-crise-de-espionagem-foi",
                        ),
                    ],
                },
            ],
        },
    ],
    opinion: {
        intro: "Quantas pessoas, em cada 100, acharam o governo \"ótimo ou bom\" nas pesquisas do Datafolha. Cada ponto é uma pesquisa.",
        points: [
            {
                label: "mar 2013",
                fieldworkDate: "2013-03-15",
                good: 65,
                sources: [source("Aprovação do governo Dilma cai pela primeira vez, diz Datafolha", "Exame (Reuters)", "https://exame.com/brasil/aprovacao-do-governo-dilma-cai-pela-primeira-vez-diz-datafolha/")],
            },
            {
                label: "jun 2013",
                fieldworkDate: "2013-06-07",
                good: 57,
                sources: [source("Aprovação do governo Dilma cai pela primeira vez, diz Datafolha", "Exame (Reuters)", "https://exame.com/brasil/aprovacao-do-governo-dilma-cai-pela-primeira-vez-diz-datafolha/")],
            },
            {
                label: "fim de jun 2013",
                fieldworkDate: "2013-06-28",
                good: 30,
                sources: [
                    source(
                        "Resposta de Dilma para resultado de pesquisa é trabalhar mais, diz Paulo Bernardo",
                        "Agência Brasil",
                        "https://memoria.ebc.com.br/agenciabrasil/noticia/2013-06-29/resposta-de-dilma-para-resultado-de-pesquisa-e-trabalhar-mais-diz-paulo-bernardo",
                    ),
                ],
            },
            {
                label: "mar 2015",
                fieldworkDate: "2015-03-15",
                good: 13,
                sources: [
                    source(
                        "Datafolha: 65% dos brasileiros reprovam governo Dilma e 10% aprovam",
                        "Agência Brasil",
                        "https://agenciabrasil.ebc.com.br/geral/noticia/2015-06/datafolha-65-dos-brasileiros-reprovam-governo-dilma-e-10-aprovam",
                    ),
                ],
            },
            {
                label: "jun 2015",
                fieldworkDate: "2015-06-15",
                good: 10,
                sources: [
                    source(
                        "Datafolha: 65% dos brasileiros reprovam governo Dilma e 10% aprovam",
                        "Agência Brasil",
                        "https://agenciabrasil.ebc.com.br/geral/noticia/2015-06/datafolha-65-dos-brasileiros-reprovam-governo-dilma-e-10-aprovam",
                    ),
                ],
            },
            {
                label: "ago 2015",
                fieldworkDate: "2015-08-05",
                good: 8,
                sources: [source("Aprovação do governo Dilma cai para 8%", "Agência Brasil", "https://agenciabrasil.ebc.com.br/politica/noticia/2015-08/aprovacao-do-governo-dilma-cai-para-8")],
            },
        ],
        note: "A queda de junho de 2013 aconteceu durante os grandes protestos daquele mês, que começaram contra o aumento das passagens de ônibus.",
    },
    cases: {
        intro: "Aqui entram só casos com um ato oficial contra Dilma, como uma investigação, uma denúncia ou um processo. Cada caso mostra em que etapa parou.",
        items: [
            {
                title: "Campanha de 2014 (chapa Dilma e Temer)",
                summary: [
                    {
                        text: "O PSDB pediu ao Tribunal Superior Eleitoral ([[tse|TSE]]) a [[cassacao|cassação]] da chapa, que é tirar o mandato de quem foi eleito, por abuso de poder político e econômico na eleição. Em junho de 2017, o TSE decidiu, por 4 votos a 3, não cassar.",
                        sources: [
                            source(
                                "Por 4 votos a 3, Plenário do TSE nega pedido de cassação da chapa Dilma e Temer",
                                "Tribunal Superior Eleitoral",
                                "https://www.tse.jus.br/comunicacao/noticias/2017/Junho/por-4-votos-a-3-plenario-do-tse-decide-pela-nao-cassacao-da-chapa-dilma-e-temer",
                            ),
                        ],
                    },
                ],
                steps: [
                    { stage: "investigation", year: 2014 },
                    { stage: "acquitted", year: 2017 },
                ],
                defense: null,
            },
            {
                title: "Denúncia por organização criminosa (\"quadrilhão do PT\")",
                summary: [
                    {
                        text: "Em 2017, a [[procuradoria-geral-da-republica|Procuradoria-Geral da República]], que é o órgão que acusa autoridades na Justiça, [[denuncia|denunciou]] Dilma, Lula e outros integrantes do PT. Dizia que eles formavam uma organização criminosa na Petrobras e em outros órgãos. Em 2019, o próprio Ministério Público pediu a absolvição, e a Justiça Federal do Distrito Federal absolveu todos antes do julgamento.",
                        sources: [
                            source("Lula, Dilma e Palocci são absolvidos no caso do 'quadrilhão do PT'", "Poder360", "https://www.poder360.com.br/justica/lula-dilma-e-palocci-sao-absolvidos-no-caso-do-quadrilhao-do-pt/"),
                            source(
                                "Juiz absolve Lula, Dilma, Palocci e Mantega em ação do \"quadrilhão do PT\"",
                                "Migalhas",
                                "https://www.migalhas.com.br/quentes/316506/juiz-absolve-lula--dilma--palocci-e-mantega-em-acao-do--quadrilhao-do-pt",
                            ),
                        ],
                    },
                ],
                steps: [
                    { stage: "charged", year: 2017 },
                    { stage: "defendant", year: 2018 },
                    { stage: "acquitted", year: 2019 },
                ],
                defense: {
                    text: "O juiz escreveu que a denúncia era uma tentativa de criminalizar a atividade política. As defesas diziam o mesmo.",
                    sources: [source("Lula, Dilma e Palocci são absolvidos no caso do 'quadrilhão do PT'", "Poder360", "https://www.poder360.com.br/justica/lula-dilma-e-palocci-sao-absolvidos-no-caso-do-quadrilhao-do-pt/")],
                },
            },
            {
                title: "Compra da refinaria de Pasadena (Petrobras)",
                summary: [
                    {
                        text: "Em 2006, o conselho da Petrobras, presidido por Dilma, aprovou a compra de metade de uma refinaria nos Estados Unidos. O Tribunal de Contas da União ([[tcu|TCU]]) calculou um prejuízo de 580 milhões de dólares.",
                        sources: [
                            source(
                                "TCU responsabiliza Conselho de Administração da Petrobras pela compra de Pasadena",
                                "Tribunal de Contas da União",
                                "https://portal.tcu.gov.br/imprensa/noticias/tcu-responsabiliza-conselho-de-administracao-da-petrobras-pela-compra-de-pasadena",
                            ),
                        ],
                    },
                    {
                        text: "Em 2017, o TCU passou a cobrar também os membros do conselho e bloqueou os bens de Dilma por um ano. Em 2021, o TCU decidiu que Dilma e os outros conselheiros não precisavam devolver o dinheiro, e condenou ex-diretores da empresa.",
                        sources: [
                            source(
                                "TCU responsabiliza Conselho de Administração da Petrobras pela compra de Pasadena",
                                "Tribunal de Contas da União",
                                "https://portal.tcu.gov.br/imprensa/noticias/tcu-responsabiliza-conselho-de-administracao-da-petrobras-pela-compra-de-pasadena",
                            ),
                            source("TCU absolve Dilma no caso da refinaria de Pasadena", "CNN Brasil", "https://www.cnnbrasil.com.br/nacional/tcu-absolve-dilma-no-caso-da-refinaria-de-pasadena/"),
                            source(
                                "TCU absolve Dilma por irregularidade na compra da refinaria de Pasadena",
                                "CartaCapital",
                                "https://www.cartacapital.com.br/politica/tcu-absolve-dilma-por-irregularidade-na-compra-da-refinaria-de-pasadena/",
                            ),
                        ],
                    },
                ],
                steps: [
                    { stage: "investigation", year: 2017 },
                    { stage: "acquitted", year: 2021 },
                ],
                defense: {
                    text: "Dilma disse que o conselho aprovou a compra com base em um parecer incompleto, que não mostrava duas cláusulas importantes do contrato.",
                    sources: [
                        source(
                            "TCU condena ex-diretores da Petrobras por prejuízo com Pasadena, mas inocenta Dilma",
                            "Agência Câmara de Notícias",
                            "https://www.camara.leg.br/noticias/438565-tcu-condena-ex-diretores-da-petrobras-por-prejuizo-com-pasadena-mas-inocenta-dilma/",
                        ),
                    ],
                },
            },
            {
                title: "Atrasos de pagamento a bancos públicos (\"pedaladas\")",
                summary: [
                    {
                        text: "Os mesmos atrasos do impeachment viraram uma investigação criminal e uma ação por [[improbidade-administrativa|improbidade]], que é o mau uso do cargo público. Em 2016, o Ministério Público Federal arquivou a investigação criminal: para o procurador, os atrasos não eram crime. Em 2023, o Tribunal Regional Federal da 1ª Região manteve o [[arquivamento|arquivamento]] da ação por improbidade.",
                        sources: [
                            source("Pedaladas fiscais do Plano Safra não são crime, diz MPF", "Consultor Jurídico", "https://conjur.com.br/2016-jul-15/pedaladas-fiscais-plano-safra-nao-sao-crime-mpf/"),
                            source("TRF-1 mantém arquivamento de ação contra Dilma Rousseff", "Agência Brasil", "https://agenciabrasil.ebc.com.br/justica/noticia/2023-08/trf-1-mantem-arquivamento-de-acao-contra-dilma"),
                        ],
                    },
                    {
                        text: "Esses arquivamentos não mudam o [[impeachment|impeachment]], que é um julgamento de outro tipo, feito pelo Senado.",
                        sources: [IMPEACHMENT_LAW],
                    },
                ],
                steps: [
                    { stage: "investigation", year: 2016 },
                    { stage: "closed", year: 2023 },
                ],
                defense: null,
            },
        ],
    },
    endOfTerm: {
        heading: "O impeachment, passo a passo",
        intro: {
            lead: "Impeachment",
            text: "é o processo em que o Congresso pode tirar o presidente do cargo por um crime de responsabilidade, que é uma infração contra a Constituição ou contra as leis do orçamento.",
            sources: [IMPEACHMENT_LAW],
        },
        entries: [
            {
                when: "dez 2015",
                statements: [
                    {
                        text: "Eduardo Cunha, presidente da Câmara, aceita o pedido de impeachment de Hélio Bicudo, Miguel Reale Júnior e Janaina Paschoal.",
                        sources: [CAMARA_IMPEACHMENT_FILE],
                    },
                ],
            },
            {
                when: "abr 2016",
                statements: [{ text: "A Câmara aprova a abertura do processo. Eram necessários 342 votos.", sources: [CAMARA_IMPEACHMENT_VOTE] }],
                vote: { yes: 367, no: 137, abstentions: 7, yesLabel: "a favor da abertura", noLabel: "contra" },
            },
            {
                when: "mai 2016",
                statements: [{ text: "O Senado aceita o processo. Dilma é afastada e o vice, Michel Temer, assume.", sources: [SENADO_YEAR_REVIEW] }],
            },
            {
                when: "ago 2016",
                statements: [
                    { text: "O Senado condena Dilma, e ela perde o cargo. Eram necessários 54 votos.", sources: [SENADO_FINAL_VOTE, SENATE_RESOLUTION] },
                ],
                vote: { yes: 61, no: 20, abstentions: 0, yesLabel: "pela condenação", noLabel: "contra" },
            },
            {
                when: "ago 2016",
                statements: [
                    {
                        text: "Em outra votação, o Senado manteve o direito de Dilma de se candidatar e ocupar cargos públicos. 42 senadores votaram para tirar esse direito, 36 contra e 3 se abstiveram. Eram necessários 54 votos.",
                        sources: [SENADO_FINAL_VOTE],
                    },
                ],
            },
        ],
        decided: [
            {
                text: "A acusação: decretos que liberaram gastos sem autorização do Congresso e atrasos nos pagamentos ao Banco do Brasil pelo [[plano-safra|Plano Safra]], o crédito do governo para agricultores, em 2015.",
                sources: [CAMARA_IMPEACHMENT_VOTE, SENATE_RESOLUTION],
            },
            {
                text: "O processo seguiu a Constituição e a Lei 1.079/1950. O Supremo Tribunal Federal definiu as regras do processo e não o anulou.",
                sources: [SENADO_YEAR_REVIEW, IMPEACHMENT_LAW],
            },
            {
                text: "Crime de responsabilidade não é crime comum. Quem julga é o Senado, num julgamento político e jurídico. Por isso, o arquivamento das ações criminais e de improbidade não muda o resultado.",
                sources: [IMPEACHMENT_LAW],
            },
        ],
        theses: [
            {
                heading: "Quem chama de golpe diz que:",
                holders: "Dilma, o PT, partidos aliados e parte dos juristas",
                arguments: [
                    "Os decretos e os atrasos não eram crime de responsabilidade.",
                    "Governos anteriores fizeram atrasos parecidos sem punição.",
                    "O motivo real foi político: o governo tinha perdido o apoio da maioria do Congresso.",
                ],
                sources: [SENADO_FINAL_VOTE],
            },
            {
                heading: "Quem defende o impeachment diz que:",
                holders: "Os autores do pedido, a maioria do Congresso e parte dos juristas",
                arguments: [
                    "A Constituição prevê o impeachment, e o Supremo validou as regras do processo.",
                    "Os decretos e os atrasos desrespeitaram a lei do orçamento e a Lei de Responsabilidade Fiscal.",
                    "Os atrasos de 2014 e 2015 foram muito maiores que os de governos anteriores.",
                ],
                sources: [SENADO_FINAL_VOTE],
            },
        ],
    },
    after: {
        entries: [
            {
                when: "2018",
                statements: [
                    {
                        text: "Concorre ao Senado por Minas Gerais e fica em 4º lugar, com 15,17% dos votos. Não é eleita.",
                        sources: [
                            source(
                                "Rodrigo Pacheco e Carlos Viana batem Dilma Rousseff e vão representar Minas no Senado",
                                "Agência Senado",
                                "https://www12.senado.leg.br/noticias/materias/2018/10/07/rodrigo-pacheco-e-carlos-viana-batem-dilma-rousseff-e-vao-representar-minas-no-senado",
                            ),
                        ],
                    },
                ],
            },
            {
                when: "2023",
                statements: [
                    {
                        text: "Passa a presidir o Novo Banco de Desenvolvimento, o banco do BRICS, em Xangai, na China, por indicação de Lula. Em 2025, é reconduzida por mais cinco anos.",
                        sources: [
                            source(
                                "Dilma continua à frente do Banco do Brics por mais 5 anos",
                                "Agência Brasil",
                                "https://agenciabrasil.ebc.com.br/internacional/noticia/2025-03/dilma-continua-frente-do-banco-do-brics-por-mais-5-anos",
                            ),
                        ],
                    },
                ],
            },
        ],
        money: [
            {
                label: "Reparação por perseguição na ditadura",
                figures: [{ value: "R$ 17.562,80", caption: "por mês, para o resto da vida" }],
                explanation: [
                    {
                        text: "O governo reconheceu Dilma como [[anistiado-politico|anistiada política]], que é a pessoa perseguida pela ditadura. Ela foi presa, foi torturada e perdeu o emprego na Fundação de Economia e Estatística do Rio Grande do Sul. Por isso, recebe uma reparação. Não é salário de ex-presidente.",
                        sources: [
                            planaltoLaw("Lei nº 10.559, de 2002 (Lei da Anistia)", "leis/2002/l10559.htm"),
                            source(
                                "Ministério dos Direitos Humanos fixa reparação mensal de R$ 17.562,80 a Dilma Rousseff e publica outras portarias de anistia",
                                "Atlas Público",
                                "https://atlaspublico.com.br/noticias/ministerio-dos-direitos-humanos-fixa-reparacao-mensal-de-rs-96901",
                            ),
                        ],
                    },
                    {
                        text: "A mesma lei vale para qualquer anistiado político. O valor mensal segue a média dos salários do cargo que ela tinha na fundação.",
                        sources: [planaltoLaw("Lei nº 10.559, de 2002 (Lei da Anistia)", "leis/2002/l10559.htm")],
                    },
                    {
                        text: "O valor foi definido pelo Ministério dos Direitos Humanos em outubro de 2026, para cumprir uma decisão do Tribunal Regional Federal da 1ª Região de dezembro de 2025.",
                        sources: [
                            source(
                                "Dilma terá reparação mensal de R$ 17,5 mil por perseguição na ditadura",
                                "Migalhas",
                                "https://www.migalhas.com.br/quentes/467339/dilma-tera-reparacao-mensal-de-r-17-5-mil-por-perseguicao-na-ditadura",
                            ),
                            source(
                                "Ministério dos Direitos Humanos fixa reparação mensal de R$ 17.562,80 a Dilma Rousseff e publica outras portarias de anistia",
                                "Atlas Público",
                                "https://atlaspublico.com.br/noticias/ministerio-dos-direitos-humanos-fixa-reparacao-mensal-de-rs-96901",
                            ),
                        ],
                    },
                    {
                        text: "Os valores atrasados, desde 1997, ainda serão calculados no processo judicial. Uma primeira [[portaria|portaria]], publicada em 27 de outubro de 2026, estimava R$ 6.616.492,19, mas foi substituída três dias depois.",
                        sources: [
                            source(
                                "Ministério dos Direitos Humanos fixa reparação mensal de R$ 17.562,80 a Dilma Rousseff e publica outras portarias de anistia",
                                "Atlas Público",
                                "https://atlaspublico.com.br/noticias/ministerio-dos-direitos-humanos-fixa-reparacao-mensal-de-rs-96901",
                            ),
                            source(
                                "Dilma terá reparação mensal de R$ 17,5 mil por perseguição na ditadura",
                                "Migalhas",
                                "https://www.migalhas.com.br/quentes/467339/dilma-tera-reparacao-mensal-de-r-17-5-mil-por-perseguicao-na-ditadura",
                            ),
                        ],
                    },
                ],
            },
            {
                label: "O que todo ex-presidente recebe",
                figures: [],
                explanation: [
                    {
                        text: "Ex-presidentes não recebem salário. A lei dá a cada um quatro servidores para segurança e apoio, dois carros oficiais com motoristas e dois assessores, pagos pelo governo federal.",
                        sources: [
                            planaltoLaw("Lei nº 7.474, de 1986", "leis/l7474.htm"),
                            planaltoLaw("Decreto nº 6.381, de 2008", "_ato2007-2010/2008/decreto/d6381.htm"),
                        ],
                    },
                ],
            },
        ],
    },
    trivia: [
        {
            text: "Dilma é a primeira mulher eleita para a presidência do Brasil.",
            sources: [ARQUIVO_NACIONAL_BIOGRAPHY],
        },
        {
            text: "Dilma pedia para ser chamada de \"presidenta\", a forma feminina da palavra. Os discursos e documentos oficiais do governo dela usam essa forma. A Constituição usa \"Presidente da República\" para qualquer pessoa no cargo.",
            sources: [
                source(
                    "Discursos da Presidenta",
                    "Biblioteca da Presidência da República",
                    "http://www.biblioteca.presidencia.gov.br/discursos/discursos-da-presidenta/discurso-da-presidenta-da-republica-dilma-rousseff-durante-coloquio-de-alto-nivel-sobre-participacao-politica-de-mulheres-nova-iorque-eua",
                ),
                planaltoLaw("Constituição Federal de 1988", "constituicao/constituicao.htm"),
            ],
        },
        {
            text: "Uma foto de novembro de 1970 mostra Dilma, aos 22 anos, numa audiência da Justiça Militar no Rio de Janeiro. Ao fundo, os militares cobrem o rosto com as mãos.",
            sources: [
                source(
                    "Militares escondem o rosto em audiência com Dilma Rousseff, 1970 (acervo Última Hora)",
                    "Arquivo Público do Estado de São Paulo, via Wikimedia Commons",
                    "https://commons.wikimedia.org/wiki/File:Militares_escondem_o_rosto_em_audi%C3%AAncia_com_Dilma_Rousseff_1970.jpg",
                ),
            ],
        },
        {
            text: "Em 2011, Dilma sancionou a lei que criou a Comissão Nacional da Verdade. Em 2014, recebeu o relatório final da comissão, que investigou crimes da ditadura que a prendeu.",
            sources: [planaltoLaw("Lei nº 12.528, de 2011", "_ato2011-2014/2011/lei/l12528.htm"), MEMORIAS_DA_DITADURA],
        },
    ],
    reviewedOn: "2026-11-05",
    contentFile: "src/db/src/rulers/dilmaRousseff.ts",
};