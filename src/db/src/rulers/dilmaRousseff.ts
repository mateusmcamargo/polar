import type { RulerPage, Source } from "./types";

// content of the dilma rousseff page, written from the sources below on 2026-11-05, see docs/EDITORIAL.md
// press outlets are cited only where no official record was found, always two outlets with different editorial lines

const ACCESSED_ON = "2026-11-05";
// sources added in the review of 2026-11-06
const ACCESSED_ON_REVIEW = "2026-11-06";

function source(title: string, publisher: string, url: string, accessedOn: string = ACCESSED_ON): Source {
    return { title, publisher, url, accessedOn };
}

function reviewSource(title: string, publisher: string, url: string): Source {
    return source(title, publisher, url, ACCESSED_ON_REVIEW);
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

const CONSTITUTION = planaltoLaw("Constituição Federal de 1988", "constituicao/constituicao.htm");

// official text read on 2026-11-06 from the copy of the DOU page saved by the maintainer (edition 205-E, extra, of 2026-10-30);
// the DOU page is titled by the first act of the edition (Portaria 2.994), and Portaria 3.004 is inside it
const PORTARIA_3004 = reviewSource(
    "Portaria nº 3.004, de 29 de outubro de 2026 (edição extra 205-E, de 30/10/2026)",
    "Diário Oficial da União",
    "https://www.in.gov.br/web/dou/-/portaria-n-2.994-de-27-de-outubro-de-2026-741178650",
);

// the file is on wikimedia commons as public domain (Brazilian photographs published before 1998 and not artistic);
// the original file also carries a note from the newspaper archive reserving the rights, see the review note of 2026-11-06
const HEARING_PHOTO_SOURCE = reviewSource(
    "Militares escondem o rosto em audiência com Dilma Rousseff, 1970 (acervo Última Hora)",
    "Arquivo Público do Estado de São Paulo, via Wikimedia Commons",
    "https://commons.wikimedia.org/wiki/File:Militares_escondem_o_rosto_em_audi%C3%AAncia_com_Dilma_Rousseff_1970.jpg",
);

// the arguments of each side of the impeachment, as reported by the Senate and Câmara news agencies
const DEFENSE_FINAL_SPEECH_SENATE = reviewSource(
    "Cardozo diz que denúncias contra Dilma foram derrubadas",
    "Agência Senado",
    "https://www12.senado.leg.br/noticias/materias/2016/08/10/cardozo-diz-que-denuncias-contra-dilma-foram-derrubadas",
);
const ACCUSATION_FINAL_SPEECH_SENATE = reviewSource(
    "Advogada acusa governo Dilma de fraudar contas públicas e criar ilusão",
    "Agência Senado",
    "https://www12.senado.leg.br/noticias/materias/2016/08/30/advogada-acusa-governo-dilma-de-fraudar-contas-publicas-e-criar-ilusao",
);
const FINAL_SPEECHES_CAMARA = reviewSource(
    "Defesa e acusação fazem discursos emotivos para convencer senadores",
    "Agência Câmara de Notícias",
    "https://www.camara.leg.br/noticias/497191-defesa-e-acusacao-fazem-discursos-emotivos-para-convencer-senadores",
);

// Datafolha polls, read in the news reports that give the dates, the number of interviews and the margin of error
const DATAFOLHA_2011_MARCH = reviewSource(
    "Datafolha de 15 e 16 de março de 2011: 47% de ótimo ou bom (3.767 entrevistas, margem de erro de 2 pontos)",
    "Datafolha, via Gazeta do Povo",
    "https://www.gazetadopovo.com.br/vida-publica/aprovacao-de-dilma-e-igual-a-de-lula-no-inicio-de-mandato-eou85qacjdaz15hyrbw0ndob2/",
);
const DATAFOLHA_2012_APRIL = reviewSource(
    "Datafolha de 18 e 19 de abril de 2012: 64% de ótimo ou bom (mais de 2.500 entrevistas, margem de erro de 2 pontos)",
    "Datafolha, via CartaCapital",
    "https://www.cartacapital.com.br/politica/governo-dilma-alcanca-64-de-aprovacao/",
);
const DATAFOLHA_2014_DECEMBER = reviewSource(
    "Datafolha de 2 e 3 de dezembro de 2014: 42% de ótimo ou bom (a matéria não informa o número de entrevistas)",
    "Datafolha, via Jornal Grande Bahia",
    "https://jornalgrandebahia.com.br/2014/12/pesquisa-datafolha-avalia-governo-de-dilma-rousseff/",
);
const DATAFOLHA_2015_FEBRUARY = reviewSource(
    "Datafolha de 3 a 5 de fevereiro de 2015: 23% de ótimo ou bom (4.000 entrevistas, margem de erro de 2 pontos)",
    "Datafolha, via Jornal da Nova",
    "https://jornaldanova.com.br/noticia/43181/aprovacao-de-dilma-cai-de-42-para-23-diz-datafolha",
);
const DATAFOLHA_2013_MARCH = reviewSource(
    "Datafolha de março de 2013, citada na pesquisa de junho: 65% de ótimo ou bom",
    "Datafolha, via Exame (Reuters)",
    "https://exame.com/brasil/aprovacao-do-governo-dilma-cai-pela-primeira-vez-diz-datafolha/",
);
const DATAFOLHA_2013_EARLY_JUNE = reviewSource(
    "Datafolha de 6 e 7 de junho de 2013: 57% de ótimo ou bom (3.758 entrevistas, margem de erro de 2 pontos)",
    "Datafolha, via Exame (Reuters)",
    "https://exame.com/brasil/aprovacao-do-governo-dilma-cai-pela-primeira-vez-diz-datafolha/",
);
const DATAFOLHA_2013_LATE_JUNE = reviewSource(
    "Datafolha de 27 e 28 de junho de 2013: 30% de ótimo ou bom (4.717 entrevistas, margem de erro de 2 pontos)",
    "Datafolha, via CartaCapital",
    "https://www.cartacapital.com.br/politica/datafolha-popularidade-de-dilma-cai-27-pontos-2334/",
);
const DATAFOLHA_2015_MARCH = reviewSource(
    "Datafolha de 16 e 17 de março de 2015: 13% de ótimo ou bom (2.842 entrevistas, margem de erro de 2 pontos)",
    "Datafolha, via Agência Brasil",
    "https://agenciabrasil.ebc.com.br/geral/noticia/2015-03/datafolha-62-reprovam-governo-dilma-indice-de-aprovacao-cai-para-13",
);
const DATAFOLHA_2015_JUNE = reviewSource(
    "Datafolha de 17 e 18 de junho de 2015: 10% de ótimo ou bom (2.840 entrevistas, margem de erro de 2 pontos)",
    "Datafolha, via Agência Brasil",
    "https://agenciabrasil.ebc.com.br/geral/noticia/2015-06/datafolha-65-dos-brasileiros-reprovam-governo-dilma-e-10-aprovam",
);
const DATAFOLHA_2015_AUGUST = reviewSource(
    "Datafolha de 4 e 5 de agosto de 2015: 8% de ótimo ou bom (3.358 entrevistas, margem de erro de 2 pontos)",
    "Datafolha, via Agência Brasil",
    "https://agenciabrasil.ebc.com.br/politica/noticia/2015-08/aprovacao-do-governo-dilma-cai-para-8",
);

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
                {
                    text: "Uma foto de novembro de 1970 mostra Dilma, aos 22 anos, numa audiência da Justiça Militar no Rio de Janeiro. Ao fundo, os militares cobrem o rosto com as mãos.",
                    sources: [HEARING_PHOTO_SOURCE],
                    image: {
                        file: "/rulers/dilma-rousseff-1970-audiencia.jpg",
                        width: 635,
                        height: 896,
                        alt: "Dilma Rousseff, aos 22 anos, sentada diante de uma mesa de audiência. Atrás dela, militares cobrem o rosto com as mãos.",
                        caption: "Dilma Rousseff em audiência da Justiça Militar, no Rio de Janeiro, em 17 de novembro de 1970.",
                        author: "Autor desconhecido (acervo Última Hora, Arquivo Público do Estado de São Paulo)",
                        license: "Domínio público",
                        sourceUrl: HEARING_PHOTO_SOURCE.url,
                        look: "old-print",
                    },
                },
            ],
        },
        {
            when: "1986",
            statements: [
                {
                    text: "Passa a ser secretária da Fazenda de Porto Alegre. Depois, é secretária de Energia, Minas e Comunicações do Rio Grande do Sul.",
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
                    text: "Passa a ser ministra-chefe da [[casa-civil|Casa Civil]], o ministério que coordena o governo. Em 2010, Lula apoia Dilma como candidata à presidência.",
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
                        text: "(Lei 12.850/2013). Define as regras da [[delacao-premiada|delação premiada]], um acordo em que a pessoa acusada conta o que sabe em troca de uma pena menor. Esse tipo de acordo foi muito usado depois na [[operacao-lava-jato|Operação Lava Jato]]: segundo uma especialista ouvida na Câmara dos Deputados, a operação teve mais de 120 acordos de colaboração premiada.",
                        sources: [
                            planaltoLaw("Lei nº 12.850, de 2013", "_ato2011-2014/2013/lei/l12850.htm"),
                            reviewSource(
                                "Juristas e deputados apontam erros e acertos da Operação Lava Jato, que completou dez anos",
                                "Agência Câmara de Notícias",
                                "https://www.camara.leg.br/noticias/1064913-juristas-e-deputados-apontam-erros-e-acertos-da-operacao-lava-jato-que-completou-dez-anos/",
                            ),
                        ],
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
        ],
    },
    economy: {
        intro: "Números oficiais do IBGE, o instituto de estatística do governo. Eles mostram o que aconteceu com a economia em cada ano, sem dizer qual foi a causa.",
        entries: [
            {
                when: "2013",
                statements: [
                    {
                        lead: "PIB.",
                        text: "É a soma de tudo o que o país produz em um ano. Em 2013, ela cresce 3,0%. Esse é o valor revisado pelo IBGE: antes, o número era 2,7%.",
                        sources: [
                            reviewSource(
                                "PIB cresce 3,0% em 2013 e chega a R$ 5,3 trilhões",
                                "IBGE",
                                "https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/9636-pib-cresce-3-0-em-2013-e-chega-a-r-5-3-trilhoes",
                            ),
                            reviewSource(
                                "IBGE aumenta PIB de 2012 e 2013 após revisão de metodologia",
                                "Agência Brasil",
                                "https://agenciabrasil.ebc.com.br/economia/noticia/2015-11/pib-cresce-3-em-2013-e-chega-r-53-trilhoes-diz-ibge",
                            ),
                        ],
                    },
                ],
            },
            {
                when: "2014",
                statements: [
                    {
                        lead: "PIB.",
                        text: "Cresce 0,5%. Esse é o valor revisado pelo IBGE: antes, o número era 0,1%.",
                        sources: [
                            reviewSource(
                                "PIB cresce 0,5% em 2014 chega a R$ 5,8 trilhões",
                                "IBGE",
                                "https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/9470-pib-cresce-0-5-em-2014-chega-a-r-5-8-trilhoes",
                            ),
                            reviewSource(
                                "Revisado, crescimento do PIB de 2014 passa de 0,1% para 0,5% e atinge R$ 5,8 tri",
                                "Agência Brasil",
                                "https://agenciabrasil.ebc.com.br/economia/noticia/2016-11/revisado-crescimento-do-pib-de-2014-passa-de-01-para-05-e-atinge-r-58-tri",
                            ),
                        ],
                    },
                    {
                        lead: "Inflação.",
                        text: "É o aumento geral dos preços, medido pelo IPCA. No ano, fica em 6,41%.",
                        sources: [
                            reviewSource(
                                "IPCA: inflação oficial fecha 2015 em 10,67%",
                                "Agência Brasil",
                                "https://agenciabrasil.ebc.com.br/economia/noticia/2016-01/ipca-inflacao-oficial-fecha-2015-em-maior-alta-desde",
                            ),
                        ],
                    },
                ],
            },
            {
                when: "2015",
                statements: [
                    {
                        lead: "PIB.",
                        text: "Encolhe 3,5%. Ou seja, o país produziu menos do que no ano anterior.",
                        sources: [
                            source(
                                "IBGE revisa PIB e economia teve queda menor que a anunciada em 2015: 3,5%",
                                "Agência Brasil",
                                "https://agenciabrasil.ebc.com.br/economia/noticia/2017-11/ibge-revisa-pib-e-economia-teve-queda-menor-que-anunciada-em-2015-35",
                            ),
                        ],
                    },
                    {
                        lead: "Inflação.",
                        text: "O IPCA chega a 10,67% no ano, a maior inflação desde 2002, ou seja, em 13 anos.",
                        sources: [
                            reviewSource(
                                "Em dezembro, IPCA fica em 0,96% e fecha 2015 em 10,67%",
                                "IBGE",
                                "https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/15413-em-dezembro-ipca-fica-em-0-96-e-fecha-2015-em-10-67",
                            ),
                            reviewSource(
                                "IPCA: inflação oficial fecha 2015 em 10,67%",
                                "Agência Brasil",
                                "https://agenciabrasil.ebc.com.br/economia/noticia/2016-01/ipca-inflacao-oficial-fecha-2015-em-maior-alta-desde",
                            ),
                        ],
                    },
                ],
            },
            {
                when: "2016",
                statements: [
                    {
                        lead: "PIB.",
                        text: "Encolhe mais 3,3%.",
                        sources: [
                            source(
                                "Revisão do PIB de 2016 mostra queda de 3,3% em relação ao ano anterior",
                                "IBGE",
                                "https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/22966-revisao-do-pib-de-2016-mostra-queda-de-3-3-em-relacao-ao-ano-anterior",
                            ),
                        ],
                    },
                    {
                        lead: "Inflação.",
                        text: "O IPCA fica em 6,29% no ano, 4,38 pontos abaixo do de 2015.",
                        sources: [
                            reviewSource(
                                "Em dezembro, IPCA sobe 0,30% e acumula 6,29% em 2016",
                                "IBGE",
                                "https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/9734-em-dezembro-ipca-sobe-0-30-e-acumula-6-29-em-2016",
                            ),
                            reviewSource(
                                "Inflação oficial fecha 2016 em 6,29%, abaixo do teto da meta, diz IBGE",
                                "Agência Brasil",
                                "https://agenciabrasil.ebc.com.br/economia/noticia/2017-01/inflacao-oficial-fecha-2016-em-629-dentro-do-teto-da-meta-diz-ibge",
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
                    text: "É a primeira mulher a abrir os debates da Assembleia Geral da [[onu|ONU]].",
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
                    text: "Em setembro, o governo adia a visita de Estado que Dilma faria a Washington, em outubro. A nota do Planalto diz que faltavam explicações sobre a interceptação de comunicações de cidadãos, empresas e membros do governo brasileiro, e o compromisso de parar com ela.",
                    sources: [
                        reviewSource(
                            "Dilma adia viagem oficial aos Estados Unidos",
                            "Agência Brasil",
                            "https://memoria.ebc.com.br/agenciabrasil/noticia/2013-09-17/dilma-adia-viagem-oficial-aos-estados-unidos",
                        ),
                    ],
                },
                {
                    text: "Na abertura da Assembleia Geral da ONU, Dilma diz que o Brasil está \"diante de um caso grave de violação dos direitos humanos e das liberdades civis\" e critica a espionagem dos Estados Unidos. É a posição dela, dita em um discurso, e não um documento que prove a espionagem.",
                    sources: [
                        reviewSource(
                            "Presidenta do Brasil abre 68ª sessão da Assembleia Geral das Nações Unidas, em Nova York",
                            "ONU Brasil",
                            "https://brasil.un.org/pt-br/63756-presidenta-do-brasil-abre-68%C2%AA-sess%C3%A3o-da-assembleia-geral-das-na%C3%A7%C3%B5es-unidas-em-nova-york",
                        ),
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
            { label: "mar 2011", fieldworkDate: "2011-03-16", good: 47, sources: [DATAFOLHA_2011_MARCH] },
            { label: "abr 2012", fieldworkDate: "2012-04-19", good: 64, sources: [DATAFOLHA_2012_APRIL] },
            { label: "mar 2013", fieldworkDate: "2013-03-15", good: 65, sources: [DATAFOLHA_2013_MARCH] },
            { label: "jun 2013", fieldworkDate: "2013-06-07", good: 57, sources: [DATAFOLHA_2013_EARLY_JUNE] },
            { label: "fim de jun 2013", fieldworkDate: "2013-06-28", good: 30, sources: [DATAFOLHA_2013_LATE_JUNE] },
            { label: "dez 2014", fieldworkDate: "2014-12-03", good: 42, sources: [DATAFOLHA_2014_DECEMBER] },
            { label: "fev 2015", fieldworkDate: "2015-02-05", good: 23, sources: [DATAFOLHA_2015_FEBRUARY] },
            { label: "mar 2015", fieldworkDate: "2015-03-17", good: 13, sources: [DATAFOLHA_2015_MARCH] },
            { label: "jun 2015", fieldworkDate: "2015-06-18", good: 10, sources: [DATAFOLHA_2015_JUNE] },
            { label: "ago 2015", fieldworkDate: "2015-08-05", good: 8, sources: [DATAFOLHA_2015_AUGUST] },
        ],
        note: "A queda de junho de 2013 aconteceu durante os grandes protestos daquele mês, que começaram contra o aumento das passagens de ônibus. A lista não traz todas as pesquisas do período: só entram as que tiveram o número conferido em uma fonte.",
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
                        text: "Em 2017, a [[procuradoria-geral-da-republica|Procuradoria-Geral da República]], que é o órgão que acusa autoridades na Justiça, [[denuncia|denunciou]] Dilma, Lula e outros integrantes do PT. Dizia que eles formavam uma organização criminosa na Petrobras e em outros órgãos. Em 2019, o próprio [[ministerio-publico|Ministério Público]] pediu a absolvição, e a Justiça Federal do Distrito Federal absolveu todos antes do julgamento.",
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
                        text: "Os mesmos atrasos do impeachment viraram uma investigação criminal e uma ação por [[improbidade-administrativa|improbidade]], que é o mau uso do cargo público. Em 2016, o [[ministerio-publico-federal|Ministério Público Federal]] arquivou a investigação criminal: para o procurador, os atrasos não eram crime. Em 2023, o [[tribunal-regional-federal|Tribunal Regional Federal]] da 1ª Região manteve o [[arquivamento|arquivamento]] da ação por improbidade.",
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
                    { text: "O Senado tira Dilma do cargo. Eram necessários 54 votos.", sources: [SENADO_FINAL_VOTE, SENATE_RESOLUTION] },
                ],
                vote: { yes: 61, no: 20, abstentions: 0, yesLabel: "pela perda do cargo", noLabel: "contra" },
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
                text: "O processo seguiu a Constituição e a Lei 1.079/1950. O [[supremo-tribunal-federal|Supremo Tribunal Federal]] definiu as regras do processo e não o anulou.",
                sources: [SENADO_YEAR_REVIEW, IMPEACHMENT_LAW],
            },
            {
                text: "Crime de responsabilidade não é crime comum. Quem julga é o Senado, num julgamento político e jurídico. As ações criminais e as de improbidade correm na Justiça, por regras diferentes.",
                sources: [IMPEACHMENT_LAW, CONSTITUTION],
            },
        ],
        theses: [
            {
                heading: "Quem diz que foi golpe:",
                holders: "A defesa de Dilma, feita no Senado pelo advogado José Eduardo Cardozo",
                arguments: [
                    "Os decretos não afetaram a meta fiscal de 2015, que só é conferida no fim do ano.",
                    "Os atrasos nos pagamentos aos bancos públicos eram procedimentos operacionais que os governos anteriores também faziam.",
                    "O pedido foi um pretexto: o golpe teria sido armado por Eduardo Cunha, então presidente da Câmara.",
                ],
                sources: [DEFENSE_FINAL_SPEECH_SENATE, FINAL_SPEECHES_CAMARA],
            },
            {
                heading: "Quem diz que foi um processo legal:",
                holders: "Os autores do pedido, os advogados Janaína Paschoal e Miguel Reale Júnior",
                arguments: [
                    "Os decretos foram feitos em desacordo com a meta fiscal e sem autorização do Congresso.",
                    "Usar dinheiro de bancos públicos para pagar programas do governo, sem registrar, é proibido pela [[lei-de-responsabilidade-fiscal|Lei de Responsabilidade Fiscal]].",
                    "Os valores e a ousadia dos atrasos do governo Dilma foram maiores que os de antes.",
                ],
                sources: [ACCUSATION_FINAL_SPEECH_SENATE, FINAL_SPEECHES_CAMARA],
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
                        text: "Passa a presidir o Novo Banco de Desenvolvimento, o banco do [[brics|BRICS]], em Xangai, na China, por indicação de Lula. Em 2025, é reconduzida por mais cinco anos.",
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
                        text: "O governo reconheceu Dilma como [[anistiado-politico|anistiada política]], que é a pessoa perseguida pela ditadura. Ela foi presa, contou que foi torturada e perdeu o emprego na Fundação de Economia e Estatística do Rio Grande do Sul. Por isso, recebe uma reparação. Não é salário de ex-presidente.",
                        sources: [planaltoLaw("Lei nº 10.559, de 2002 (Lei da Anistia)", "leis/2002/l10559.htm"), PORTARIA_3004],
                    },
                    {
                        text: "A mesma lei vale para qualquer anistiado político. O valor mensal segue a média dos salários do cargo que ela tinha na fundação.",
                        sources: [planaltoLaw("Lei nº 10.559, de 2002 (Lei da Anistia)", "leis/2002/l10559.htm"), PORTARIA_3004],
                    },
                    {
                        text: "O valor foi definido pelo Ministério dos Direitos Humanos em outubro de 2026, para cumprir uma decisão do Tribunal Regional Federal da 1ª Região de dezembro de 2025.",
                        sources: [
                            PORTARIA_3004,
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
                        text: "O valor mensal consta da Portaria nº 3.004, de 29 de outubro de 2026, publicada em edição extra do [[diario-oficial-da-uniao|Diário Oficial da União]] em 30 de outubro. Ela anulou a Portaria nº 2.931, de 21 de outubro, publicada em 27 de outubro. O texto oficial chama o pagamento de reparação econômica, de caráter indenizatório, em prestação mensal, permanente e continuada.",
                        sources: [PORTARIA_3004],
                    },
                    {
                        text: "Os valores atrasados, desde 1997, serão calculados e pagos só no processo judicial. A primeira [[portaria|portaria]] estimava R$ 6.616.492,19 em atrasados, mas foi anulada três dias depois pela segunda.",
                        sources: [
                            PORTARIA_3004,
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
            text: "Em 2011, Dilma sancionou a lei que criou a Comissão Nacional da Verdade. Em 2014, recebeu o relatório final da comissão, que investigou crimes da ditadura que a prendeu.",
            sources: [planaltoLaw("Lei nº 12.528, de 2011", "_ato2011-2014/2011/lei/l12528.htm"), MEMORIAS_DA_DITADURA],
        },
    ],
    reviewedOn: "2026-11-06",
    contentFile: "src/db/src/rulers/dilmaRousseff.ts",
};