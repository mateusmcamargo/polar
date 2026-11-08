import type { VoteSummary } from "./types";

export type { Sources, VoteNote, VoteSummary } from "./types";

// drafts written on 2026-11-06 from Agência Câmara reports and the ficha de tramitação of each proposition; none is reviewed, so
// none reaches the page until the maintainer reads it, checks it against the sources and changes its status, see docs/EDITORIAL.md
export const VOTE_SUMMARIES: readonly VoteSummary[] = [
    {
        propositionId: 2270800,
        status: "draft",
        result: {
            text: "Se for aprovada pelo Senado, a PEC muda as regras para processar e prender deputados e senadores: o STF só poderia processar um parlamentar por crime com a autorização da Câmara ou do Senado, dada em voto secreto, em até 90 dias. A Câmara terminou a votação em setembro de 2025 e mandou a proposta ao Senado. Na ficha de tramitação, a situação consta como \"Arquivada\"; a Câmara não registra o que aconteceu no Senado.",
            sources: [
                {
                    title: "Câmara aprova novo texto para a PEC das Prerrogativas",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1201079-camara-aprova-novo-texto-para-pec-das-prerrogativas-acompanhe/",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Ficha de tramitação da PEC 3/2021",
                    publisher: "Câmara dos Deputados",
                    url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2270800",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        life: {
            text: "A proposta trata de quem pode investigar, processar e prender quem tem mandato. A Agência Câmara não aponta efeito direto sobre serviços, impostos ou benefícios.",
            sources: [
                {
                    title: "Câmara aprova novo texto para a PEC das Prerrogativas",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1201079-camara-aprova-novo-texto-para-pec-das-prerrogativas-acompanhe/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        benefited: {
            text: "Deputados e senadores ganhariam garantias para exercer o mandato. O relator, deputado Claudio Cajado (PP-BA), disse que essas garantias são \"o instrumento para o exercício do mandato, sem pressões externas\".",
            sources: [
                {
                    title: "Câmara aprova novo texto para a PEC das Prerrogativas",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1201079-camara-aprova-novo-texto-para-pec-das-prerrogativas-acompanhe/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        affected: {
            text: "Pelo texto, parlamentares só poderiam sofrer medidas cautelares (medidas tomadas antes do julgamento) determinadas pelo STF, e isso valeria mesmo depois que deixassem o mandato. Os presidentes nacionais de partidos com representação no Congresso passariam a ser julgados pelo STF. Deputados do PT, do PSOL e do Novo questionaram a votação da emenda que trouxe de volta o voto secreto. A reportagem não aponta grupos prejudicados.",
            sources: [
                {
                    title: "Câmara aprova novo texto para a PEC das Prerrogativas",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1201079-camara-aprova-novo-texto-para-pec-das-prerrogativas-acompanhe/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
    },
    {
        propositionId: 2454495,
        status: "draft",
        result: {
            text: "O texto aprovado pela Câmara em 15/07/2025 muda como os governos pagam precatórios (dívidas que a Justiça mandou o governo pagar) e abre novo prazo para os municípios parcelarem dívidas com a previdência. A proposta virou a Emenda Constitucional 136/2025, publicada em 10/09/2025. O texto final pode ter diferenças em relação ao aprovado pela Câmara.",
            sources: [
                {
                    title: "Câmara aprova em 2º turno PEC que altera regras para pagamento de precatórios",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1180446-camara-aprova-em-2o-turno-pec-que-altera-regras-para-pagamento-de-precatorios/",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Ficha de tramitação da PEC 66/2023",
                    publisher: "Câmara dos Deputados",
                    url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2454495",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        life: {
            text: "Estados e municípios passam a ter um limite para pagar precatórios por ano, de 1% a 5% da receita corrente líquida, conforme o tamanho da dívida em atraso. A correção passa a ser o IPCA mais 2% de juros ao ano. Para as prefeituras, a parte da receita que deixa de ter destino obrigatório sobe de 30% para 50% até 31/12/2026, e a dívida com a previdência pode ser parcelada em 300 vezes. A reportagem não diz como isso muda a espera de quem tem um precatório a receber.",
            sources: [
                {
                    title: "Câmara aprova em 2º turno PEC que altera regras para pagamento de precatórios",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1180446-camara-aprova-em-2o-turno-pec-que-altera-regras-para-pagamento-de-precatorios/",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "PEC aprovada reabre prazo para estados e municípios parcelarem dívidas previdenciárias",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1180467-pec-aprovada-reabre-prazo-para-estados-e-municipios-parcelarem-dividas-previdenciarias/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        benefited: {
            text: "Segundo a Agência Câmara, o governo federal, porque tirar os precatórios do limite de despesas ajuda a cumprir a meta fiscal de 2026 (R$ 34 bilhões), e os municípios, pela receita livre maior e pelo parcelamento em 300 vezes. O relator, deputado Baleia Rossi (MDB-SP), disse que o texto \"garante que os municípios tenham condições de investimentos reais\".",
            sources: [
                {
                    title: "Câmara aprova em 2º turno PEC que altera regras para pagamento de precatórios",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1180446-camara-aprova-em-2o-turno-pec-que-altera-regras-para-pagamento-de-precatorios/",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "PEC aprovada reabre prazo para estados e municípios parcelarem dívidas previdenciárias",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1180467-pec-aprovada-reabre-prazo-para-estados-e-municipios-parcelarem-dividas-previdenciarias/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        affected: {
            text: "Prefeituras que atrasarem os pagamentos podem ter as contas sequestradas (a Justiça pega o dinheiro direto nelas), ficam sem transferências voluntárias (repasses da União por acordo) e o prefeito pode responder por improbidade. Para parcelar a dívida com a previdência, os municípios com regime próprio precisam fazer mudanças nas regras de aposentadoria dos servidores até 01/03/2027, ou o parcelamento é suspenso. A reportagem não traz críticas de parlamentares.",
            sources: [
                {
                    title: "Câmara aprova em 2º turno PEC que altera regras para pagamento de precatórios",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1180446-camara-aprova-em-2o-turno-pec-que-altera-regras-para-pagamento-de-precatorios/",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "PEC aprovada reabre prazo para estados e municípios parcelarem dívidas previdenciárias",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1180467-pec-aprovada-reabre-prazo-para-estados-e-municipios-parcelarem-dividas-previdenciarias/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
    },
    {
        propositionId: 2438459,
        status: "draft",
        result: {
            text: "O projeto virou a Lei Complementar 227/2026, sancionada em 13/01/2026. Ela cria o Comitê Gestor do IBS, um órgão nacional de estados e municípios que vai editar as regras do novo imposto, coordenar a arrecadação, julgar as disputas administrativas e dividir o dinheiro entre eles. O IBS vai substituir o ICMS (estadual) e o ISS (municipal).",
            sources: [
                {
                    title: "Lei cria Comitê Gestor do IBS e define regras do imposto criado pela reforma tributária",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1238378-lei-cria-comite-gestor-do-ibs-e-define-regras-do-imposto-criado-pela-reforma-tributaria/",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Ficha de tramitação da PLP 108/2024",
                    publisher: "Câmara dos Deputados",
                    url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2438459",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        life: {
            text: "O IBS e a CBS (federal) fazem parte da reforma tributária. Em 2026, ano de adaptação, não há efeitos tributários. Desde 01/01/2026 as empresas devem mostrar CBS e IBS nas notas fiscais. A lei mantém a isenção da cesta básica nacional e prevê devolução de tributos para famílias de baixa renda. A Agência Câmara não informa o efeito nos preços.",
            sources: [
                {
                    title: "Lei cria Comitê Gestor do IBS e define regras do imposto criado pela reforma tributária",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1238378-lei-cria-comite-gestor-do-ibs-e-define-regras-do-imposto-criado-pela-reforma-tributaria/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        benefited: {
            text: "Segundo a Agência Câmara, estados, Distrito Federal e municípios, que passam a dividir o IBS com procedimentos e sistemas iguais; famílias de baixa renda, com a devolução de tributos; e consumidores, com a isenção da cesta básica mantida. O relator, deputado Mauro Benevides Filho (PDT-CE), disse que o modelo dá mais previsibilidade de caixa aos governos.",
            sources: [
                {
                    title: "Lei cria Comitê Gestor do IBS e define regras do imposto criado pela reforma tributária",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1238378-lei-cria-comite-gestor-do-ibs-e-define-regras-do-imposto-criado-pela-reforma-tributaria/",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Câmara aprova texto-base com regras para o IBS previsto na reforma tributária",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1233334-camara-aprova-texto-base-com-regras-para-o-ibs-previsto-na-reforma-tributaria/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        affected: {
            text: "Empresas que pagam os novos impostos precisam emitir notas fiscais com CBS e IBS destacados; as do Simples Nacional ficam fora dessas exigências. O texto-base foi aprovado por 330 votos a 104. O líder do PL, deputado Sóstenes Cavalcante (PL-RJ), disse que o governo não tem responsabilidade com as contas públicas, e o deputado Luiz Lima (Novo-RJ) disse que o Brasil ficaria com o maior imposto sobre valor agregado do mundo. O presidente vetou alguns trechos; quando a reportagem foi publicada, o Congresso ainda ia analisar os vetos.",
            sources: [
                {
                    title: "Lei cria Comitê Gestor do IBS e define regras do imposto criado pela reforma tributária",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1238378-lei-cria-comite-gestor-do-ibs-e-define-regras-do-imposto-criado-pela-reforma-tributaria/",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Câmara aprova texto-base com regras para o IBS previsto na reforma tributária",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1233334-camara-aprova-texto-base-com-regras-para-o-ibs-previsto-na-reforma-tributaria/",
                    accessedOn: "2026-11-06",
                },
            ],
        },
    },
    {
        propositionId: 2519886,
        status: "draft",
        result: {
            text: "A medida provisória criou o programa Agora Tem Especialistas e virou a Lei 15.233/2025, sancionada em 7 de outubro de 2025. O programa liga o SUS a hospitais e clínicas privadas para ampliar o acesso a médicos especialistas: o governo dá créditos de tributos federais, e a rede privada atende pacientes do SUS.",
            sources: [
                {
                    title: "Programa que acelera acesso a médicos especialistas no SUS agora é lei",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1209168-programa-que-acelera-acesso-a-medicos-especialistas-no-sus-agora-e-lei",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Ficha de tramitação da MPV 1301/2025",
                    publisher: "Câmara dos Deputados",
                    url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2519886",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        life: {
            text: "Para quem usa o SUS, pacientes com câncer passam a ter prioridade na radioterapia. Quem faz radioterapia ou hemodiálise em outro município pode ter transporte, alojamento e alimentação garantidos, conforme os recursos disponíveis. O atendimento pode ser por telemedicina, com prioridade para regiões remotas ou com falta comprovada de especialistas. O tempo médio de espera passa a ser reunido em um sistema nacional de dados.",
            sources: [
                {
                    title: "Programa que acelera acesso a médicos especialistas no SUS agora é lei",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1209168-programa-que-acelera-acesso-a-medicos-especialistas-no-sus-agora-e-lei",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        benefited: {
            text: "Pacientes do SUS. Hospitais e clínicas privadas que aderirem, desde que estejam em dia com o fisco e desistam de processos contra a cobrança de impostos. Planos de saúde, que podem trocar o ressarcimento ao SUS (o que devem ao sistema) por atendimento gratuito.",
            sources: [
                {
                    title: "Programa que acelera acesso a médicos especialistas no SUS agora é lei",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1209168-programa-que-acelera-acesso-a-medicos-especialistas-no-sus-agora-e-lei",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        affected: {
            text: "O custo é o dinheiro que a União deixa de arrecadar: os benefícios tributários são limitados a R$ 2 bilhões por ano, e o governo deve prever esse valor no Orçamento a partir de 2026. A Agência Câmara não informa quem seria prejudicado e não traz críticas.",
            sources: [
                {
                    title: "Programa que acelera acesso a médicos especialistas no SUS agora é lei",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1209168-programa-que-acelera-acesso-a-medicos-especialistas-no-sus-agora-e-lei",
                    accessedOn: "2026-11-06",
                },
            ],
        },
    },
    {
        propositionId: 2463814,
        status: "draft",
        result: {
            text: "A medida provisória liberou R$ 938,4 milhões em crédito extraordinário (dinheiro além do que o orçamento previa) para sete ministérios. A Câmara e o Senado aprovaram em 01/04/2025, e ela virou a Lei 15.118/2025.",
            sources: [
                {
                    title: "Câmara aprova MP que destina recursos para combate à seca e outras áreas",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1146056-camara-aprova-mp-que-destina-recursos-para-combate-a-seca-e-outras-areas",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Ficha de tramitação da MPV 1268/2024",
                    publisher: "Câmara dos Deputados",
                    url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2463814",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        life: {
            text: "O dinheiro vai para: auxílio a pescadores artesanais da região Norte atingidos pela seca (Seguro Defeso), R$ 418,4 milhões; saúde, R$ 238 milhões, para remédios, insumos, atendimento, saúde indígena e vigilância em saúde; defesa civil na Amazônia Legal, R$ 143 milhões; cisternas e acesso à água, R$ 74,9 milhões; combate a incêndios pelo ICMBio, R$ 36,7 milhões; segurança pública, R$ 25,8 milhões, com 120 profissionais da Força Nacional por 100 dias; e áreas de assentamento, R$ 1,4 milhão.",
            sources: [
                {
                    title: "Câmara aprova MP que destina recursos para combate à seca e outras áreas",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1146056-camara-aprova-mp-que-destina-recursos-para-combate-a-seca-e-outras-areas",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        benefited: {
            text: "Segundo a Agência Câmara, pescadores artesanais da região Norte atingidos pela seca, os municípios afetados pela seca e por incêndios, a população atendida pelas ações de saúde e pelo Programa Cisternas e as famílias de áreas de assentamento.",
            sources: [
                {
                    title: "Câmara aprova MP que destina recursos para combate à seca e outras áreas",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1146056-camara-aprova-mp-que-destina-recursos-para-combate-a-seca-e-outras-areas",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        affected: {
            text: "A reportagem não aponta quem perde. Para o deputado Carlos Jordy (PL-RJ), seca e queimadas são previsíveis, e crédito extraordinário exige um fato imprevisível. Kim Kataguiri (União-SP) e Adriana Ventura (Novo-SP) criticaram que a MP responde a uma decisão do ministro Flávio Dino, do STF. Pompeo de Mattos (PDT-RS) e Erika Kokay (PT-DF) disseram que a MP é necessária diante da crise climática.",
            sources: [
                {
                    title: "Câmara aprova MP que destina recursos para combate à seca e outras áreas",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1146056-camara-aprova-mp-que-destina-recursos-para-combate-a-seca-e-outras-areas",
                    accessedOn: "2026-11-06",
                },
            ],
        },
    },
    {
        propositionId: 2541109,
        status: "draft",
        result: {
            text: "O projeto virou a Lei Complementar 223/2025, publicada em 19/12/2025. Ela tira do limite de gastos do governo (o arcabouço fiscal), da meta fiscal e dos pisos de saúde e educação o dinheiro do Fundo Social, formado com recursos do petróleo, usado em despesas temporárias de educação pública e saúde, a partir de 2025. Na versão final, as despesas pagas com empréstimos internacionais continuam dentro do limite, por decisão do Senado.",
            sources: [
                {
                    title: "Câmara aprova mudanças em projeto que desbloqueia recursos do Fundo Social para saúde e educação",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1233305-camara-aprova-mudancas-em-projeto-que-desbloqueia-recursos-do-fundo-social-para-saude-e-educacao",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Ficha de tramitação da PLP 163/2025",
                    publisher: "Câmara dos Deputados",
                    url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2541109",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        life: {
            text: "São despesas temporárias equivalentes a 5% da receita do Fundo Social por ano, durante cinco anos: cerca de R$ 1,5 bilhão a mais por ano para a educação pública e a saúde pública, segundo a Agência Câmara. A reportagem não detalha em que serviços o dinheiro será usado.",
            sources: [
                {
                    title: "Câmara aprova mudanças em projeto que desbloqueia recursos do Fundo Social para saúde e educação",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1233305-camara-aprova-mudancas-em-projeto-que-desbloqueia-recursos-do-fundo-social-para-saude-e-educacao",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        benefited: {
            text: "A educação pública e a saúde pública, que recebem esse dinheiro a mais. O relator, deputado José Priante (MDB-PA), disse que o texto apenas viabiliza a execução do orçamento e que não cria despesas.",
            sources: [
                {
                    title: "Câmara aprova mudanças em projeto que desbloqueia recursos do Fundo Social para saúde e educação",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1233305-camara-aprova-mudancas-em-projeto-que-desbloqueia-recursos-do-fundo-social-para-saude-e-educacao",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        affected: {
            text: "A reportagem não aponta quem perde. O deputado Claudio Cajado (PP-BA), relator do arcabouço fiscal na Câmara, disse que propostas assim, um \"puxadinho\" do arcabouço, levariam à continuidade dos juros altos e ao aumento da inflação. O deputado Cabo Gilberto Silva (PL-PB), vice-líder da oposição, criticou o governo por falta de responsabilidade fiscal. Como o dinheiro fica fora dos pisos, ele não conta para o mínimo que o governo precisa gastar em saúde e educação.",
            sources: [
                {
                    title: "Câmara aprova mudanças em projeto que desbloqueia recursos do Fundo Social para saúde e educação",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1233305-camara-aprova-mudancas-em-projeto-que-desbloqueia-recursos-do-fundo-social-para-saude-e-educacao",
                    accessedOn: "2026-11-06",
                },
            ],
        },
    },
    {
        propositionId: 2520670,
        status: "draft",
        result: {
            text: "O projeto virou a Lei Complementar 224/2025, sancionada em 26/12/2025. Ela reduz em 10% os benefícios fiscais federais (descontos e vantagens em tributos dados a empresas e setores), aumenta a tributação de bets e fintechs e cria um teto: se as renúncias passarem de 2% do PIB, o governo não pode criar, ampliar nem prorrogar incentivos, salvo com medidas de compensação.",
            sources: [
                {
                    title: "Nova lei corta incentivos, eleva impostos sobre bets e impõe teto fiscal",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1236146-nova-lei-corta-incentivos,-eleva-impostos-sobre-bets-e-impoe-teto-fiscal",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Ficha de tramitação da PLP 128/2025",
                    publisher: "Câmara dos Deputados",
                    url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2520670",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        life: {
            text: "A reportagem da Agência Câmara não trata do efeito sobre os preços. Empresas com incentivos pagam um pouco mais de tributos. As bets pagam mais imposto, e parte do dinheiro vai para a seguridade social e a saúde. Sócios de empresas que recebem juros sobre capital próprio passam a ter imposto de renda de 17,5% retido na fonte.",
            sources: [
                {
                    title: "Nova lei corta incentivos, eleva impostos sobre bets e impõe teto fiscal",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1236146-nova-lei-corta-incentivos,-eleva-impostos-sobre-bets-e-impoe-teto-fiscal",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        benefited: {
            text: "A Agência Câmara não aponta quem ganha com o corte. Ficam de fora dele as imunidades constitucionais, a Zona Franca de Manaus, a cesta básica nacional, o Simples Nacional, o Minha Casa, Minha Vida e o Prouni. O relator, deputado Aguinaldo Ribeiro (PP-PB), disse que a \"concessão indiscriminada\" de benefícios fiscais corrói o sistema tributário e o torna desigual, injusto e ineficiente.",
            sources: [
                {
                    title: "Câmara aprova projeto que reduz benefícios fiscais federais e aumenta tributação de bets e fintechs",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1233924-camara-aprova-projeto-que-reduz-beneficios-fiscais-federais-e-aumenta-tributacao-de-bets-e-fintechs",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Nova lei corta incentivos, eleva impostos sobre bets e impõe teto fiscal",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1236146-nova-lei-corta-incentivos,-eleva-impostos-sobre-bets-e-impoe-teto-fiscal",
                    accessedOn: "2026-11-06",
                },
            ],
        },
        affected: {
            text: "Empresas com benefícios fiscais, bets, fintechs e instituições de capitalização, cuja contribuição social sobe gradualmente até 20% em 2028, e sócios que recebem juros sobre capital próprio. No lucro presumido, o aumento vale só para a receita acima de R$ 5 milhões por ano. A líder da Minoria, deputada Chris Tonietto (PL-RJ), disse que a proposta afetará as famílias mais pobres e chamou o projeto de \"sanha arrecadatória\" do governo. O deputado Cabo Gilberto Silva (PL-PB), líder da oposição, disse que o governo está tirando investidores do Brasil.",
            sources: [
                {
                    title: "Câmara aprova projeto que reduz benefícios fiscais federais e aumenta tributação de bets e fintechs",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1233924-camara-aprova-projeto-que-reduz-beneficios-fiscais-federais-e-aumenta-tributacao-de-bets-e-fintechs",
                    accessedOn: "2026-11-06",
                },
                {
                    title: "Nova lei corta incentivos, eleva impostos sobre bets e impõe teto fiscal",
                    publisher: "Agência Câmara de Notícias",
                    url: "https://www.camara.leg.br/noticias/1236146-nova-lei-corta-incentivos,-eleva-impostos-sobre-bets-e-impoe-teto-fiscal",
                    accessedOn: "2026-11-06",
                },
            ],
        },
    },
];

// ids of the propositions that have a summary, for the badge of the lists; the lists get only the ids, so the texts stay on
// the page of the proposition
export function listSummarizedPropositionIds(): number[] {
    return VOTE_SUMMARIES.map((summary) => summary.propositionId);
}

// the summary of a proposition, reviewed or not; the page tells the visitor when it is still a draft (decided on 2026-11-06)
export function findVoteSummary(propositionId: number): VoteSummary | null {
    return VOTE_SUMMARIES.find((summary) => summary.propositionId === propositionId) ?? null;
}