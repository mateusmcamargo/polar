import type { Metadata } from "next";
import { listPlenaryVoteGroups } from "@polar/db";
import { listSummarizedPropositionIds } from "@polar/db/vote-summaries";
import { DataGate } from "@/components/DebugDataToggle/DataGate";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import { VoteSearch } from "@/components/VoteSearch/VoteSearch";
import styles from "./page.module.scss";

// every ingestion runs at most once a day, and runs mark the pages stale through /api/revalidate
export const revalidate = 86400;

const DADOS_ABERTOS_URL = "https://dadosabertos.camara.leg.br/";

export const metadata: Metadata = {
    title: "Votações do plenário",
    description:
        "As votações nominais do plenário da Câmara dos Deputados, com o resultado, o que cada partido orientou e o voto de cada deputado, com a fonte e a data de coleta.",
    alternates: { canonical: "/votacoes" },
};

const LISTEN_TEXT =
    "Votações do plenário da Câmara. Aqui estão as votações em que o voto de cada deputado ficou registrado. Escolha uma proposta para ver o resultado, o que cada partido orientou e como cada deputado votou.";

export default async function VotesPage() {
    const data = await listPlenaryVoteGroups();

    return (
        <PageTransition>
            <main id="conteudo" className={styles.page}>
                <section className={styles.intro} aria-labelledby="votes-title">
                    <p className={styles.kicker}>Plenário da Câmara</p>
                    <h1 id="votes-title" className={styles.name}>
                        Votações
                    </h1>
                    <p className={styles.lead}>
                        <GlossaryText text="Aqui estão as [[votacao-nominal|votações nominais]] do [[plenario|plenário]]: nelas, o voto de cada deputado fica registrado. As [[votacao-simbolica|votações simbólicas]] não aparecem, porque ninguém vota pelo nome." />
                    </p>
                    <div className={styles.actions}>
                        <ListenButton text={LISTEN_TEXT} />
                    </div>
                </section>

                <section className={styles.block} aria-labelledby="list-title">
                    <p className={styles.sectionKicker}>Por proposta</p>
                    <h2 id="list-title" className={styles.title}>
                        Todas as votações
                    </h2>
                    <p className={styles.text}>
                        Cada linha é uma proposta. Toque nela para entender a proposta, ou em &ldquo;Mostrar todas as votações&rdquo; para ver cada uma.
                    </p>
                    <DataGate skeleton={<SkeletonRows count={5} hasMeta hasValue />}>
                        <VoteSearch data={data} summaryPropositionIds={listSummarizedPropositionIds()} />
                        <SourceNote sourceName="Câmara dos Deputados, votações nominais do plenário" sourceUrl={DADOS_ABERTOS_URL} collectedAt={data.collectedAt} />
                    </DataGate>
                </section>
            </main>
        </PageTransition>
    );
}