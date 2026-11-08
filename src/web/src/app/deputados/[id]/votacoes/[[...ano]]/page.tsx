import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { DeputyProfile, DeputyYearVotes } from "@polar/db";
import { listSummarizedPropositionIds } from "@polar/db/vote-summaries";
import { DataGate } from "@/components/DebugDataToggle/DataGate";
import { BRAZILIAN_STATES } from "@/components/DeputySearch/brazilianStates";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { NAV_BACK, PageTransition } from "@/components/PageTransition/PageTransition";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { Skeleton, SkeletonRows } from "@/components/Skeleton/Skeleton";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import { DeputyVotes } from "@/components/VoteGroupList/DeputyVotes";
import { YearSelector } from "@/components/YearSelector/YearSelector";
import { DeputyHeaderSkeleton } from "../../DeputyHeaderSkeleton";
import { loadDeputyVotes, resolveProfileYear, type ResolvedProfile } from "../../deputyProfileData";
import styles from "./page.module.scss";

// every ingestion runs at most once a day, and runs mark the pages stale through /api/revalidate
export const revalidate = 86400;

// rendered on the first visit and then kept, like the profile, see ARCHITECTURE.md
export function generateStaticParams(): { id: string; ano?: string[] }[] {
    return [];
}

const DADOS_ABERTOS_URL = "https://dadosabertos.camara.leg.br/";
const LIST_HINT_MIN_GROUPS = 8;

interface DeputyVotesPageProps {
    params: Promise<{ id: string; ano?: string[] }>;
}

async function resolveVotesPage(params: DeputyVotesPageProps["params"]): Promise<ResolvedProfile | null> {
    const { id, ano } = await params;
    return resolveProfileYear(id, ano);
}

function votesPath(profile: DeputyProfile, year: number | null): string {
    return year && year !== profile.years[0] ? `/deputados/${profile.id}/votacoes/${year}` : `/deputados/${profile.id}/votacoes`;
}

function profilePath(profile: DeputyProfile, year: number | null): string {
    return year && year !== profile.years[0] ? `/deputados/${profile.id}/${year}` : `/deputados/${profile.id}`;
}

function votesWord(count: number): string {
    return count === 1 ? "votação" : "votações";
}

function summaryText(votes: DeputyYearVotes): string {
    const total = votes.voted + votes.notVoted;
    const notVoted =
        votes.notVoted === 0
            ? ""
            : ` Em ${votes.notVoted} ${votesWord(votes.notVoted)} estava no cargo e não tem voto registrado. A Câmara não diz o motivo.`;
    return `Votou em ${votes.voted} de ${total} ${votesWord(total)} nominais do plenário.${notVoted}`;
}

export async function generateMetadata({ params }: DeputyVotesPageProps): Promise<Metadata> {
    const resolved = await resolveVotesPage(params);
    if (!resolved) {
        return { title: "Página não encontrada" };
    }
    const { profile, year } = resolved;
    const party = profile.party ? `${profile.party.acronym}, ` : "";
    return {
        title: `Votações de ${profile.politicalName}${year && year !== profile.years[0] ? ` em ${year}` : ""}`,
        description: `Todas as votações nominais do plenário de ${year ?? "todos os anos"} com o voto de ${profile.politicalName} (${party}${profile.stateCode}), com a fonte e a data de coleta.`,
        alternates: { canonical: votesPath(profile, year) },
    };
}

export default async function DeputyVotesPage({ params }: DeputyVotesPageProps) {
    const resolved = await resolveVotesPage(params);
    if (!resolved) {
        notFound();
    }
    const { profile, year } = resolved;
    const votes = year ? await loadDeputyVotes(profile.id, year) : null;
    const hasVotes = votes !== null && votes.groups.length > 0;

    return (
        <PageTransition>
            <main id="conteudo" className={styles.page}>
                <DataGate skeleton={<DeputyHeaderSkeleton photo="small" />}>
                    <nav className={styles.crumb} aria-label="Você está em">
                        <Link href="/deputados" transitionTypes={NAV_BACK}>
                            Deputados
                        </Link>{" "}
                        <span aria-hidden="true">›</span>{" "}
                        <Link href={profilePath(profile, year)} transitionTypes={NAV_BACK}>
                            {profile.politicalName}
                            <LinkPending />
                        </Link>{" "}
                        <span aria-hidden="true">›</span> Votações
                    </nav>

                    <section className={styles.intro} aria-labelledby="votes-title">
                        <div className={styles.identity}>
                            {profile.photoUrl ? (
                                <Image className={styles.photo} src={profile.photoUrl} alt="" width={64} height={80} priority />
                            ) : (
                                <span className={styles.photo} aria-hidden="true" />
                            )}
                            <div className={styles.names}>
                                <p className={styles.kicker}>Todas as votações</p>
                                <h1 id="votes-title" className={styles.name}>
                                    Votações de {profile.politicalName}
                                </h1>
                                <div className={styles.tags}>
                                    <PartyBadge acronym={profile.party?.acronym ?? null} />
                                    <span className={styles.tag}>{BRAZILIAN_STATES[profile.stateCode]?.name ?? profile.stateCode}</span>
                                </div>
                            </div>
                        </div>
                        <p className={styles.lead}>
                            Cada votação nominal do plenário no ano, com o voto registrado. Toque numa proposta para entendê-la, ou em &ldquo;Mostrar todas as votações&rdquo; para ver cada uma, e numa votação para ver como todos os deputados votaram.
                        </p>
                        <div className={styles.actions}>
                            {year && profile.years.length > 1 && (
                                <YearSelector basePath={`/deputados/${profile.id}/votacoes`} years={profile.years} selectedYear={year} />
                            )}
                            <ListenButton
                                text={
                                    votes && year
                                        ? `${profile.politicalName}. Votações de ${year}. ${summaryText(votes)}`
                                        : `${profile.politicalName}. Nenhuma votação nominal registrada.`
                                }
                            />
                        </div>
                    </section>
                </DataGate>

                <section className={styles.block} aria-labelledby="list-title">
                    <p className={styles.sectionKicker}>{year ? `Em ${year}` : "Até agora"}</p>
                    <h2 id="list-title" className={styles.title}>
                        Propostas votadas
                    </h2>
                    {votes && hasVotes ? (
                        <>
                            <p className={styles.text}>{summaryText(votes)}</p>
                            <DataGate skeleton={<SkeletonRows count={6} hasMeta hasValue />}>
                                <DeputyVotes deputyName={profile.politicalName} groups={votes.groups} collectedAt={votes.collectedAt} summaryPropositionIds={listSummarizedPropositionIds()} scrollClassName={styles.scroll} />
                                {votes.groups.length >= LIST_HINT_MIN_GROUPS && <p className={styles.hint}>Role a lista para ver todas as propostas.</p>}
                                <SourceNote sourceName="Câmara dos Deputados, votações nominais do plenário" sourceUrl={DADOS_ABERTOS_URL} collectedAt={votes.collectedAt} />
                            </DataGate>
                        </>
                    ) : (
                        <DataGate skeleton={<Skeleton width="min(24em, 80%)" />}>
                            <p className={styles.empty}>Nenhuma votação nominal do plenário registrada {year ? `em ${year}` : "até agora"}.</p>
                        </DataGate>
                    )}
                </section>

                <Link className={styles.back} href={profilePath(profile, year)} transitionTypes={NAV_BACK}>
                    Voltar ao perfil de {profile.politicalName}
                    <LinkPending />
                </Link>
            </main>
        </PageTransition>
    );
}