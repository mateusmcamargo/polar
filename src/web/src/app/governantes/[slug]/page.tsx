import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { plainGlossaryText } from "@polar/db/glossary";
import { findGalleryEntry, RULER_PAGES, type RulerPage } from "@polar/db/rulers";
import { AmountMark } from "@/components/AmountMark/AmountMark";
import { ApprovalChart } from "@/components/ApprovalChart/ApprovalChart";
import { CaseList } from "@/components/CaseList/CaseList";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import { EditorialTimeline, StatementText } from "@/components/EditorialTimeline/EditorialTimeline";
import { GlossaryHint } from "@/components/GlossaryHint/GlossaryHint";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { PageMap } from "@/components/PageMap/PageMap";
import { PageSection } from "@/components/PageSection/PageSection";
import { NAV_BACK, PageTransition } from "@/components/PageTransition/PageTransition";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { ThesisPair } from "@/components/ThesisPair/ThesisPair";
import styles from "./page.module.scss";

// content lives in the repository, so every page is built with the site and unknown slugs return 404
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
    return Object.keys(RULER_PAGES).map((slug) => ({ slug }));
}

const REPOSITORY_URL = "https://github.com/mateusmcamargo/polar";
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

function formatDay(day: string): string {
    return dateFormat.format(new Date(`${day}T12:00:00-03:00`));
}

interface RulerPageProps {
    params: Promise<{ slug: string }>;
}

async function resolvePage(params: RulerPageProps["params"]): Promise<RulerPage | null> {
    const { slug } = await params;
    return RULER_PAGES[slug] ?? null;
}

export async function generateMetadata({ params }: RulerPageProps): Promise<Metadata> {
    const page = await resolvePage(params);
    const entry = page ? findGalleryEntry(page.slug) : null;
    if (!page || !entry) {
        return { title: "Página não encontrada" };
    }
    return {
        title: entry.name,
        description: plainGlossaryText(page.summary),
        alternates: { canonical: `/governantes/${page.slug}` },
    };
}

export default async function RulerDetailPage({ params }: RulerPageProps) {
    const page = await resolvePage(params);
    const entry = page ? findGalleryEntry(page.slug) : null;
    if (!page || !entry) {
        notFound();
    }

    return (
        <PageTransition>
            <PageMap />
            <main id="conteudo" className={styles.page}>
                <nav className={styles.crumb} aria-label="Você está em">
                    <Link href="/governantes" transitionTypes={NAV_BACK}>Governantes</Link> <span aria-hidden="true">›</span> {entry.name}
                </nav>

                <section className={styles.intro} aria-labelledby="ruler-title">
                    <div className={styles.identity}>
                        {entry.portrait && (
                            <figure className={styles.portrait}>
                                <Image src={entry.portrait.file} alt={`Retrato de ${entry.name}`} width={240} height={320} sizes="140px" priority />
                            </figure>
                        )}
                        <div className={styles.names}>
                            <p className={styles.kicker}>{page.officeLabel}</p>
                            <h1 id="ruler-title" className={styles.name}>
                                {entry.name}
                            </h1>
                            <p className={styles.civil}>{page.civilName}</p>
                            <div className={styles.tags}>
                                {page.partyAcronym && <PartyBadge acronym={page.partyAcronym} />}
                                {page.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className={styles.lead}>
                        <GlossaryText text={page.summary} highlightNumbers />
                    </p>
                    <ListenButton text={`${entry.name}. ${plainGlossaryText(page.summary)}`} />
                </section>

                <GlossaryHint />

                <PageSection id="dados" icon="person" kicker="A pessoa" title="Dados pessoais e mandato" label="Dados">
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

                <PageSection id="antes" icon="before" kicker="A pessoa" title="Antes da presidência">
                    <EditorialTimeline entries={page.before} />
                </PageSection>

                <PageSection id="politicas" icon="policies" kicker="O governo" title="Principais políticas" label="Políticas">
                    <p className={styles.text}>
                        <GlossaryText text={page.policies.intro} highlightNumbers />
                    </p>
                    <EditorialTimeline entries={page.policies.entries} />
                </PageSection>

                <PageSection id="economia" icon="economy" kicker="O governo" title="A economia no período" label="Economia">
                    <p className={styles.text}>
                        <GlossaryText text={page.economy.intro} highlightNumbers />
                    </p>
                    <EditorialTimeline entries={page.economy.entries} />
                </PageSection>

                <PageSection id="mundo" icon="world" kicker="O governo" title="Relações com outros países" label="Outros países">
                    <EditorialTimeline entries={page.world} />
                </PageSection>

                <PageSection id="opiniao" icon="opinion" kicker="O governo" title="O que a população achava">
                    <p className={styles.text}>
                        <GlossaryText text={page.opinion.intro} highlightNumbers />
                    </p>
                    <ApprovalChart
                        points={page.opinion.points}
                        description={`Avaliação do governo: ${page.opinion.points.map((point) => `${point.good}% em ${point.label}`).join(", ")}.`}
                    />
                    <p className={styles.text}>
                        <GlossaryText text={page.opinion.note} highlightNumbers />
                    </p>
                </PageSection>

                <PageSection id="investigacoes" icon="justice" kicker="Na Justiça" title="Investigações e processos" label="Investigações">
                    <p className={styles.text}>
                        <GlossaryText text={page.cases.intro} highlightNumbers />
                    </p>
                    <CaseList cases={page.cases.items} gender={page.grammaticalGender} />
                </PageSection>

                {page.endOfTerm && (
                    <PageSection id="fim-do-mandato" icon="congress" kicker="No Congresso" title={page.endOfTerm.heading} label="Fim do mandato">
                        <StatementText statement={page.endOfTerm.intro} />
                        <EditorialTimeline entries={page.endOfTerm.entries} />
                        <div className={styles.decided}>
                            <h3 className={styles.subtitle}>O que as instituições decidiram</h3>
                            <ul>
                                {page.endOfTerm.decided.map((statement) => (
                                    <li key={statement.text}>
                                        <StatementText statement={statement} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <h3 className={styles.subtitle}>Duas leituras do mesmo processo</h3>
                        <ThesisPair theses={page.endOfTerm.theses} />
                    </PageSection>
                )}

                <PageSection id="depois" icon="after" kicker="Depois do cargo" title="Depois da presidência">
                    <EditorialTimeline entries={page.after.entries} />
                    {page.after.money.map((block) => (
                        <div key={block.label} className={styles.money}>
                            <h3 className={styles.moneyLabel}>{block.label}</h3>
                            {block.figures.length > 0 && (
                                <div className={styles.figures}>
                                    {block.figures.map((figure) => (
                                        <p key={figure.value} className={styles.figure}>
                                            <strong>
                                                <AmountMark>{figure.value}</AmountMark>
                                            </strong>{" "}
                                            {figure.caption}
                                        </p>
                                    ))}
                                </div>
                            )}
                            {block.explanation.map((statement) => (
                                <StatementText key={statement.text} statement={statement} />
                            ))}
                        </div>
                    ))}
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
                        Fontes consultadas e texto revisado em {formatDay(page.reviewedOn)}. Esta página segue regras públicas de neutralidade: fatos
                        com fonte, e opiniões sempre com o nome de quem as defende.
                    </p>
                    <p>
                        <a href={`${REPOSITORY_URL}/commits/main/${page.contentFile}`}>Ver quem alterou este texto e quando</a>, no GitHub.
                    </p>
                    {entry.portrait && (
                        <p>
                            Retrato: <a href={entry.portrait.sourceUrl}>{entry.portrait.author}</a>, licença {entry.portrait.license}, via Wikimedia
                            Commons.
                        </p>
                    )}
                </footer>
            </main>
        </PageTransition>
    );
}