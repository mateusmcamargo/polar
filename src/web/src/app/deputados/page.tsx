import type { Metadata } from "next";
import { listDeputiesForSearch } from "@polar/db";
import { DeputySearch } from "@/components/DeputySearch/DeputySearch";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import styles from "./page.module.scss";

// the deputies ingestion runs once a day
export const revalidate = 86400;

const PAGE_TITLE = "Encontre seu deputado";
const PAGE_LEAD = "Escolha o seu estado ou digite um nome. Você vê a foto, o partido e o estado de cada deputado federal.";

export const metadata: Metadata = {
    title: PAGE_TITLE,
    description: "Encontre os deputados federais do seu estado, com foto, partido e estado, a partir dos dados oficiais da Câmara dos Deputados.",
};

export default async function DeputiesPage() {
    const { deputies, collectedAt } = await listDeputiesForSearch();

    return (
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
                sourceNote={
                    <SourceNote
                        sourceName="Câmara dos Deputados, Dados Abertos"
                        sourceUrl="https://dadosabertos.camara.leg.br/"
                        collectedAt={collectedAt}
                    />
                }
            />
        </main>
    );
}