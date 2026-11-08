// Usina de Itaipu: every figure below was read on the pages linked in the sources on 2026-11-07, see docs/EDITORIAL.md
// texts may mark glossary terms as [[id|shown text]], see glossary.ts

import type { Source, Sources } from "../editorial";
import type { MarcoPage } from "./types";

const ACCESSED_ON = "2026-11-07";

function itaipu(title: string, url: string): Source {
    return { title, publisher: "Itaipu Binacional", url, accessedOn: ACCESSED_ON };
}

const HISTORY = itaipu("Nossa história", "https://www.itaipu.gov.br/institucional/sobre-itaipu/nossa-historia");
const GENERATION = itaipu("Geração", "https://www.itaipu.gov.br/energia/geracao");
const DAM = itaipu("Barragem", "https://www.itaipu.gov.br/energia/barragem");
const ANNUAL_REPORT_NEWS = itaipu(
    "Relatório Anual 2025 da Itaipu destaca eficiência técnica, equilíbrio financeiro e avanços sociais",
    "https://www.itaipu.gov.br/noticias/sala-de-imprensa/relatorio-anual-2025-da-itaipu-destaca-eficiencia-tecnica-equilibrio-financeiro-e-avancos-sociais",
);
const TARIFF_2023_NEWS = itaipu("Itaipu define tarifa para exercício de 2023", "https://www.itaipu.gov.br/noticias/sala-de-imprensa/itaipu-define-tarifa-para-exercicio-de-2023");
const TARIFF_FALL_NEWS = itaipu(
    "Tarifa de energia da Itaipu cai 26% e alcança o menor patamar em duas décadas",
    "https://www.itaipu.gov.br/noticias/sala-de-imprensa/tarifa-de-energia-da-itaipu-cai-26-e-alcanca-o-menor-patamar-em-duas-decadas",
);
const TREATY: Source = {
    title: "Decreto nº 72.707, de 28 de agosto de 1973 (promulga o Tratado de Itaipu e seus anexos)",
    publisher: "Planalto",
    url: "https://www.planalto.gov.br/ccivil_03/decreto/antigos/d72707.htm",
    accessedOn: ACCESSED_ON,
};
const ENBPAR: Source = {
    title: "ITAIPU",
    publisher: "ENBPar",
    url: "https://enbpar.gov.br/areas-de-atuacao/comercializacao-de-energia/itaipu/",
    accessedOn: ACCESSED_ON,
};
const MME_2024: Source = {
    title: "Brasil e Paraguai fecham acordo estrutural para tarifas de Itaipu",
    publisher: "Ministério de Minas e Energia",
    url: "https://www.gov.br/mme/pt-br/assuntos/noticias/2023-2026/brasil-e-paraguai-fecham-acordo-estrutural-para-tarifas-de-itaipu",
    accessedOn: ACCESSED_ON,
};
const ANEEL_2026: Source = {
    title: "Tarifa de Repasse da usina Itaipu para 2026 é aprovada pela ANEEL",
    publisher: "Agência Nacional de Energia Elétrica",
    url: "https://www.gov.br/aneel/pt-br/assuntos/noticias/2025/tarifa-de-repasse-da-usina-itaipu-para-2026-e-aprovada-pela-aneel",
    accessedOn: ACCESSED_ON,
};
const SENATE_BILL_APPROVED: Source = {
    title: "Avança projeto que fixa preço máximo para energia de Itaipu",
    publisher: "Agência Senado",
    url: "https://www12.senado.leg.br/noticias/materias/2025/11/25/avanca-projeto-que-fixa-preco-maximo-para-energia-de-itaipu",
    accessedOn: ACCESSED_ON,
};
const SENATE_HEARING_NOTICE: Source = {
    title: "Comissão de Infraestrutura debate limite para preço da energia de Itaipu",
    publisher: "Agência Senado",
    url: "https://www12.senado.leg.br/noticias/materias/2025/10/24/comissao-de-infraestrutura-debate-limite-para-preco-da-energia-de-itaipu",
    accessedOn: ACCESSED_ON,
};

// one point per year, so the table of the chart lists every year
function yearly(first: number, last: number, value: number): { year: number; value: number }[] {
    return Array.from({ length: last - first + 1 }, (_, index) => ({ year: first + index, value }));
}

const FROM_HISTORY: Sources = [HISTORY];
const FROM_GENERATION: Sources = [GENERATION];
const FROM_TREATY: Sources = [TREATY];
const FROM_ANNUAL_REPORT: Sources = [ANNUAL_REPORT_NEWS];

export const ITAIPU: MarcoPage = {
    slug: "usina-de-itaipu",
    kind: "work",
    kicker: "Grande obra · Energia",
    name: "Usina de Itaipu",
    tags: ["Rio Paraná", "Brasil e Paraguai", "Hidrelétrica"],
    summary:
        "Itaipu é a usina hidrelétrica do rio Paraná, em Foz do Iguaçu (PR), na divisa com o Paraguai. Ela pertence aos dois países em partes iguais, desde o [[tratado-de-itaipu|Tratado de Itaipu]], de 1973. A primeira das 20 unidades geradoras começou a funcionar em 1984. Em 2025, a usina produziu 72.879 [[gigawatt-hora|GWh]] e atendeu 87,6% do consumo de energia do Paraguai.",
    facts: {
        rows: [
            { label: "Onde fica", value: "Rio Paraná, em Foz do Iguaçu (PR), na divisa entre o Brasil e o Paraguai" },
            {
                label: "Quem é a dona",
                value: "Itaipu Binacional, criada pelo Tratado de 26 de abril de 1973. O Brasil e o Paraguai dividem igualmente a administração e o direito de comprar a energia",
            },
            { label: "Potência instalada", value: "14.000 megawatts, em 20 unidades geradoras" },
            { label: "Barragem", value: "7.919 metros de extensão e até 196 metros de altura, com 12,3 milhões de metros cúbicos de concreto" },
            { label: "Obras", value: "De 1974, com a chegada das primeiras máquinas, a 1984, quando a primeira unidade entrou em operação" },
            { label: "Situação", value: "Em operação" },
        ],
        sources: [HISTORY, GENERATION, DAM, ENBPAR],
    },
    numbers: {
        intro: "Os números da usina, como a Itaipu os publica.",
        figures: [
            { value: "103.098 GWh", caption: "foi a maior produção em um ano, em 2016", sources: FROM_GENERATION },
            { value: "72.879 GWh", caption: "foram produzidos em 2025, 8,9% a mais que em 2024", sources: FROM_ANNUAL_REPORT },
            { value: "3.124.679 GWh", caption: "foram produzidos de 1984 até hoje", sources: FROM_GENERATION },
            { value: "87,6%", caption: "do consumo de energia do Paraguai foi atendido por Itaipu em 2025", sources: [GENERATION, ANNUAL_REPORT_NEWS] },
            { value: "40 mil", caption: "trabalhadores no canteiro de obras, no auge da construção da barragem", sources: FROM_HISTORY },
        ],
        generation: {
            intro: "Cada barra é a energia que a usina produziu em um ano, em [[gigawatt-hora|gigawatts-hora]] (GWh).",
            points: [
                { year: 1984, gigawattHours: 277 },
                { year: 1985, gigawattHours: 6327 },
                { year: 1986, gigawattHours: 21853 },
                { year: 1987, gigawattHours: 35807 },
                { year: 1988, gigawattHours: 35508 },
                { year: 1989, gigawattHours: 47230 },
                { year: 1990, gigawattHours: 53090 },
                { year: 1991, gigawattHours: 57518 },
                { year: 1992, gigawattHours: 52268 },
                { year: 1993, gigawattHours: 59997 },
                { year: 1994, gigawattHours: 69394 },
                { year: 1995, gigawattHours: 77212 },
                { year: 1996, gigawattHours: 81654 },
                { year: 1997, gigawattHours: 89237 },
                { year: 1998, gigawattHours: 87846 },
                { year: 1999, gigawattHours: 90002 },
                { year: 2000, gigawattHours: 93428 },
                { year: 2001, gigawattHours: 79307 },
                { year: 2002, gigawattHours: 82914 },
                { year: 2003, gigawattHours: 89151 },
                { year: 2004, gigawattHours: 89912 },
                { year: 2005, gigawattHours: 87971 },
                { year: 2006, gigawattHours: 92690 },
                { year: 2007, gigawattHours: 90620 },
                { year: 2008, gigawattHours: 94685 },
                { year: 2009, gigawattHours: 91652 },
                { year: 2010, gigawattHours: 85970 },
                { year: 2011, gigawattHours: 92246 },
                { year: 2012, gigawattHours: 98287 },
                { year: 2013, gigawattHours: 98630 },
                { year: 2014, gigawattHours: 87795 },
                { year: 2015, gigawattHours: 89215 },
                { year: 2016, gigawattHours: 103098 },
                { year: 2017, gigawattHours: 96387 },
                { year: 2018, gigawattHours: 96586 },
                { year: 2019, gigawattHours: 79445 },
                { year: 2020, gigawattHours: 76352 },
                { year: 2021, gigawattHours: 66369 },
                { year: 2022, gigawattHours: 69873 },
                { year: 2023, gigawattHours: 83879 },
                { year: 2024, gigawattHours: 67089 },
                { year: 2025, gigawattHours: 72879 },
            ],
            highlightYear: 2016,
            note: "A primeira unidade entrou em operação em maio de 1984, e a venda de energia começou em março de 1985. A página de geração da Itaipu mostra 103.089 GWh no destaque do recorde e 103.098 GWh na tabela e no texto. A plataforma usa 103.098.",
            sources: FROM_GENERATION,
        },
    },
    timeline: [
        {
            when: "22 jun 1966",
            statements: [
                {
                    text: "Os ministros das Relações Exteriores do Brasil, Juracy Magalhães, e do Paraguai, Sapena Pastor, assinam a Ata do Iguaçu. Os dois países dizem que vão estudar juntos o uso do rio Paraná, do Salto de Sete Quedas até a foz do rio Iguaçu.",
                    sources: FROM_HISTORY,
                },
            ],
        },
        {
            when: "26 abr 1973",
            statements: [
                {
                    text: "Brasil e Paraguai assinam em Brasília o [[tratado-de-itaipu|Tratado de Itaipu]]. Ele entra em vigor em 13 de agosto de 1973, com a troca dos documentos de ratificação em Assunção.",
                    sources: FROM_TREATY,
                },
            ],
        },
        {
            when: "mai 1974",
            statements: [
                {
                    text: "É criada a Itaipu Binacional, que gerencia a construção da usina. No mesmo ano chegam ao canteiro de obras as primeiras máquinas.",
                    sources: FROM_HISTORY,
                },
            ],
        },
        {
            when: "20 out 1978",
            statements: [
                {
                    text: "O rio Paraná é desviado. Cinquenta e oito toneladas de dinamite explodem as duas ensecadeiras, barreiras provisórias que protegiam o novo canal. O desvio tem 2 km de extensão, 150 metros de largura e 90 de profundidade.",
                    sources: FROM_HISTORY,
                },
            ],
        },
        {
            when: "14 nov 1978",
            statements: [
                {
                    text: "Em um único dia, 7.207 metros cúbicos de concreto são lançados na barragem, um recorde da América do Sul, segundo a Itaipu.",
                    sources: FROM_HISTORY,
                },
            ],
        },
        {
            when: "out 1982",
            statements: [
                {
                    text: "As obras da barragem terminam e o reservatório começa a encher. O lago leva 14 dias para se formar e ocupa 135 mil hectares. As Sete Quedas ficam debaixo d'água. Na margem brasileira, 8.519 propriedades urbanas e rurais são alagadas, e os donos são indenizados.",
                    sources: FROM_HISTORY,
                },
            ],
        },
        {
            when: "5 nov 1982",
            statements: [
                {
                    text: "Os presidentes João Figueiredo, do Brasil, e Alfredo Stroessner, do Paraguai, acionam a abertura das 14 comportas do vertedouro e inauguram oficialmente a usina.",
                    sources: FROM_HISTORY,
                },
            ],
        },
        {
            when: "1983 e 1984",
            statements: [
                {
                    text: "Em 17 de dezembro de 1983 há o primeiro giro mecânico de uma turbina. Em 5 de maio de 1984 entra em operação a primeira das 20 unidades geradoras. A venda de energia começa em 1º de março de 1985.",
                    sources: FROM_HISTORY,
                },
            ],
        },
        {
            when: "28 fev 2023",
            statements: [
                {
                    text: "A dívida de construção da usina é quitada. Segundo a Itaipu, o pagamento total foi de US$ 63,5 bilhões.",
                    sources: [TARIFF_2023_NEWS],
                },
            ],
        },
        {
            when: "7 mai 2024",
            statements: [
                {
                    text: "O ministro de Minas e Energia, Alexandre Silveira, e o presidente do Paraguai, Santiago Peña, fecham o acordo sobre a tarifa de Itaipu até 2026 e antecipam a negociação do [[anexo-c|Anexo C]].",
                    sources: [MME_2024],
                },
            ],
        },
    ],
    decided: {
        intro: "Itaipu é decidida pelos dois governos. Estes são os nomes que as fontes oficiais citam.",
        items: [
            {
                statement: {
                    text: "O Tratado de Itaipu foi assinado pelos presidentes Emílio Garrastazu Médici, do Brasil, e Alfredo Stroessner, do Paraguai.",
                    sources: FROM_HISTORY,
                },
                rulerSlug: "emilio-medici",
            },
            {
                statement: {
                    text: "A usina foi inaugurada, em 5 de novembro de 1982, pelos presidentes João Figueiredo e Alfredo Stroessner.",
                    sources: FROM_HISTORY,
                },
                rulerSlug: "joao-figueiredo",
            },
            {
                statement: {
                    text: "Em 2023, o Conselho de Administração da Itaipu, com seis conselheiros de cada país, decidiu o novo custo da energia da usina (o Cuse): US$ 16,71 por quilowatt.",
                    sources: [TARIFF_2023_NEWS],
                },
            },
            {
                statement: {
                    text: "Em 7 de maio de 2024, o ministro Alexandre Silveira e o presidente Santiago Peña fecharam o acordo sobre a tarifa até 2026.",
                    sources: [MME_2024],
                },
            },
        ],
    },
    agreement: {
        title: "Acordo entre Brasil e Paraguai",
        intro: "Itaipu é dos dois países em partes iguais. O tratado dá a cada um o direito de comprar a energia que o outro não usar, e quem cede essa energia recebe uma [[cessao-de-energia|remuneração]]. Em 2025, a Itaipu colocou à disposição do mercado paraguaio menos da metade da energia, e do mercado brasileiro, mais da metade.",
        split: {
            year: 2025,
            unit: "MW médios",
            firstCountry: { name: "Brasil", supplied: 5329 },
            secondCountry: { name: "Paraguai", supplied: 2942 },
            note: "As barras mostram a energia que a Itaipu colocou à disposição de cada mercado em 2025, em [[mw-medio|MW médios]]. A linha marca a metade que o tratado garante a cada país. Os percentuais e a diferença são calculados com os números da Itaipu.",
            sources: FROM_GENERATION,
        },
        rules: [
            {
                when: "Art. XIII",
                statements: [
                    {
                        text: "A energia produzida é dividida em partes iguais entre os dois países, e cada um tem o direito de comprar a energia que o outro não usar para o próprio consumo. Os dois países se comprometem a comprar, juntos ou separados, toda a potência instalada.",
                        sources: FROM_TREATY,
                    },
                ],
            },
            {
                when: "Art. XIV",
                statements: [
                    {
                        text: "A compra da energia é feita pelas empresas dos dois governos: do lado brasileiro, a Eletrobras na época do tratado e, desde 2022, a ENBPar; do lado paraguaio, a ANDE.",
                        sources: [TREATY, ENBPAR],
                    },
                ],
            },
            {
                when: "Anexo C, III.8",
                statements: [
                    {
                        text: "O país que cede energia ao outro recebe 300 dólares por gigawatt-hora cedido. O valor é pago pela própria usina e entra no custo do serviço.",
                        sources: FROM_TREATY,
                    },
                ],
            },
            {
                when: "Anexo C, VI",
                statements: [
                    {
                        text: "As regras financeiras do Anexo C devem ser revistas depois de 50 anos da entrada em vigor do tratado, ou seja, a partir de agosto de 2023. A revisão deve considerar, entre outros pontos, quanto da dívida foi paga e a relação entre a potência que cada país contratou.",
                        sources: FROM_TREATY,
                    },
                ],
            },
            {
                when: "2025",
                statements: [
                    {
                        text: "A Itaipu pagou ao Paraguai US$ 165,1 milhões de remuneração por cessão de energia. Na tarifa de repasse que as distribuidoras brasileiras pagam, o custo da energia cedida ao Brasil é de US$ 0,95 por quilowatt por mês, 5,38% da tarifa.",
                        sources: [ANNUAL_REPORT_NEWS, ANEEL_2026],
                    },
                ],
            },
            {
                when: "7 mai 2024",
                statements: [
                    {
                        text: "Brasil e Paraguai combinam que, depois de 2026, toda a energia que o Paraguai usa deve estar contratada, e que a energia excedente do lado paraguaio poderá ser vendida no mercado livre brasileiro (onde quem consome escolhe de quem comprar) a partir de 2027.",
                        sources: [MME_2024],
                    },
                ],
            },
        ],
        divergence: [
            {
                lead: "Quanto Itaipu atendeu do Brasil em 2025.",
                text: "A tabela de mercados da página de geração da Itaipu mostra 8,0%. O comunicado do Relatório Anual 2025 fala em 6,7%. Os dois números são da Itaipu, e a plataforma não escolhe entre eles. Para o Paraguai, os dois dizem 87,6%.",
                sources: [GENERATION, ANNUAL_REPORT_NEWS],
            },
        ],
        open: [
            {
                lead: "A revisão do Anexo C.",
                text: "O acordo de maio de 2024 previa concluir a negociação até 31 de dezembro de 2024 e levá-la ao Congresso. Esta página não encontrou, em fonte oficial, o texto de uma revisão concluída, e a Aneel, agência que regula a energia elétrica, aprovou para 2026 a mesma tarifa de repasse de 2024.",
                sources: [MME_2024, ANEEL_2026],
            },
        ],
    },
    money: {
        intro: "Os valores são em dólares, como o tratado determina.",
        works: [
            {
                lead: "Quanto custou a obra.",
                text: "Cerca de US$ 14 bilhões, ou aproximadamente US$ 1.000 por quilowatt instalado. Com os juros e a inflação em dólar do período, o valor chega a US$ 16 bilhões, segundo a Itaipu.",
                sources: FROM_HISTORY,
            },
            {
                lead: "Quem financiou.",
                text: "O governo brasileiro ficou responsável por obter os recursos, com crédito de curto prazo de bancos privados e de bancos estatais estrangeiros. A dívida foi quitada em 2023, com um pagamento total de US$ 63,5 bilhões, segundo a Itaipu.",
                sources: [HISTORY, TARIFF_2023_NEWS],
            },
        ],
        revenue: {
            intro: "Para onde foi o faturamento de 2025: o que a Itaipu pagou aos dois governos (os [[royalties]], pelo uso da água do rio, e a remuneração pela energia cedida) e o resto do custo do serviço.",
            year: 2025,
            total: 3023.0,
            totalLabel: "Faturamento de 2025, cobrado da ENBPar e da ANDE",
            rows: [
                { label: "Royalties ao Brasil", amount: 246.5, explanation: "Pagos ao governo do Brasil pelo uso da água do rio." },
                { label: "Royalties ao Paraguai", amount: 246.5, explanation: "Pagos ao governo do Paraguai pelo uso da água do rio." },
                { label: "Remuneração por cessão de energia", amount: 165.1, explanation: "Paga ao Paraguai pela energia que ele cede ao outro país." },
                {
                    label: "Demais custos e resultado do ano",
                    amount: 2364.9,
                    explanation: "Operação, manutenção, administração, projetos socioambientais e o resultado do ano. Calculado: faturamento menos as três linhas acima.",
                    calculated: true,
                },
            ],
            note: "A Itaipu fechou 2025 com superávit de US$ 134,0 milhões, ou seja, sobrou esse valor depois de cobrir os custos do ano. Percentuais arredondados.",
            sources: FROM_ANNUAL_REPORT,
        },
        tariff: {
            intro: "O [[cuse|Cuse]] é o custo da energia de Itaipu, em dólares por quilowatt de potência contratada por mês.",
            series: [
                {
                    label: "Cuse",
                    line: "solid",
                    points: [...yearly(2009, 2021, 22.6), { year: 2022, value: 20.75 }, { year: 2023, value: 16.71 }, ...yearly(2024, 2026, 19.28)],
                },
                {
                    label: "Valor aplicado ao Brasil",
                    line: "dashed",
                    points: yearly(2023, 2026, 16.71),
                },
            ],
            note: "De 2009 a 2021 o Cuse ficou em US$ 22,60. De 2024 a 2026 ele é US$ 19,28, mas o valor aplicado ao consumidor brasileiro é US$ 16,71. A diferença, US$ 2,57, é coberta pela Itaipu, que aprovou US$ 285 milhões para isso em 2026. A [[tarifa-de-repasse|tarifa de repasse]], paga pelas distribuidoras, soma os US$ 16,71 e US$ 0,95 da energia cedida: US$ 17,66.",
            sources: [TARIFF_FALL_NEWS, TARIFF_2023_NEWS, MME_2024, ANEEL_2026],
        },
    },
    theses: {
        intro: "O preço que o Brasil paga pela energia de Itaipu é discutido no Senado. Cada leitura tem o nome de quem a defende e as próprias fontes.",
        pair: [
            {
                heading: "Quem diz que o preço pago pelo Brasil deve ter um teto:",
                holders: "Senador Esperidião Amin (PP-SC), autor do PL 1.830/2025, e senador Laércio Oliveira (PP-SE), relator, em 25 de novembro de 2025",
                arguments: [
                    "A dívida de Itaipu foi paga em 2023 e, segundo Amin, a tarifa não caiu na mesma proporção.",
                    "Segundo Amin, a direção da Itaipu gasta com itens que não são da operação da usina, como rodovias e R$ 1,3 bilhão para a COP 30.",
                    "O projeto fixa em US$ 12 por quilowatt o máximo que as distribuidoras podem pagar pela energia que cabe ao Brasil, a partir de 2027, valor que coincide com o máximo anunciado pelo Ministério de Minas e Energia para depois de 2026.",
                ],
                sources: [SENATE_BILL_APPROVED, SENATE_HEARING_NOTICE],
            },
            {
                heading: "Quem diz que a tarifa e os gastos de Itaipu estão adequados:",
                holders: "Enio Verri, diretor-geral brasileiro de Itaipu, em audiência no Senado em 19 de outubro de 2023",
                arguments: [
                    "O Cuse ficou em US$ 22,60 de 2009 a 2021 e foi fixado em US$ 16,71 em 2023, 26% a menos que dois anos antes.",
                    "Na média dos preços dos leilões de energia, o custo da energia de Itaipu foi o terceiro mais barato do mercado.",
                    "Os investimentos socioambientais fazem parte da missão da usina, segundo um documento trocado entre os governos do Brasil e do Paraguai (nota reversal 228, de 2005).",
                ],
                sources: [TARIFF_FALL_NEWS],
            },
        ],
    },
    location: {
        latitude: -25.408,
        longitude: -54.589,
        stateCode: "PR",
        placeLabel: "Foz do Iguaçu (PR)",
        description: "Itaipu fica no rio Paraná, em Foz do Iguaçu, no extremo oeste do Paraná, na divisa com o Paraguai.",
    },
    today: [
        {
            lead: "Produção.",
            text: "Em 2025, a usina produziu 72.879 GWh, com 99,92% de fator de capacidade operativa e 96,29% de disponibilidade média das unidades geradoras.",
            sources: FROM_ANNUAL_REPORT,
        },
        {
            lead: "Modernização.",
            text: "A Itaipu continua o projeto de atualização tecnológica das unidades geradoras, segundo o Relatório Anual 2025.",
            sources: FROM_ANNUAL_REPORT,
        },
    ],
    trivia: [
        {
            text: "O nome Itaipu vem do tupi e quer dizer \"a pedra que canta\". Era o nome de uma ilha, quase sempre coberta pelo rio, no local escolhido para a usina.",
            sources: FROM_HISTORY,
        },
        {
            text: "Antes de o reservatório encher, a operação Mymba Kuera, que em tupi-guarani quer dizer \"pega-bicho\", salvou 36.450 animais que viviam na área que seria alagada.",
            sources: FROM_HISTORY,
        },
        {
            text: "O ferro e o aço usados na obra dariam para construir 380 Torres Eiffel.",
            sources: [DAM],
        },
        {
            text: "A primeira roda de turbina, de 300 toneladas, saiu de São Paulo em 4 de dezembro de 1981 e chegou à obra em 3 de março de 1982, depois de um caminho de 1.350 km.",
            sources: FROM_HISTORY,
        },
    ],
    reviewedOn: "2026-11-07",
    contentFile: "src/db/src/marcos/itaipu.ts",
};