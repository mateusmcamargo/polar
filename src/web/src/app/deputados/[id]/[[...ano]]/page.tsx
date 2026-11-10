import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CircleAlert } from "lucide-react";
import { METRICS_START_DATE, MIN_COUNTED_VOTES, type DeputyProfile, type DeputyYear, type PeerComparison as PeerComparisonData } from "@polar/db";
import { AttendanceRules } from "@/components/AttendanceRules/AttendanceRules";
import { AttendanceSummary, AttendanceSummarySkeleton } from "@/components/AttendanceSummary/AttendanceSummary";
import { DataGate } from "@/components/DebugDataToggle/DataGate";
import { DeputyTimeline, DeputyTimelineSkeleton } from "@/components/DeputyTimeline/DeputyTimeline";
import { BRAZILIAN_STATES } from "@/components/DeputySearch/brazilianStates";
import { FrontList, FrontListSkeleton } from "@/components/FrontList/FrontList";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { BenefitList, BenefitListSkeleton, QuotaSummary, QuotaSummarySkeleton } from "@/components/MoneySummary/MoneySummary";
import { PageMap } from "@/components/PageMap/PageMap";
import { PageSection } from "@/components/PageSection/PageSection";
import { PeerComparison, PeerComparisonSkeleton, type PeerRuler } from "@/components/PeerComparison/PeerComparison";
import { OrganList, OrganListSkeleton } from "@/components/OrganList/OrganList";
import { NAV_BACK, NAV_FORWARD, PageTransition } from "@/components/PageTransition/PageTransition";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { PartyHistory, PartyHistorySkeleton } from "@/components/PartyHistory/PartyHistory";
import { RecentVotes, RecentVotesSkeleton } from "@/components/RecentVotes/RecentVotes";
import { Skeleton } from "@/components/Skeleton/Skeleton";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import { SummaryMetrics, SummaryMetricsSkeleton, type SummaryMetric } from "@/components/SummaryMetrics/SummaryMetrics";
import { YearSelector } from "@/components/YearSelector/YearSelector";
import { DeputyHeaderSkeleton } from "../DeputyHeaderSkeleton";
import { loadDeputyMovement, loadDeputyYear, loadPeerComparison, resolveProfileYear, type ResolvedProfile } from "../deputyProfileData";
import styles from "./page.module.scss";

// every ingestion runs at most once a day, and runs mark the pages stale through /api/revalidate
export const revalidate = 86400;

// no profile is built with the site: each one is rendered on its first visit and then kept, see ARCHITECTURE.md
export function generateStaticParams(): { id: string; ano?: string[] }[] {
    return [];
}

// vote metrics need at least 30 counted votes, see "Metrics" in USE_CASES.md
const MINIMUM_COUNTED_VOTES = 30;
const DADOS_ABERTOS_URL = "https://dadosabertos.camara.leg.br/";
const QUOTA_URL = "https://www.camara.leg.br/transparencia/gastos-parlamentares";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

// situations as published by the Câmara, in plain words
const OUT_OF_OFFICE_REASONS: Readonly<Record<string, string>> = {
    Licença: "licença",
    Afastado: "afastamento",
    VACANCIA: "o cargo ficou vago",
    SUPLENCIA: "voltou a ser suplente",
    FIM_MANDATO: "fim do mandato",
    SUSPENSO: "suspensão",
    CONVOCADO: "convocação",
};

interface ProfilePageProps {
    params: Promise<{ id: string; ano?: string[] }>;
}

async function resolveProfile(params: ProfilePageProps["params"]): Promise<ResolvedProfile | null> {
    const { id, ano } = await params;
    return resolveProfileYear(id, ano);
}

function statePhrase(stateCode: string): string {
    const state = BRAZILIAN_STATES[stateCode];
    if (!state) {
        return stateCode;
    }
    const preposition = state.article === "o" ? "do" : state.article === "a" ? "da" : "de";
    return `${preposition} ${state.name}`;
}

// "por Goiás", "pelo Paraná", "pela Bahia"
function forState(stateCode: string): string {
    const state = BRAZILIAN_STATES[stateCode];
    if (!state) {
        return `por ${stateCode}`;
    }
    const preposition = state.article === "o" ? "pelo" : state.article === "a" ? "pela" : "por";
    return `${preposition} ${state.name}`;
}

// with the sex recorded by the Câmara the sentence names the office, otherwise it avoids grammatical gender
function roleSentence(profile: DeputyProfile): string {
    const since = profile.inOfficeSince ? `, desde ${dateFormat.format(profile.inOfficeSince)}` : "";
    if (profile.sex) {
        const office = profile.sex === "FEMALE" ? "deputada federal" : "deputado federal";
        return profile.isInOffice
            ? `${office.charAt(0).toUpperCase()}${office.slice(1)} ${forState(profile.stateCode)} nesta legislatura${since}.`
            : `Foi ${office} ${forState(profile.stateCode)} nesta legislatura.`;
    }
    return `${profile.isInOffice ? "Representa" : "Representou"} ${stateWithArticle(profile.stateCode)} na Câmara dos Deputados${
        profile.isInOffice ? ` nesta legislatura${since}` : " nesta legislatura"
    }.`;
}

// "Goiás", "o Paraná", "a Bahia"
function stateWithArticle(stateCode: string): string {
    const state = BRAZILIAN_STATES[stateCode];
    if (!state) {
        return stateCode;
    }
    return state.article ? `${state.article} ${state.name}` : state.name;
}

const LOWERCASE_NAME_WORDS = new Set(["da", "das", "de", "do", "dos", "e"]);

// the Câmara publishes civil names in uppercase, which is harder to read
function readableName(name: string): string {
    return name
        .toLowerCase()
        .split(" ")
        .map((word, index) => (index > 0 && LOWERCASE_NAME_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(" ");
}

function percent(part: number, whole: number): number {
    return Math.round((part / whole) * 100);
}

function voteMetric(id: string, label: string, aligned: number, counted: number, explanation: string): SummaryMetric {
    const hasEnoughVotes = counted >= MINIMUM_COUNTED_VOTES;
    return {
        id,
        label,
        figure: hasEnoughVotes ? `${percent(aligned, counted)}%` : null,
        base: hasEnoughVotes
            ? `${aligned} de ${counted} votações`
            : `Poucas votações para calcular (${counted} de no mínimo ${MINIMUM_COUNTED_VOTES})`,
        explanation,
    };
}

function buildSummaryMetrics(yearData: DeputyYear): SummaryMetric[] {
    const { metrics, annualPage } = yearData;
    const plenary = annualPage?.plenary;
    const plenaryDays = plenary ? plenary.present + plenary.justifiedAbsences + plenary.unjustifiedAbsences : 0;
    return [
        voteMetric(
            "party",
            "Com o partido",
            metrics.partyAligned,
            metrics.partyVotes,
            "Mostra em quantas votações do plenário o voto foi igual ao da maioria do próprio partido naquele dia. Contamos só as votações em que o partido teve uma maioria clara.",
        ),
        voteMetric(
            "government",
            "Com o governo",
            metrics.governmentAligned,
            metrics.governmentVotes,
            "Mostra em quantas votações do plenário o voto foi igual ao que o líder do governo pediu. Contamos só as votações com voto registrado e com uma orientação do governo.",
        ),
        {
            id: "attendance",
            label: "Presença no plenário",
            figure: plenary && plenaryDays > 0 ? `${percent(plenary.present, plenaryDays)}%` : null,
            base: plenary && plenaryDays > 0 ? `${plenary.present} de ${plenaryDays} dias` : "Sem registro neste ano",
            explanation:
                "Mostra em quantos dias de votação no plenário a presença foi registrada. Faltas justificadas e faltas sem justificativa contam como ausência.",
        },
    ];
}

// the four numbers of the year of this deputy against the same numbers of every deputy with a rate in that year; null when this deputy
// is not among them (fewer than the minimum of counted votes), because then there is no rate to place on the ruler
function buildPeerRulers(peers: PeerComparisonData, deputyId: number): PeerRuler[] | null {
    const own = peers.points.find((point) => point.deputyId === deputyId);
    if (!own) {
        return null;
    }
    const column = (pick: (point: PeerComparisonData["points"][number]) => number | null) =>
        peers.points.flatMap((point) => {
            const value = pick(point);
            return value === null ? [] : [value];
        });
    return [
        { id: "government", label: "Votou como o governo", kind: "rate", values: column((point) => point.governmentRate), own: own.governmentRate },
        { id: "quota", label: "Cota parlamentar", kind: "money", values: column((point) => point.quota), own: own.quota },
        { id: "office", label: "Verba de gabinete usada", kind: "money", values: column((point) => point.officeBudgetSpent), own: own.officeBudgetSpent },
        { id: "housing", label: "Auxílio-moradia", kind: "money", values: column((point) => point.housingAllowance), own: own.housingAllowance },
    ];
}

function listenText(profile: DeputyProfile, yearData: DeputyYear | null, summaryMetrics: SummaryMetric[]): string {
    const parts = [`${profile.politicalName}. ${roleSentence(profile)}`];
    if (profile.party) {
        parts.push(`Partido: ${profile.party.name}.`);
    }
    if (yearData) {
        parts.push(`Em ${yearData.year}:`);
        for (const metric of summaryMetrics) {
            if (metric.figure) {
                parts.push(`${metric.label}, ${metric.figure}.`);
            }
        }
        if (yearData.quota) {
            parts.push(`Gastos da cota parlamentar: ${Math.round(yearData.quota.total / 1000)} mil reais.`);
        }
    }
    return parts.join(" ");
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const resolved = await resolveProfile(params);
    if (!resolved) {
        return { title: "Perfil não encontrado" };
    }
    const { profile, year } = resolved;
    const party = profile.party ? `${profile.party.acronym}, ` : "";
    return {
        title: year && year !== profile.years[0] ? `${profile.politicalName} em ${year}` : profile.politicalName,
        description: `Votos, presença e gastos de ${profile.politicalName} (${party}${profile.stateCode}), com dados oficiais da Câmara dos Deputados.`,
        alternates: { canonical: year && year !== profile.years[0] ? `/deputados/${profile.id}/${year}` : `/deputados/${profile.id}` },
    };
}

export default async function DeputyProfilePage({ params }: ProfilePageProps) {
    const resolved = await resolveProfile(params);
    if (!resolved) {
        notFound();
    }
    const { profile, year } = resolved;
    const [yearData, peers, movement] = await Promise.all([
        year ? loadDeputyYear(profile.id, profile.stateCode, year) : null,
        year ? loadPeerComparison(year) : null,
        loadDeputyMovement(profile.id),
    ]);
    const peerRulers = peers ? buildPeerRulers(peers, profile.id) : null;
    const summaryMetrics = yearData ? buildSummaryMetrics(yearData) : [];
    const state = statePhrase(profile.stateCode);
    const outOfOfficeReason = profile.outOfOffice ? OUT_OF_OFFICE_REASONS[profile.outOfOffice.situation] : undefined;
    const showsCivilName = profile.civilName && profile.civilName.toLowerCase() !== profile.politicalName.toLowerCase();

    return (
        <PageTransition>
            <PageMap />
            <main id="conteudo" className={styles.page}>
                <DataGate skeleton={<DeputyHeaderSkeleton photo="large" />}>
                    <nav className={styles.crumb} aria-label="Você está em">
                        <Link href="/deputados" transitionTypes={NAV_BACK}>Deputados</Link> <span aria-hidden="true">›</span> {profile.politicalName}
                    </nav>

                    <section className={styles.profile} aria-labelledby="deputy-name">
                        {profile.photoUrl ? (
                            <Image
                                className={styles.photo}
                                src={profile.photoUrl}
                                alt={`Foto de ${profile.politicalName}`}
                                width={140}
                                height={187}
                                priority
                            />
                        ) : (
                            <span className={styles.photo} aria-hidden="true" />
                        )}
                        <div className={styles.identity}>
                            <h1 id="deputy-name" className={styles.name}>
                                {profile.politicalName}
                            </h1>
                            {showsCivilName && <p className={styles.civilName}>Nome de registro: {readableName(profile.civilName ?? "")}</p>}
                            <div className={styles.tags}>
                                <PartyBadge acronym={profile.party?.acronym ?? null} />
                                <span className={styles.tag}>{BRAZILIAN_STATES[profile.stateCode]?.name ?? profile.stateCode}</span>
                                <span className={styles.tag}>
                                    <span className={profile.isInOffice ? styles.dotOn : styles.dotOff} aria-hidden="true" />
                                    {profile.isInOffice ? "No cargo" : "Fora do cargo"}
                                </span>
                            </div>
                        </div>
                        {profile.outOfOffice && (
                            <p className={styles.outOfOffice}>
                                <CircleAlert aria-hidden="true" />
                                <span>
                                    <strong>Fora do cargo desde {dateFormat.format(profile.outOfOffice.since)}.</strong>
                                    {outOfOfficeReason && ` Motivo registrado pela Câmara: ${outOfOfficeReason}.`}
                                    {profile.years.length > 0 && " Os dados abaixo cobrem o período no cargo."}
                                </span>
                            </p>
                        )}
                        <p className={styles.intro}>
                            {roleSentence(profile)} Esta página mostra os votos no plenário, a presença e o uso do dinheiro público.
                        </p>
                        <div className={styles.actions}>
                            {year && profile.years.length > 1 && <YearSelector basePath={`/deputados/${profile.id}`} years={profile.years} selectedYear={year} />}
                            <ListenButton text={listenText(profile, yearData, summaryMetrics)} />
                        </div>
                    </section>
                </DataGate>

                {yearData ? (
                    <>
                        <PageSection id="summary" icon="summary" kicker={`Em ${yearData.year}`} title="Resumo do ano">
                            <DataGate skeleton={<SummaryMetricsSkeleton />}>
                                <SummaryMetrics metrics={summaryMetrics} />
                                <SourceNote
                                    sourceName="Câmara dos Deputados, votações nominais do plenário"
                                    sourceUrl={DADOS_ABERTOS_URL}
                                    collectedAt={yearData.votesCollectedAt}
                                />
                                {yearData.annualPage && (
                                    <SourceNote
                                        sourceName={`Presença: Câmara dos Deputados, página do perfil (${yearData.year})`}
                                        sourceUrl={yearData.annualPage.sourceUrl}
                                        collectedAt={yearData.annualPage.collectedAt}
                                    />
                                )}
                            </DataGate>
                        </PageSection>

                        <PageSection id="votes" icon="votes" kicker={`Em ${yearData.year}`} title="Últimas votações" label="Últimas votações">
                            <p className={styles.lead}>
                                Os votos nas últimas decisões do plenário. Escolha uma linha para ver cada votação sobre aquela proposta.
                            </p>
                            <DataGate skeleton={<RecentVotesSkeleton />}>
                                {yearData.latestVoteGroups.length > 0 ? (
                                    <RecentVotes groups={yearData.latestVoteGroups} />
                                ) : (
                                    <p className={styles.empty}>Nenhuma votação nominal do plenário com voto registrado neste ano.</p>
                                )}
                                <SourceNote
                                    sourceName="Câmara dos Deputados, votações nominais do plenário"
                                    sourceUrl={DADOS_ABERTOS_URL}
                                    collectedAt={yearData.votesCollectedAt}
                                />
                                {yearData.latestVoteGroups.length > 0 && (
                                    <Link
                                        className={styles.more}
                                        transitionTypes={NAV_FORWARD}
                                        href={
                                            yearData.year === profile.years[0]
                                                ? `/deputados/${profile.id}/votacoes`
                                                : `/deputados/${profile.id}/votacoes/${yearData.year}`
                                        }
                                    >
                                        Ver todas as votações de {yearData.year}
                                        <ChevronRight aria-hidden="true" />
                                        <LinkPending />
                                    </Link>
                                )}
                            </DataGate>
                        </PageSection>

                        <PageSection id="attendance" icon="attendance" kicker={`Em ${yearData.year}`} title="Presença">
                            <p className={styles.lead}>
                                Quantas vezes houve presença nos dias de votação do plenário e nas reuniões das comissões.
                            </p>
                            <DataGate skeleton={<AttendanceSummarySkeleton />}>
                                {yearData.annualPage ? (
                                    <>
                                        <AttendanceSummary plenary={yearData.annualPage.plenary} committees={yearData.annualPage.committees} />
                                        <SourceNote
                                            sourceName={`Câmara dos Deputados, página do perfil (${yearData.year})`}
                                            sourceUrl={yearData.annualPage.sourceUrl}
                                            collectedAt={yearData.annualPage.collectedAt}
                                        />
                                        <AttendanceRules year={yearData.year} deputyName={profile.politicalName} breakdown={yearData.committeeAbsences} />
                                    </>
                                ) : (
                                    <p className={styles.empty}>A Câmara não publicou o resumo de presença deste ano.</p>
                                )}
                            </DataGate>
                        </PageSection>

                        <PageSection id="money" icon="money" kicker={`Em ${yearData.year}`} title="Gastos e benefícios">
                            <p className={styles.lead}>
                                A cota parlamentar paga despesas do mandato, como combustível, passagens e divulgação. O limite muda
                                conforme o estado. As médias consideram todos os deputados com algum gasto no ano.
                            </p>
                            <DataGate skeleton={<QuotaSummarySkeleton />}>
                                {yearData.quota ? (
                                    <>
                                        <QuotaSummary deputyName={profile.politicalName} statePhrase={state} quota={yearData.quota} />
                                        <SourceNote
                                            sourceName="Câmara dos Deputados, cota parlamentar (CEAP)"
                                            sourceUrl={QUOTA_URL}
                                            collectedAt={yearData.quota.collectedAt}
                                        />
                                        <Link
                                            className={styles.more}
                                            transitionTypes={NAV_FORWARD}
                                            href={
                                                yearData.year === profile.years[0]
                                                    ? `/deputados/${profile.id}/gastos`
                                                    : `/deputados/${profile.id}/gastos/${yearData.year}`
                                            }
                                        >
                                            Ver todos os gastos de {yearData.year}
                                            <ChevronRight aria-hidden="true" />
                                            <LinkPending />
                                        </Link>
                                    </>
                                ) : (
                                    <p className={styles.empty}>Nenhum gasto da cota parlamentar registrado neste ano.</p>
                                )}
                            </DataGate>
                            {yearData.annualPage && (
                                <>
                                    <h3 className={styles.subtitle}>Benefícios</h3>
                                    <DataGate skeleton={<BenefitListSkeleton />}>
                                        <BenefitList benefits={yearData.annualPage.benefits} />
                                        <SourceNote
                                            sourceName={`Câmara dos Deputados, página do perfil (${yearData.year})`}
                                            sourceUrl={yearData.annualPage.sourceUrl}
                                            collectedAt={yearData.annualPage.collectedAt}
                                        />
                                    </DataGate>
                                </>
                            )}
                        </PageSection>

                        {peers && peerRulers && (
                            <PageSection
                                id="peers"
                                icon="result"
                                kicker={`Em ${yearData.year}`}
                                title={`Comparado com os colegas em ${yearData.year}`}
                                label="Comparado com os colegas"
                            >
                                <DataGate skeleton={<PeerComparisonSkeleton />}>
                                    <PeerComparison deputyName={profile.politicalName} rulers={peerRulers} />
                                    <p className={styles.note}>
                                        Entram os {peers.points.length} deputados com pelo menos {MIN_COUNTED_VOTES} votações contadas em {yearData.year}. Auxílio-moradia R$ 0 quer
                                        dizer que não recebeu no ano.
                                    </p>
                                    <SourceNote
                                        sourceName="Câmara dos Deputados, votações nominais do plenário"
                                        sourceUrl={DADOS_ABERTOS_URL}
                                        collectedAt={peers.votesCollectedAt}
                                    />
                                    <SourceNote sourceName="Câmara dos Deputados, cota parlamentar (CEAP)" sourceUrl={QUOTA_URL} collectedAt={peers.quotaCollectedAt} />
                                    <SourceNote
                                        sourceName={`Câmara dos Deputados, página do perfil de cada deputado (${yearData.year})`}
                                        sourceUrl={DADOS_ABERTOS_URL}
                                        collectedAt={peers.annualCollectedAt}
                                    />
                                </DataGate>
                            </PageSection>
                        )}
                    </>
                ) : (
                    <DataGate skeleton={<Skeleton width="min(24em, 80%)" />}>
                        <p className={styles.empty}>
                            {profile.isInOffice
                                ? "Ainda não há votos, presença ou gastos carregados para este deputado."
                                : `O polar tem votos, presença e gastos a partir de ${METRICS_START_DATE.slice(0, 4)}, e o período no cargo terminou antes.`}
                        </p>
                    </DataGate>
                )}

                {(movement.metrics.length > 0 || movement.monthlyQuota.length > 0) && (
                    <PageSection id="timeline" icon="timeline" kicker="Nesta legislatura" title="Ao longo do mandato">
                        <DataGate skeleton={<DeputyTimelineSkeleton />}>
                            <DeputyTimeline deputyName={profile.politicalName} movement={movement} />
                            <SourceNote
                                sourceName="Câmara dos Deputados, votações nominais do plenário"
                                sourceUrl={DADOS_ABERTOS_URL}
                                collectedAt={movement.votesCollectedAt}
                            />
                            <SourceNote sourceName="Câmara dos Deputados, cota parlamentar (CEAP)" sourceUrl={QUOTA_URL} collectedAt={movement.quotaCollectedAt} />
                            <SourceNote
                                sourceName="Câmara dos Deputados, página do perfil (verba de gabinete e auxílio-moradia)"
                                sourceUrl={profile.sourceUrl}
                                collectedAt={movement.yearBenefits.at(-1)?.collectedAt ?? null}
                            />
                            <SourceNote
                                sourceName="Câmara dos Deputados, página do perfil (salário)"
                                sourceUrl={movement.salary.sourceUrl}
                                collectedAt={new Date(`${movement.salary.collectedAt}T12:00:00-03:00`)}
                            />
                        </DataGate>
                    </PageSection>
                )}

                <PageSection id="organs" icon="organs" kicker="Nesta legislatura" title="Comissões">
                    <p className={styles.lead}>
                        Grupos de deputados que analisam os projetos antes do plenário.
                        {profile.organsCollectedAt && ` Situação em ${dateFormat.format(profile.organsCollectedAt)}.`}
                    </p>
                    <DataGate skeleton={<OrganListSkeleton />}>
                        <OrganList currentOrgans={profile.currentOrgans} pastOrgans={profile.pastOrgans} />
                        <SourceNote
                            sourceName="Câmara dos Deputados, órgãos e membros"
                            sourceUrl={DADOS_ABERTOS_URL}
                            collectedAt={profile.organsCollectedAt}
                        />
                    </DataGate>
                </PageSection>

                <PageSection id="fronts" icon="fronts" kicker="Nesta legislatura" title="Frentes parlamentares">
                    <p className={styles.lead}>
                        Grupos de deputados que se juntam em torno de um tema. Participar de uma frente não é uma votação.
                    </p>
                    <DataGate skeleton={<FrontListSkeleton />}>
                        {profile.fronts.length > 0 ? (
                            <FrontList fronts={profile.fronts} isInOffice={profile.isInOffice} />
                        ) : (
                            <p className={styles.empty}>Não participa de nenhuma frente parlamentar nesta legislatura.</p>
                        )}
                        <SourceNote
                            sourceName="Câmara dos Deputados, frentes parlamentares"
                            sourceUrl={DADOS_ABERTOS_URL}
                            collectedAt={profile.frontsCollectedAt}
                        />
                    </DataGate>
                </PageSection>

                {profile.partyHistory.length > 0 && (
                    <PageSection id="parties" icon="parties" kicker="Nesta legislatura" title="Partidos">
                        <p className={styles.lead}>Desde 1º de fevereiro de 2023.</p>
                        <DataGate skeleton={<PartyHistorySkeleton />}>
                            <PartyHistory periods={profile.partyHistory} />
                            <SourceNote
                                sourceName="Câmara dos Deputados, histórico do deputado"
                                sourceUrl={`${profile.sourceUrl}/historico`}
                                collectedAt={profile.collectedAt}
                            />
                        </DataGate>
                    </PageSection>
                )}
            </main>
        </PageTransition>
    );
}