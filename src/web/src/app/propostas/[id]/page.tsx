import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PlenaryVote, PropositionDetail } from "@polar/db";
import { findVoteSummary } from "@polar/db/vote-summaries";
import { DataGate } from "@/components/DebugDataToggle/DataGate";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { PageMap } from "@/components/PageMap/PageMap";
import { PageSection } from "@/components/PageSection/PageSection";
import { NAV_BACK, PageTransition } from "@/components/PageTransition/PageTransition";
import { PropositionStages } from "@/components/PropositionStages/PropositionStages";
import { describeStatus } from "@/components/PropositionStages/propositionStatus";
import { splitIntoStages, type Stage } from "@/components/PropositionStages/stages";
import { PROPOSITION_TYPE_NAMES, propositionPageUrl } from "@/components/RecentVotes/propositionTypes";
import { classifyVote } from "@/components/RecentVotes/voteKinds";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import { ResultBadge } from "@/components/VoteBadge/VoteBadge";
import { VoteSummaryAnswers } from "@/components/VoteSummaryAnswers/VoteSummaryAnswers";
import { loadPropositionDetail, parsePropositionId } from "./propositionData";
import styles from "./page.module.scss";

// every ingestion runs at most once a day, and runs mark the pages stale through /api/revalidate
export const revalidate = 86400;

// rendered on the first visit and then kept, like the vote pages, see ARCHITECTURE.md
export function generateStaticParams(): { id: string }[] {
    return [];
}

const DADOS_ABERTOS_URL = "https://dadosabertos.camara.leg.br/";
const DESCRIPTION_SUMMARY_LENGTH = 140;
const shortDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

interface PropositionPageProps {
    params: Promise<{ id: string }>;
}

async function resolveProposition(params: PropositionPageProps["params"]): Promise<PropositionDetail | null> {
    const { id } = await params;
    const propositionId = parsePropositionId(id);
    return propositionId === null ? null : loadPropositionDetail(propositionId);
}

function propositionName(proposition: PropositionDetail["proposition"]): string {
    return `${proposition.typeCode} ${proposition.number}/${proposition.year}`;
}

function shortSummary(summary: string): string {
    return summary.length <= DESCRIPTION_SUMMARY_LENGTH ? summary : `${summary.slice(0, DESCRIPTION_SUMMARY_LENGTH).trimEnd()}…`;
}

function votesText(count: number): string {
    return count === 1 ? "1 votação nominal" : `${count} votações nominais`;
}

// what the Câmara decided in its last stage, from the vote that opened it: "Aprovada no 2º turno, em 16/09/2025"
function describeChamberResult(stages: Stage<PlenaryVote>[]): { word: string; text: string; counts: string } | null {
    const stage = stages.at(-1);
    const vote = stage?.opener ?? stage?.votes.at(-1);
    if (!stage || !vote) {
        return null;
    }
    const kind = classifyVote(vote.description, vote.approved);
    const word = kind.result.split(". ")[0] ?? kind.result;
    const date = shortDateFormat.format(vote.occurredAt);
    return {
        word,
        text: stage.opener ? `${stage.where}, em ${date}` : `na última votação (${kind.label.toLowerCase()}), em ${date}`,
        counts: `Sim ${vote.counts.yes}, Não ${vote.counts.no}`,
    };
}

export async function generateMetadata({ params }: PropositionPageProps): Promise<Metadata> {
    const detail = await resolveProposition(params);
    if (!detail) {
        return { title: "Proposta não encontrada" };
    }
    const { proposition } = detail;
    return {
        title: `${propositionName(proposition)}: o que propõe e como foi votada`,
        description: `${shortSummary(proposition.summary)} Veja o resultado, a situação oficial e cada votação, com a fonte e a data de coleta.`,
        alternates: { canonical: `/propostas/${proposition.id}` },
    };
}

export default async function PropositionPage({ params }: PropositionPageProps) {
    const detail = await resolveProposition(params);
    if (!detail) {
        notFound();
    }
    const { proposition, votes, votesCollectedAt } = detail;
    const name = propositionName(proposition);
    const stages = splitIntoStages(votes);
    const chamberResult = describeChamberResult(stages);
    const status = describeStatus(proposition.situation, proposition.situationAt, proposition.dispatch);
    const summary = findVoteSummary(proposition.id);
    const isReviewed = summary?.status === "reviewed";
    const typeName = PROPOSITION_TYPE_NAMES[proposition.typeCode] ?? proposition.typeCode;
    const listenText = [
        `${name}. O que ela propõe, segundo a Câmara: ${proposition.summary}`,
        chamberResult ? `Na Câmara: ${chamberResult.word} ${chamberResult.text}. ${chamberResult.counts}.` : "",
        status ? `Depois da Câmara: ${status.headline.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")}.` : "",
        `${votesText(votes.length)} no plenário.`,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <PageTransition>
            <PageMap />
            <main id="conteudo" className={styles.page}>
                <nav className={styles.crumb} aria-label="Você está em">
                    <Link href="/votacoes" transitionTypes={NAV_BACK}>
                        Votações
                    </Link>{" "}
                    <span aria-hidden="true">›</span> {name}
                </nav>

                <section className={styles.intro} aria-labelledby="proposition-title">
                    <p className={styles.kicker}>{typeName}</p>
                    <h1 id="proposition-title" className={styles.name}>
                        <abbr title={typeName}>{proposition.typeCode}</abbr> {proposition.number}/{proposition.year}
                    </h1>
                    <p className={styles.lead}>
                        <strong>O que ela propõe, segundo a Câmara:</strong> {proposition.summary}
                    </p>
                    <div className={styles.actions}>
                        <ListenButton text={listenText} />
                    </div>
                </section>

                <PageSection id="now" icon="now" kicker="Resultado" title="Como está agora">
                    <DataGate skeleton={<SkeletonRows count={2} />}>
                        <div className={styles.now}>
                            {chamberResult && (
                                <div className={styles.nowRow}>
                                    <p className={styles.nowLabel}>Na Câmara</p>
                                    <p className={styles.headline}>
                                        <ResultBadge word={chamberResult.word} />
                                        <span>{chamberResult.text}</span>
                                    </p>
                                    <p className={styles.detail}>{chamberResult.counts}.</p>
                                </div>
                            )}
                            <div className={styles.nowRow}>
                                <p className={styles.nowLabel}>Depois da Câmara</p>
                                {status ? (
                                    <>
                                        <p className={styles.headline}>
                                            <span>
                                                <GlossaryText text={status.headline} />
                                            </span>
                                        </p>
                                        {status.detail && (
                                            <p className={styles.detail}>
                                                <GlossaryText text={status.detail} />
                                            </p>
                                        )}
                                        <p className={styles.detail}>{status.official}.</p>
                                    </>
                                ) : (
                                    <p className={styles.detail}>A Câmara ainda não informou a situação desta proposta.</p>
                                )}
                            </div>
                        </div>
                        <ul className={styles.links}>
                            {proposition.fullTextUrl && (
                                <li>
                                    <a href={proposition.fullTextUrl}>Ler o texto completo</a>
                                </li>
                            )}
                            <li>
                                <a href={propositionPageUrl(proposition.id)}>Ver a proposta no site da Câmara</a>
                            </li>
                        </ul>
                        <SourceNote sourceName="Câmara dos Deputados, dados abertos" sourceUrl={proposition.sourceUrl} collectedAt={proposition.statusCollectedAt} />
                    </DataGate>
                </PageSection>

                {summary && (
                    <PageSection id="summary" icon="plain" kicker="Em linguagem simples" title="O que muda com esta proposta" label="O que muda">
                        {!isReviewed && (
                            <p className={styles.draftNotice}>
                                <strong>Resumo ainda em revisão.</strong> Foi escrito à mão a partir das fontes listadas, mas ainda não foi conferido. Confira nas fontes antes de
                                confiar.
                            </p>
                        )}
                        <VoteSummaryAnswers summary={summary} sectionId="summary" />
                        <p className={styles.small}>
                            {isReviewed
                                ? `Resumo escrito à mão e revisado em ${shortDateFormat.format(new Date(`${summary.reviewedAt ?? ""}T12:00:00-03:00`))}.`
                                : "Resumo escrito à mão, ainda sem revisão."}{" "}
                            As opiniões são de quem as disse, com o partido entre parênteses, e não do polar.
                        </p>
                    </PageSection>
                )}

                <PageSection id="votes" icon="stages" kicker="No plenário" title="Votação por votação">
                    <p className={styles.text}>
                        <GlossaryText text="Uma proposta pode ser votada em etapas. Em cada [[turno|turno]], os deputados votam o texto principal. Também votam [[destaque|destaques]] (partes do texto votadas separadamente) e [[requerimento|requerimentos]] (pedidos sobre como a votação acontece). Toque numa votação para ver como cada deputado votou." />
                    </p>
                    <DataGate skeleton={<SkeletonRows count={5} hasMeta hasValue />}>
                        <PropositionStages stages={stages} notes={isReviewed ? summary?.voteNotes : undefined} />
                        <SourceNote sourceName="Câmara dos Deputados, votações nominais do plenário" sourceUrl={DADOS_ABERTOS_URL} collectedAt={votesCollectedAt} />
                    </DataGate>
                </PageSection>

                <Link className={styles.back} href="/votacoes" transitionTypes={NAV_BACK}>
                    Voltar às votações
                </Link>
            </main>
        </PageTransition>
    );
}