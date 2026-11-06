import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { plainGlossaryText } from "@polar/db/glossary";
import { findGalleryEntry, RULER_PAGES, type RulerPage } from "@polar/db/rulers";
import { ApprovalChart } from "@/components/ApprovalChart/ApprovalChart";
import { CaseList } from "@/components/CaseList/CaseList";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import { EditorialTimeline, StatementText } from "@/components/EditorialTimeline/EditorialTimeline";
import { GlossaryHint } from "@/components/GlossaryHint/GlossaryHint";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { PageMap } from "@/components/PageMap/PageMap";
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
    const sections = [
        { id: "dados", label: "Dados" },
        { id: "antes", label: "Antes da presidência" },
        { id: "politicas", label: "Políticas" },
        { id: "mundo", label: "Outros países" },
        { id: "opiniao", label: "O que a população achava" },
        { id: "investigacoes", label: "Investigações" },
        ...(page.endOfTerm ? [{ id: "fim-do-mandato", label: "Fim do mandato" }] : []),
        { id: "depois", label: "Depois da presidência" },
        { id: "curiosidades", label: "Você sabia?" },
    ];

    return (
        <PageTransition>
            <PageMap sections={sections} />
            <main id="conteudo" className={styles.page}>
                <nav className={styles.crumb} aria-label="Você está em">
                    <Link href="/governantes" transitionTypes={NAV_BACK}>Governantes</Link> <span aria-hidden="true">›</span> {entry.name}
                </nav>

                <section className={styles.intro} aria-labelledby="ruler-title">
                    <div className={styles.identity}>
                        {entry.portrait && (
                            <figure className={styles.portrait}>
                                <Image src={entry.portrait.file} alt={`Retrato oficial de ${entry.name}`} width={240} height={320} sizes="140px" priority />
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
                        <GlossaryText text={page.summary} />
                    </p>
                    <ListenButton text={`${entry.name}. ${plainGlossaryText(page.summary)}`} />
                </section>

                <GlossaryHint />

                <section id="dados" className={styles.block} aria-labelledby="dados-title">
                    <p className={styles.sectionKicker}>A pessoa</p>
                    <h2 id="dados-title" className={styles.title}>
                        Dados pessoais e mandato
                    </h2>
                    <dl className={styles.facts}>
                        {page.facts.rows.map((row) => (
                            <div key={row.label}>
                                <dt>{row.label}</dt>
                                <dd>{row.value}</dd>
                            </div>
                        ))}
                    </dl>
                    <EditorialSources sources={page.facts.sources} />
                </section>

                <section id="antes" className={styles.block} aria-labelledby="antes-title">
                    <p className={styles.sectionKicker}>A pessoa</p>
                    <h2 id="antes-title" className={styles.title}>
                        Antes da presidência
                    </h2>
                    <EditorialTimeline entries={page.before} />
                </section>

                <section id="politicas" className={styles.block} aria-labelledby="politicas-title">
                    <p className={styles.sectionKicker}>O governo</p>
                    <h2 id="politicas-title" className={styles.title}>
                        Principais políticas
                    </h2>
                    <p className={styles.text}>{page.policies.intro}</p>
                    <EditorialTimeline entries={page.policies.entries} />
                </section>

                <section id="mundo" className={styles.block} aria-labelledby="mundo-title">
                    <p className={styles.sectionKicker}>O governo</p>
                    <h2 id="mundo-title" className={styles.title}>
                        Relações com outros países
                    </h2>
                    <EditorialTimeline entries={page.world} />
                </section>

                <section id="opiniao" className={styles.block} aria-labelledby="opiniao-title">
                    <p className={styles.sectionKicker}>O governo</p>
                    <h2 id="opiniao-title" className={styles.title}>
                        O que a população achava
                    </h2>
                    <p className={styles.text}>
                        <GlossaryText text={page.opinion.intro} />
                    </p>
                    <ApprovalChart
                        points={page.opinion.points}
                        description={`Avaliação do governo: ${page.opinion.points.map((point) => `${point.good}% em ${point.label}`).join(", ")}.`}
                    />
                    <p className={styles.text}>
                        <GlossaryText text={page.opinion.note} />
                    </p>
                </section>

                <section id="investigacoes" className={styles.block} aria-labelledby="investigacoes-title">
                    <p className={styles.sectionKicker}>Na Justiça</p>
                    <h2 id="investigacoes-title" className={styles.title}>
                        Investigações e processos
                    </h2>
                    <p className={styles.text}>
                        <GlossaryText text={page.cases.intro} />
                    </p>
                    <CaseList cases={page.cases.items} gender={page.grammaticalGender} />
                </section>

                {page.endOfTerm && (
                    <section id="fim-do-mandato" className={styles.block} aria-labelledby="fim-title">
                        <p className={styles.sectionKicker}>No Congresso</p>
                        <h2 id="fim-title" className={styles.title}>
                            {page.endOfTerm.heading}
                        </h2>
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
                    </section>
                )}

                <section id="depois" className={styles.block} aria-labelledby="depois-title">
                    <p className={styles.sectionKicker}>Depois do cargo</p>
                    <h2 id="depois-title" className={styles.title}>
                        Depois da presidência
                    </h2>
                    <EditorialTimeline entries={page.after.entries} />
                    {page.after.money.map((block) => (
                        <div key={block.label} className={styles.money}>
                            <h3 className={styles.moneyLabel}>{block.label}</h3>
                            {block.figures.length > 0 && (
                                <div className={styles.figures}>
                                    {block.figures.map((figure) => (
                                        <p key={figure.value} className={styles.figure}>
                                            <strong>{figure.value}</strong> {figure.caption}
                                        </p>
                                    ))}
                                </div>
                            )}
                            {block.explanation.map((statement) => (
                                <StatementText key={statement.text} statement={statement} />
                            ))}
                        </div>
                    ))}
                </section>

                <section id="curiosidades" className={styles.block} aria-labelledby="curiosidades-title">
                    <p className={styles.sectionKicker}>Curiosidades</p>
                    <h2 id="curiosidades-title" className={styles.title}>
                        Você sabia?
                    </h2>
                    <div className={styles.field}>
                        <ul className={styles.trivia}>
                            {page.trivia.map((statement) => (
                                <li key={statement.text}>
                                    <StatementText statement={statement} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <footer className={styles.review}>
                    <p>
                        Fontes consultadas e texto revisado em {formatDay(page.reviewedOn)}. Esta página segue regras públicas de neutralidade: fatos
                        com fonte, e opiniões sempre com o nome de quem as defende.
                    </p>
                    <p>
                        <a href={`${REPOSITORY_URL}/commits/main/${page.contentFile}`}>Ver o histórico de alterações deste texto</a> no repositório
                        público do polar.
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