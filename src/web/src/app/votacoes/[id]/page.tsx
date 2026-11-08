import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { PropositionSummary, VoteDetail } from "@polar/db";
import { DataGate } from "@/components/DebugDataToggle/DataGate";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import { PageMap } from "@/components/PageMap/PageMap";
import { PageSection } from "@/components/PageSection/PageSection";
import { NAV_BACK, NAV_FORWARD, PageTransition } from "@/components/PageTransition/PageTransition";
import { OrientationList } from "@/components/OrientationList/OrientationList";
import { PropositionStages } from "@/components/PropositionStages/PropositionStages";
import { splitIntoStages } from "@/components/PropositionStages/stages";
import { PROPOSITION_TYPE_NAMES } from "@/components/RecentVotes/propositionTypes";
import { classifyVote } from "@/components/RecentVotes/voteKinds";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import { VoteHemicycleSkeleton } from "@/components/VoteHemicycle/VoteHemicycle";
import { VoteResult } from "@/components/VoteResult/VoteResult";
import { VoterList } from "@/components/VoterList/VoterList";
import { loadPartyOrder, loadVoteDetail, parseVoteId } from "./voteData";
import styles from "./page.module.scss";

// every ingestion runs at most once a day, and runs mark the pages stale through /api/revalidate
export const revalidate = 86400;

// rendered on the first visit and then kept, like the profile, see ARCHITECTURE.md
export function generateStaticParams(): { id: string }[] {
    return [];
}

const DADOS_ABERTOS_URL = "https://dadosabertos.camara.leg.br/";

const TIME_ZONE = "America/Sao_Paulo";
const longDateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: TIME_ZONE });
const shortDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE });

interface VotePageProps {
    params: Promise<{ id: string }>;
}

async function resolveVote(params: VotePageProps["params"]): Promise<VoteDetail | null> {
    const { id } = await params;
    const voteId = parseVoteId(id);
    return voteId === null ? null : loadVoteDetail(voteId);
}

function propositionName(proposition: PropositionSummary): string {
    return `${proposition.typeCode} ${proposition.number}/${proposition.year}`;
}

function voteTitle(vote: VoteDetail): string {
    const first = vote.propositions[0];
    if (!first) {
        return "Votação do plenário";
    }
    return vote.propositions.length > 1 ? `${propositionName(first)} e mais ${vote.propositions.length - 1}` : propositionName(first);
}

function listenText(vote: VoteDetail, title: string): string {
    const kind = classifyVote(vote.description, vote.approved);
    const result = kind.result.split(". ")[0] ?? kind.result;
    return `${title}, votação do plenário de ${longDateFormat.format(vote.occurredAt)}. ${kind.label}. ${result}: ${vote.counts.yes} votos Sim e ${vote.counts.no} votos Não. ${vote.notVoted} deputados no cargo não têm voto registrado.`;
}

export async function generateMetadata({ params }: VotePageProps): Promise<Metadata> {
    const vote = await resolveVote(params);
    if (!vote) {
        return { title: "Votação não encontrada" };
    }
    const kind = classifyVote(vote.description, vote.approved);
    const title = voteTitle(vote);
    return {
        title: `${title}: votação de ${shortDateFormat.format(vote.occurredAt)}`,
        description: `${kind.label}, ${(kind.result.split(". ")[0] ?? kind.result).toLowerCase()}. Veja o que foi decidido, o que cada grupo orientou e como cada deputado votou, com a fonte e a data de coleta.`,
        alternates: { canonical: `/votacoes/${vote.id}` },
    };
}

export default async function VotePage({ params }: VotePageProps) {
    const vote = await resolveVote(params);
    if (!vote) {
        notFound();
    }
    const partyOrder = await loadPartyOrder();
    const kind = classifyVote(vote.description, vote.approved);
    const title = voteTitle(vote);
    // the first proposition is the one the vote id belongs to, and the votes of the stage are the ones of that proposition
    const mainProposition = vote.propositions[0] ?? null;
    const currentStage = splitIntoStages(vote.propositionVotes).find((stage) => stage.votes.some((stageVote) => stageVote.id === vote.id)) ?? null;
    const propositionHref = mainProposition ? `/propostas/${mainProposition.id}` : null;
    const date = shortDateFormat.format(vote.occurredAt);

    return (
        <PageTransition>
            <PageMap />
            <main id="conteudo" className={styles.page}>
                <nav className={styles.crumb} aria-label="Você está em">
                    <Link href="/votacoes" transitionTypes={NAV_BACK}>
                        Votações
                    </Link>{" "}
                    <span aria-hidden="true">›</span>{" "}
                    {mainProposition && propositionHref ? (
                        <>
                            <Link href={propositionHref} transitionTypes={NAV_BACK}>
                                {propositionName(mainProposition)}
                            </Link>
                            {currentStage && (
                                <>
                                    {" "}
                                    <span aria-hidden="true">›</span> {currentStage.label}
                                </>
                            )}
                        </>
                    ) : (
                        title
                    )}
                </nav>

                <section className={styles.intro} aria-labelledby="vote-title">
                    <p className={styles.kicker}>{shortDateFormat.format(vote.occurredAt)} · Plenário</p>
                    <h1 id="vote-title" className={styles.name}>
                        {vote.propositions.length === 1 && vote.propositions[0] ? (
                            <>
                                <abbr title={PROPOSITION_TYPE_NAMES[vote.propositions[0].typeCode]}>{vote.propositions[0].typeCode}</abbr>{" "}
                                {vote.propositions[0].number}/{vote.propositions[0].year}
                            </>
                        ) : (
                            title
                        )}
                    </h1>
                    <p className={styles.lead}>
                        <strong>{kind.label}.</strong> {vote.description}
                    </p>
                    <div className={styles.actions}>
                        <ListenButton text={listenText(vote, title)} />
                    </div>
                </section>

                {vote.propositions.length > 0 && (
                    <PageSection
                        id="proposition"
                        icon="proposition"
                        kicker="Texto oficial"
                        title={vote.propositions.length === 1 ? "O que a proposta diz" : "As propostas desta votação"}
                        label="A proposta"
                    >
                        <ul className={styles.propositions}>
                            {vote.propositions.map((proposition) => (
                                <li key={proposition.id}>
                                    <p className={styles.propositionName}>
                                        {PROPOSITION_TYPE_NAMES[proposition.typeCode] ?? proposition.typeCode} ({proposition.typeCode}) {proposition.number}/
                                        {proposition.year}
                                    </p>
                                    <p className={styles.ementa}>{proposition.summary}</p>
                                </li>
                            ))}
                        </ul>
                        {mainProposition && currentStage && propositionHref && (
                            <p className={styles.text}>
                                Esta votação é parte {currentStage.partOf} da {propositionName(mainProposition)}.
                            </p>
                        )}
                        {propositionHref && (
                            <Link className={styles.highlightLink} href={propositionHref} transitionTypes={NAV_FORWARD}>
                                Entenda a proposta e veja todas as votações
                                <LinkPending />
                            </Link>
                        )}
                        <p className={styles.small}>A ementa é o resumo oficial da proposta, escrito pela Câmara.</p>
                    </PageSection>
                )}

                <PageSection id="result" icon="result" kicker={`Em ${date}`} title="Resultado">
                    <DataGate skeleton={<SkeletonRows count={3} />}>
                        <VoteResult kind={kind} counts={vote.counts} notVoted={vote.notVoted} />
                        <p className={styles.text}>
                            <GlossaryText text="Esta é uma [[votacao-nominal|votação nominal]]: o voto de cada deputado ficou registrado. Uma proposta pode ter várias votações, e cada uma tem a sua página." />
                        </p>
                        <SourceNote
                            sourceName="Câmara dos Deputados, votações nominais do plenário"
                            sourceUrl={vote.sourceUrl}
                            collectedAt={vote.collectedAt}
                        />
                    </DataGate>
                </PageSection>

                <PageSection id="orientation" icon="orientation" kicker="Antes da votação" title="O que cada grupo orientou">
                    <p className={styles.text}>
                        <GlossaryText text="Antes de votar, os líderes dizem como o grupo deve votar. É a [[orientacao|orientação]]. Cada deputado decide o próprio voto, e a orientação não é obrigatória." />
                    </p>
                    <DataGate skeleton={<SkeletonRows count={5} hasValue />}>
                        <OrientationList orientations={vote.orientations} />
                        <SourceNote
                            sourceName="Câmara dos Deputados, orientações de bancada"
                            sourceUrl={vote.sourceUrl}
                            collectedAt={vote.collectedAt}
                        />
                    </DataGate>
                </PageSection>

                <PageSection id="voters" icon="voters" kicker="Deputado por deputado" title="Como cada deputado votou">
                    <p className={styles.text}>
                        Cada cadeira é um deputado que estava no cargo nesse dia ou que votou. Filtre por estado, partido ou voto para ver quem é.
                    </p>
                    <DataGate
                        skeleton={
                            <>
                                <VoteHemicycleSkeleton />
                                <SkeletonRows count={6} hasValue />
                            </>
                        }
                    >
                        <VoterList seats={vote.seats} partyOrder={partyOrder} voteId={vote.id} occurredAt={vote.occurredAt} />
                        <p className={styles.small}>
                            <strong>Não votou</strong> é o deputado que estava no cargo nesse dia e não tem voto registrado. A Câmara não diz o
                            motivo, que pode ser uma licença médica ou outra razão. Por isso, não é possível saber a razão só por essa marca.
                        </p>
                        <SourceNote
                            sourceName="Câmara dos Deputados, votos individuais e situação dos deputados"
                            sourceUrl={DADOS_ABERTOS_URL}
                            collectedAt={vote.collectedAt}
                        />
                    </DataGate>
                </PageSection>

                {currentStage && propositionHref && (
                    <PageSection id="siblings" icon="siblings" kicker="Na mesma proposta" title="Votações desta etapa">
                        <p className={styles.text}>Uma proposta costuma ter várias votações: o texto principal, os destaques e as emendas.</p>
                        <DataGate skeleton={<SkeletonRows count={3} hasValue />}>
                            <PropositionStages stages={[currentStage]} currentVoteId={vote.id} />
                            <Link className={styles.highlightLink} href={propositionHref} transitionTypes={NAV_FORWARD}>
                                Entenda a proposta e veja todas as votações
                                <LinkPending />
                            </Link>
                            <SourceNote
                                sourceName="Câmara dos Deputados, votações nominais do plenário"
                                sourceUrl={DADOS_ABERTOS_URL}
                                collectedAt={vote.collectedAt}
                            />
                        </DataGate>
                    </PageSection>
                )}

                <Link className={styles.back} href="/votacoes" transitionTypes={NAV_BACK}>
                    Ver todas as votações
                </Link>
            </main>
        </PageTransition>
    );
}