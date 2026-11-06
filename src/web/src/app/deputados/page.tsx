import type { Metadata } from "next";
import { getChamberComposition, listDeputiesForSearch } from "@polar/db";
import { DeputySearch } from "@/components/DeputySearch/DeputySearch";
import { ListenButton } from "@/components/ListenButton/ListenButton";
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
    const [{ deputies, collectedAt }, chamber] = await Promise.all([listDeputiesForSearch(), getChamberComposition()]);
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
            </main>
        </PageTransition>
    );
}