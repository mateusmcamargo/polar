import type { Metadata } from "next";
import { MARCO_GROUPS } from "@polar/db/marcos";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { MarcoCard } from "@/components/MarcoCard/MarcoCard";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Marcos do Brasil",
    description: "Grandes obras, fatos e lugares do Brasil, com datas, números, mapa e fontes oficiais. A primeira página é a Usina de Itaipu.",
    alternates: { canonical: "/marcos" },
};

const LANDMARK_COUNT = MARCO_GROUPS.reduce((total, group) => total + group.entries.length, 0);
const LISTEN_TEXT =
    "Marcos do Brasil. Grandes obras, fatos e lugares do país, com datas, números, mapa e as fontes oficiais. Toque em um marco para ver a história completa.";

export default function LandmarksPage() {
    return (
        <PageTransition>
            <main id="conteudo" className={styles.page}>
                <section className={styles.intro} aria-labelledby="marcos-title">
                    <p className={styles.kicker}>Galeria</p>
                    <h1 id="marcos-title" className={styles.title}>
                        Marcos do Brasil
                    </h1>
                    <p className={styles.lead}>
                        Grandes obras, fatos e lugares do país. Cada página mostra onde fica, quando aconteceu, quanto custou e o que dizem as fontes oficiais.
                    </p>
                    <dl className={styles.counts}>
                        <div>
                            <dt>{LANDMARK_COUNT === 1 ? "marco" : "marcos"}</dt>
                            <dd>{LANDMARK_COUNT}</dd>
                        </div>
                    </dl>
                    <ListenButton text={LISTEN_TEXT} />
                </section>

                {MARCO_GROUPS.map((group) => (
                    <section key={group.id} className={styles.group} aria-labelledby={`grupo-${group.id}`}>
                        <header className={styles.groupHeader}>
                            <h2 id={`grupo-${group.id}`} className={styles.groupName}>
                                {group.name}
                            </h2>
                        </header>
                        <ul className={styles.wall}>
                            {group.entries.map((entry) => (
                                <li key={entry.slug} data-reveal="rise">
                                    <MarcoCard entry={entry} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </main>
        </PageTransition>
    );
}