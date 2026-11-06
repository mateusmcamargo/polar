import Link from "next/link";
import { BookOpen, ChevronRight, Landmark, Users, type LucideIcon } from "lucide-react";
import { NAV_FORWARD, PageTransition } from "@/components/PageTransition/PageTransition";
import styles from "./page.module.scss";

interface Shortcut {
    href: string;
    label: string;
    title: string;
    text: string;
    icon: LucideIcon;
}

const SHORTCUTS: readonly Shortcut[] = [
    {
        href: "/deputados",
        label: "Câmara dos Deputados",
        title: "Deputados",
        text: "Encontre o seu deputado pelo nome ou pelo estado. Veja como vota, se vai às sessões e como usa o dinheiro público.",
        icon: Users,
    },
    {
        href: "/governantes",
        label: "Galeria",
        title: "Governantes",
        text: "Reis, imperadores, regentes, presidentes e primeiros-ministros que governaram o Brasil desde 1808, com a história de cada um e as fontes.",
        icon: Landmark,
    },
    {
        href: "/glossario",
        label: "Dicionário",
        title: "Glossário",
        text: "O significado das palavras difíceis da política, em linguagem simples.",
        icon: BookOpen,
    },
];

// entry point of the site: one shortcut per area, the search and the chamber live on /deputados
export default function HomePage() {
    return (
        <PageTransition>
            <main id="conteudo" className={styles.page}>
                <section className={styles.intro} aria-labelledby="home-title">
                    <h1 id="home-title" className={styles.title}>
                        A política brasileira, clara e direta
                    </h1>
                    <p className={styles.lead}>Dados oficiais sobre quem governa e quem faz as leis, explicados sem complicação.</p>
                </section>
                <nav aria-label="Áreas do polar">
                    <ul className={styles.shortcuts}>
                        {SHORTCUTS.map(({ href, label, title, text, icon: Icon }) => (
                            <li key={href}>
                                <Link href={href} className={styles.shortcut} transitionTypes={NAV_FORWARD}>
                                    <Icon className={styles.icon} aria-hidden="true" />
                                    <span className={styles.body}>
                                        <span className={styles.label}>{label}</span>
                                        <span className={styles.name}>{title}</span>
                                        <span className={styles.text}>{text}</span>
                                    </span>
                                    <ChevronRight className={styles.chevron} aria-hidden="true" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className={styles.noticeField}>
                    <div className={styles.notice}>
                        <p className={styles.noticeLabel}>
                            <strong>Em construção</strong>
                        </p>
                        <p>Todas as informações vêm de fontes oficiais, sempre com o link e a data da coleta.</p>
                    </div>
                </div>
            </main>
        </PageTransition>
    );
}