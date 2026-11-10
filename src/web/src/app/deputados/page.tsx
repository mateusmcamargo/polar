import type { Metadata } from "next";
import { getChamberComposition, getPartyMovement, listDeputiesForSearch, MIN_COMMON_VOTES } from "@polar/db";
import { DeputySearch } from "@/components/DeputySearch/DeputySearch";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { PageSection } from "@/components/PageSection/PageSection";
import { PartyAffinity } from "@/components/PartyAffinity/PartyAffinity";
import { PartyMap } from "@/components/PartyMap/PartyMap";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import styles from "./page.module.scss";

// deputies and votes are ingested once a day
export const revalidate = 86400;

const voteDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

const PAGE_TITLE = "Encontre seu deputado";
const PAGE_LEAD = "Digite um nome ou escolha o seu estado. Você vê a foto, o partido e o estado de cada deputado federal, e onde cada um senta na Câmara.";

export const metadata: Metadata = {
    title: PAGE_TITLE,
    description: "Encontre os deputados federais do seu estado, com foto, partido e estado, a partir dos dados oficiais da Câmara dos Deputados.",
};

export default async function DeputiesPage() {
    const [{ deputies, collectedAt }, chamber, movement] = await Promise.all([listDeputiesForSearch(), getChamberComposition(), getPartyMovement()]);
    const periodText =
        chamber.firstVoteAt && chamber.lastVoteAt
            ? `Período: votações do Plenário de ${voteDateFormat.format(chamber.firstVoteAt)} a ${voteDateFormat.format(chamber.lastVoteAt)}.`
            : "Ainda não há votações carregadas para o cálculo.";

    return (
        <PageTransition>
            <main id="conteudo" className={styles.page}>
                <section className={styles.intro} aria-labelledby="page-title">
                    <div className={styles.titleRow}>
                        <h1 id="page-title" className={styles.title}>
                            {PAGE_TITLE}
                        </h1>
                        <ListenButton text={`${PAGE_TITLE}. ${PAGE_LEAD}`} />
                    </div>
                    <p className={styles.lead}>{PAGE_LEAD}</p>
                </section>
                <DeputySearch
                    deputies={deputies}
                    chamber={{
                        seats: chamber.seats,
                        periodText,
                        sourceNote: (
                            <SourceNote
                                sourceName="Câmara dos Deputados, Dados Abertos (deputados, votações e orientações)"
                                sourceUrl="https://dadosabertos.camara.leg.br/"
                                collectedAt={chamber.collectedAt}
                            />
                        ),
                    }}
                    sourceNote={
                        <SourceNote
                            sourceName="Câmara dos Deputados, Dados Abertos"
                            sourceUrl="https://dadosabertos.camara.leg.br/"
                            collectedAt={collectedAt}
                        />
                    }
                />
                <div className={styles.movement}>
                    <PageSection id="mapa-dos-partidos" kicker="Desde 2025" title="Como os partidos se movem" icon="orientation" inMap={false}>
                        <p className={styles.sectionLead}>
                            Cada círculo é um partido. Na horizontal: em quantos % das votações os deputados do partido votaram como o governo pediu. Na vertical: em
                            quantos % votaram como a maioria do próprio partido. A linha fina liga os trimestres anteriores.
                        </p>
                        <PartyMap
                            parties={movement.parties}
                            quarters={movement.quarters}
                            nominalVotes={movement.nominalVotes}
                            votesWithoutResult={movement.votesWithoutResult}
                            sourceNote={
                                <SourceNote
                                    sourceName="Câmara dos Deputados, Dados Abertos (votações, orientações e comissões)"
                                    sourceUrl="https://dadosabertos.camara.leg.br/"
                                    collectedAt={movement.votesCollectedAt}
                                />
                            }
                        />
                    </PageSection>
                    <PageSection id="quem-vota-junto" kicker="Desde 2025" title="Quem vota junto" icon="voters" className={styles.affinity} inMap={false}>
                        <p className={styles.sectionLead}>
                            Escolha um partido. No gráfico, cada ponta é outro partido: quanto mais longe do centro, mais vezes os dois votaram do mesmo lado, em cada
                            100 votações em que tinham uma posição clara. A lista de barras traz os mesmos números.
                        </p>
                        <PartyAffinity
                            parties={movement.parties}
                            quarters={movement.quarters}
                            affinity={movement.affinity}
                            minCommonVotes={MIN_COMMON_VOTES}
                            sourceNote={
                                <SourceNote
                                    sourceName="Câmara dos Deputados, Dados Abertos (votações nominais do Plenário)"
                                    sourceUrl="https://dadosabertos.camara.leg.br/"
                                    collectedAt={movement.votesCollectedAt}
                                />
                            }
                        />
                    </PageSection>
                </div>
            </main>
        </PageTransition>
    );
}