import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { plainGlossaryText } from "@polar/db/glossary";
import { MARCO_PAGES, type MarcoPage } from "@polar/db/marcos";
import { RULER_PAGES } from "@polar/db/rulers";
import { stateName } from "@/components/DeputySearch/brazilianStates";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import { EditorialTimeline, StatementText } from "@/components/EditorialTimeline/EditorialTimeline";
import { EnergySplit } from "@/components/EnergySplit/EnergySplit";
import { GenerationChart } from "@/components/GenerationChart/GenerationChart";
import { GlossaryHint } from "@/components/GlossaryHint/GlossaryHint";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { LocationMap } from "@/components/LocationMap/LocationMap";
import { PageMap } from "@/components/PageMap/PageMap";
import { PageSection } from "@/components/PageSection/PageSection";
import { NAV_BACK, NAV_FORWARD, PageTransition } from "@/components/PageTransition/PageTransition";
import { RevenueBreakdown } from "@/components/RevenueBreakdown/RevenueBreakdown";
import { TariffChart } from "@/components/TariffChart/TariffChart";
import { ThesisPair } from "@/components/ThesisPair/ThesisPair";
import styles from "./page.module.scss";

// content lives in the repository, so every page is built with the site and unknown slugs return 404
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
    return Object.keys(MARCO_PAGES).map((slug) => ({ slug }));
}

const REPOSITORY_URL = "https://github.com/mateusmcamargo/polar";
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });
const integerFormat = new Intl.NumberFormat("pt-BR");
const decimalFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDay(day: string): string {
    return dateFormat.format(new Date(`${day}T12:00:00-03:00`));
}

interface LandmarkPageProps {
    params: Promise<{ slug: string }>;
}

async function resolvePage(params: LandmarkPageProps["params"]): Promise<MarcoPage | null> {
    const { slug } = await params;
    return MARCO_PAGES[slug] ?? null;
}

export async function generateMetadata({ params }: LandmarkPageProps): Promise<Metadata> {
    const page = await resolvePage(params);
    if (!page) {
        return { title: "Página não encontrada" };
    }
    return {
        title: page.name,
        description: plainGlossaryText(page.summary),
        alternates: { canonical: `/marcos/${page.slug}` },
    };
}

export default async function LandmarkPage({ params }: LandmarkPageProps) {
    const page = await resolvePage(params);
    if (!page) {
        notFound();
    }

    const { numbers, money, agreement } = page;
    const generationSummary = `Produção por ano, em gigawatts-hora: ${numbers.generation.points
        .map((point) => `${integerFormat.format(point.gigawattHours)} em ${point.year}`)
        .join(", ")}.`;
    const tariffSummary = `Custo da energia por ano, em dólares por quilowatt por mês. ${money.tariff.series
        .map((series) => `${series.label}: ${series.points.map((point) => `${decimalFormat.format(point.value)} em ${point.year}`).join(", ")}`)
        .join(". ")}.`;

    return (
        <PageTransition>
            <PageMap />
            <main id="conteudo" className={styles.page}>
                <nav className={styles.crumb} aria-label="Você está em">
                    <Link href="/marcos" transitionTypes={NAV_BACK}>Marcos</Link> <span aria-hidden="true">›</span> {page.name}
                </nav>

                <section className={styles.intro} aria-labelledby="landmark-title">
                    <p className={styles.kicker}>{page.kicker}</p>
                    <h1 id="landmark-title" className={styles.name}>
                        {page.name}
                    </h1>
                    <div className={styles.tags}>
                        {page.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                                {tag}
                            </span>
                        ))}
                    </div>
                    <p className={styles.lead}>
                        <GlossaryText text={page.summary} highlightNumbers />
                    </p>
                    <ListenButton text={`${page.name}. ${plainGlossaryText(page.summary)}`} />
                </section>

                <GlossaryHint />

                <PageSection id="ficha" icon="facts" kicker="O marco" title="O que é" label="Ficha">
                    <dl className={styles.facts}>
                        {page.facts.rows.map((row) => (
                            <div key={row.label}>
                                <dt>{row.label}</dt>
                                <dd>{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                    <EditorialSources sources={page.facts.sources} />
                </PageSection>

                <PageSection id="numeros" icon="numbers" kicker="Em números" title="Os números" label="Números">
                    <p className={styles.text}>
                        <GlossaryText text={numbers.intro} />
                    </p>
                    <div className={styles.figures}>
                        {numbers.figures.map((figure) => (
                            <div key={figure.value} className={styles.figure}>
                                <p>
                                    <strong>{figure.value}</strong> {figure.caption}
                                </p>
                                <EditorialSources sources={figure.sources} />
                            </div>
                        ))}
                    </div>
                    <h3 className={styles.subtitle}>Produção ano a ano</h3>
                    <p className={styles.text}>
                        <GlossaryText text={numbers.generation.intro} />
                    </p>
                    <GenerationChart
                        points={numbers.generation.points}
                        highlightYear={numbers.generation.highlightYear}
                        description={generationSummary}
                        note={numbers.generation.note}
                    />
                    <EditorialSources sources={numbers.generation.sources} />
                </PageSection>

                <PageSection id="linha-do-tempo" icon="timeline" kicker="A história" title="Como aconteceu" label="Linha do tempo">
                    <EditorialTimeline entries={page.timeline} />
                </PageSection>

                <PageSection id="quem-decidiu" icon="decided" kicker="As decisões" title="Quem decidiu" label="Quem decidiu">
                    <p className={styles.text}>
                        <GlossaryText text={page.decided.intro} />
                    </p>
                    <div className={styles.decided}>
                        <ul>
                            {page.decided.items.map((item) => (
                                <li key={item.statement.text}>
                                    <StatementText statement={item.statement} />
                                    {item.rulerSlug && item.rulerSlug in RULER_PAGES && (
                                        <Link className={styles.rulerLink} href={`/governantes/${item.rulerSlug}`} transitionTypes={NAV_FORWARD}>
                                            Ver a página do governante
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </PageSection>

                <PageSection id="acordo" icon="agreement" kicker="Os países" title={agreement?.title ?? "Acordos e regras"} label="Acordo">
                    {agreement ? (
                        <>
                            <p className={styles.text}>
                                <GlossaryText text={agreement.intro} highlightNumbers />
                            </p>
                            <EnergySplit data={agreement.split} />
                            <EditorialSources sources={agreement.split.sources} />
                            <h3 className={styles.subtitle}>O que dizem o tratado e os acordos</h3>
                            <EditorialTimeline entries={agreement.rules} />
                            <div className={styles.notice}>
                                <h3 className={styles.noticeLabel}>Números que as fontes dão de forma diferente</h3>
                                {agreement.divergence.map((statement) => (
                                    <StatementText key={statement.text} statement={statement} />
                                ))}
                            </div>
                            <div className={styles.notice}>
                                <h3 className={styles.noticeLabel}>O que ainda está em aberto</h3>
                                {agreement.open.map((statement) => (
                                    <StatementText key={statement.text} statement={statement} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className={styles.text}>Este marco não envolve um acordo entre países.</p>
                    )}
                </PageSection>

                <PageSection id="dinheiro" icon="cost" kicker="O dinheiro" title="Quanto custou e quem pagou" label="Dinheiro">
                    <p className={styles.text}>
                        <GlossaryText text={money.intro} />
                    </p>
                    <div className={styles.money}>
                        {money.works.map((statement) => (
                            <StatementText key={statement.text} statement={statement} />
                        ))}
                    </div>
                    <h3 className={styles.subtitle}>Para onde foi o faturamento de {money.revenue.year}</h3>
                    <p className={styles.text}>
                        <GlossaryText text={money.revenue.intro} />
                    </p>
                    <RevenueBreakdown data={money.revenue} />
                    <EditorialSources sources={money.revenue.sources} />
                    <h3 className={styles.subtitle}>O preço da energia ao longo do tempo</h3>
                    <p className={styles.text}>
                        <GlossaryText text={money.tariff.intro} />
                    </p>
                    <TariffChart series={money.tariff.series} description={tariffSummary} note={money.tariff.note} />
                    <EditorialSources sources={money.tariff.sources} />
                </PageSection>

                <PageSection id="duas-leituras" icon="theses" kicker="Em debate" title="Duas leituras" label="Duas leituras">
                    <p className={styles.text}>
                        <GlossaryText text={page.theses.intro} />
                    </p>
                    <ThesisPair theses={page.theses.pair} />
                </PageSection>

                <PageSection id="onde-fica" icon="where" kicker="No mapa" title="Onde fica" label="Mapa">
                    <figure className={styles.map}>
                        <LocationMap location={page.location} name={page.name} idPrefix="page-map" />
                        <figcaption>
                            <ul className={styles.legend}>
                                <li>
                                    <i className={styles.stateSwatch} aria-hidden="true" />
                                    Estado onde fica: {stateName(page.location.stateCode)}
                                </li>
                                <li>
                                    <i className={styles.pointSwatch} aria-hidden="true" />
                                    {page.name}
                                </li>
                            </ul>
                            <p>{page.location.description}</p>
                            <p className={styles.mapSource}>Contorno dos estados: IBGE, malha das unidades da federação, coletada em 28/10/2026. A posição do ponto é aproximada.</p>
                        </figcaption>
                    </figure>
                </PageSection>

                <PageSection id="hoje" icon="today" kicker="Agora" title="Situação hoje" label="Hoje">
                    <div className={styles.money}>
                        {page.today.map((statement) => (
                            <StatementText key={statement.text} statement={statement} />
                        ))}
                    </div>
                </PageSection>

                <PageSection id="curiosidades" icon="trivia" kicker="Curiosidades" title="Você sabia?">
                    <ul className={styles.trivia}>
                        {page.trivia.map((statement) => (
                            <li key={statement.text}>
                                <StatementText statement={statement} />
                            </li>
                        ))}
                    </ul>
                </PageSection>

                <footer className={styles.review}>
                    <p>
                        Fontes consultadas e texto revisado em {formatDay(page.reviewedOn)}. Esta página segue regras públicas de neutralidade: fatos com fonte, e opiniões sempre com o
                        nome de quem as defende.
                    </p>
                    <p>
                        <a href={`${REPOSITORY_URL}/commits/main/${page.contentFile}`}>Ver quem alterou este texto e quando</a>, no GitHub.
                    </p>
                </footer>
            </main>
        </PageTransition>
    );
}