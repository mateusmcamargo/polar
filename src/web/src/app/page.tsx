import Form from "next/form";
import Link from "next/link";
import { Search } from "lucide-react";
import { getChamberComposition } from "@polar/db";
import { Hemicycle } from "@/components/Hemicycle/Hemicycle";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import styles from "./page.module.scss";

// deputies and votes are ingested once a day
export const revalidate = 86400;

const voteDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

export default async function HomePage() {
    const { seats, firstVoteAt, lastVoteAt, collectedAt } = await getChamberComposition();
    const periodText =
        firstVoteAt && lastVoteAt
            ? `Período: votações do Plenário de ${voteDateFormat.format(firstVoteAt)} a ${voteDateFormat.format(lastVoteAt)}.`
            : "Ainda não há votações carregadas para o cálculo.";

    return (
        <main id="conteudo" className={styles.page}>
            <section className={styles.intro} aria-labelledby="home-title">
                <h1 id="home-title" className={styles.title}>
                    A política brasileira, clara e direta
                </h1>
                <p className={styles.lead}>
                    Acompanhe como cada deputado federal vota, se participa das sessões e como usa o dinheiro público.
                </p>
            </section>
            <Form action="/deputados" className={styles.search} role="search">
                <label htmlFor="home-deputy-name" className={styles.searchLabel}>
                    Encontre seu deputado
                </label>
                <div className={styles.searchRow}>
                    <div className={styles.searchBox}>
                        <Search className={styles.searchIcon} aria-hidden="true" />
                        <input
                            id="home-deputy-name"
                            className={styles.searchInput}
                            type="search"
                            name="nome"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="Digite o nome"
                        />
                    </div>
                    <button type="submit" className={styles.searchButton}>
                        Buscar
                    </button>
                </div>
                <p className={styles.searchHint}>
                    Ou <Link href="/deputados">veja a lista por estado</Link>.
                </p>
            </Form>
            <section className={styles.chamber} aria-labelledby="chamber-title">
                <div className={styles.blockLabel}>
                    <h2 id="chamber-title" className={styles.blockTitle}>
                        Composição da Câmara
                    </h2>
                    <span className={styles.blockCount}>
                        <strong>{seats.length}</strong> cadeiras
                    </span>
                </div>
                <p className={styles.chamberLead}>
                    Cada quadrado é um deputado, na cor do seu partido. Os partidos estão em ordem de quanto votaram como o governo orientou.
                </p>
                <Hemicycle seats={seats} periodText={periodText} />
                <SourceNote
                    sourceName="Câmara dos Deputados, Dados Abertos (deputados, votações e orientações)"
                    sourceUrl="https://dadosabertos.camara.leg.br/"
                    collectedAt={collectedAt}
                />
            </section>
            <div className={styles.noticeField}>
                <div className={styles.notice}>
                    <p className={styles.noticeLabel}>
                        <strong>Em construção</strong>
                    </p>
                    <p>Todas as informações virão de fontes oficiais, sempre com o link e a data da coleta.</p>
                </div>
            </div>
        </main>
    );
}