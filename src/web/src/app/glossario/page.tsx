import type { Metadata } from "next";
import { GLOSSARY, GLOSSARY_ACCESSED_ON } from "@polar/db/glossary";
import { groupByLetter, GlossaryList } from "@/components/GlossaryList/GlossaryList";
import { glossaryEntryAnchor } from "@/components/GlossaryText/GlossaryText";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Dicionário",
    description: "O significado das palavras difíceis da política, em linguagem simples e com a lei ou o órgão de onde vem cada explicação.",
    alternates: { canonical: "/glossario" },
};

const TERM_NAMES: Readonly<Record<string, string>> = Object.fromEntries(GLOSSARY.map((entry) => [entry.id, entry.term]));
const GROUPS = groupByLetter(GLOSSARY);
const ACCESSED_ON_TEXT = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(`${GLOSSARY_ACCESSED_ON}T12:00:00-03:00`));

// the whole glossary as a page: what a term link opens without JavaScript, and a page that can be shared
export default function GlossaryPage() {
    return (
        <PageTransition>
            <main id="conteudo" className={styles.page}>
                <section className={styles.intro} aria-labelledby="glossary-page-title">
                    <p className={styles.kicker}>Palavras da política</p>
                    <h1 id="glossary-page-title" className={styles.title}>
                        Dicionário
                    </h1>
                    <p className={styles.lead}>
                        O significado das palavras difíceis que aparecem no polar, em linguagem simples. Cada explicação mostra a lei ou o órgão de onde
                        ela vem.
                    </p>
                </section>
                <nav className={styles.letters} aria-label="Letras do dicionário">
                    {GROUPS.map((group) => (
                        <a key={group.letter} href={`#letra-${group.letter}`}>
                            {group.letter}
                        </a>
                    ))}
                </nav>
                <GlossaryList groups={GROUPS} idPrefix="" termNames={TERM_NAMES} seeAlsoHref={(id) => `#${glossaryEntryAnchor(id)}`} letterHeading="h2" />
                <p className={styles.note}>Fontes consultadas até {ACCESSED_ON_TEXT}.</p>
            </main>
        </PageTransition>
    );
}