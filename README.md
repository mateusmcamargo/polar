# <img src="brand/readme-banner-inverted.svg" alt="polar" width="100%">

O polar é uma plataforma gratuita e comunitária que reúne, em um só lugar, informações sobre quem representa o eleitorado brasileiro e como essas pessoas decidem. Todos os dados vêm de fontes oficiais e públicas do governo federal, sempre acompanhados do link de origem e da data de coleta.

## Por que o polar existe

Os dados sobre a atividade política no Brasil são públicos, mas estão espalhados por dezenas de portais, em formatos técnicos e difíceis de navegar. O polar organiza essas informações e as apresenta de forma simples, rápida e pensada primeiro para o celular.

## O que você encontra

- **Votações da Câmara:** como cada deputado votou em cada proposta e qual foi a orientação de cada partido.
- **Agenda do legislativo:** sessões plenárias, reuniões de comissões e audiências.
- **Pra onde foi o dinheiro?** Como cada deputado usou a cota parlamentar e os benefícios do cargo, com o comprovante de cada gasto.
- **Vínculos:** quem financiou a campanha de cada deputado e para onde ele destinou as emendas parlamentares.
- **Presença:** em quantos dias de votação do plenário e em quantas reuniões de comissão cada deputado esteve, com cada falta em comissão por tipo de reunião e se coincidiu com outro compromisso registrado.
- **Do voto à lei:** o caminho que cada proposta toma antes de ser aprovada ou negada.
- **Histórico de parlamentares:** mandatos, partidos, trocas de partido, comissões e posicionamentos ao longo do tempo.
- **Movimento dos partidos:** o quanto cada partido e cada deputado votou com o governo e com o próprio partido a cada trimestre, e a afinidade de votos entre partidos.
- **Comparações:** parlamentares lado a lado, mostrando dados com as mesmas métricas e a mesma fonte.

## Princípios

- **Transparência:** todo número exibido indica a fonte oficial e a data em que foi coletado.
- **Neutralidade:** o polar apresenta fatos e não toma partidos. Não há notas, rankings editoriais nem adjetivos sobre políticos.
- **Acesso livre:** sem cadastro, sem anúncios e sem custo.
- **Para todas as pessoas:** linguagem simples, termos técnicos explicados, tradução para Libras com o VLibras, leitura em voz alta e interface construída com foco em acessibilidade, seguindo o padrão WCAG 2.2 AA.
- **Privacidade:** o polar usa e exibe apenas dados de agentes públicos no exercício de suas funções, em conformidade com a LGPD.

## Fontes de dados

- [Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/)
- [Páginas dos deputados no site da Câmara](https://www.camara.leg.br/deputados), para a presença e os benefícios, que só são publicados nesse formato.

Novas fontes serão incorporadas, entre elas indicadores socioeconômicos do IBGE e do Banco Central, o Senado Federal, o Tribunal Superior Eleitoral e o Portal da Transparência.

## Situação do projeto

Em desenvolvimento. Já estão no ar, em ambiente de desenvolvimento, as páginas de votações e propostas, o perfil de cada deputado com presença e gastos, o movimento dos partidos e as páginas de governantes e marcos. Os dados cobrem os deputados federais.

## Código aberto

O código do polar é aberto. Contribuições, sugestões e relatos de erros são bem-vindos pelas issues do GitHub.

## Como rodar localmente

Pré-requisitos: Node.js 24 ou superior, pnpm e Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:generate
pnpm dev
```

O site fica disponível em `http://localhost:3000`.