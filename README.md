# polar

**A política brasileira, clara e direta, na palma da mão.**

O polar é uma plataforma gratuita e comunitária que reúne, em um só lugar, informações sobre quem representa o eleitorado brasileiro e como essas pessoas decidem. Todos os dados vêm de fontes oficiais e públicas do governo federal, sempre acompanhados do link de origem e da data de coleta.

## Por que o polar existe

Os dados sobre a atividade política no Brasil são públicos, mas estão espalhados por dezenas de portais, em formatos técnicos e difíceis de navegar. O polar organiza essas informações e as apresenta de forma simples, rápida e pensada primeiro para o celular.

## O que você encontra

- **Votações da Câmara:** como cada deputado votou em cada proposta e qual foi a orientação de cada partido.
- **Agenda do legislativo:** sessões plenárias, reuniões de comissões e audiências.
- **Pra onde foi o dinheiro?** Como cada deputado usou a cota parlamentar e os benefícios do cargo, com o comprovante de cada gasto.
- **Vínculos:** quem financiou a campanha de cada deputado e para onde ele destinou as emendas parlamentares.
- **Presença:** em quais sessões e reuniões cada deputado esteve presente.
- **Do voto à lei:** o caminho de cada proposta, da votação até a lei publicada.
- **Histórico de parlamentares:** mandatos, partidos, comissões e posicionamentos ao longo do tempo.
- **Comparações:** parlamentares lado a lado, com as mesmas métricas e a mesma fonte.

## Princípios

- **Transparência:** todo número exibido indica a fonte oficial e a data em que foi coletado.
- **Neutralidade:** o polar apresenta fatos, não opiniões. Não há notas, rankings editoriais nem adjetivos sobre políticos.
- **Acesso livre:** sem cadastro, sem anúncios e sem custo para quem usa.
- **Para todas as pessoas:** linguagem simples, termos técnicos explicados, tradução para Libras com o VLibras, leitura em voz alta e acessibilidade como requisito, seguindo o padrão WCAG 2.2 AA.
- **Privacidade:** apenas dados de agentes públicos no exercício de suas funções, em conformidade com a LGPD.

## Fontes de dados

- [Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br/)

Novas fontes serão incorporadas nas próximas etapas, entre elas indicadores socioeconômicos do IBGE e do Banco Central, o Senado Federal, o Tribunal Superior Eleitoral e o Portal da Transparência.

## Situação do projeto

Em desenvolvimento. O planejamento e a estrutura do projeto estão prontos. A primeira funcionalidade será o acompanhamento de votações, sessões, reuniões e gastos dos deputados federais.

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