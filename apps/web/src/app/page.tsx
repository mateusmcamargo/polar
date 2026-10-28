import { Logo } from "@/components/Logo/Logo";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import styles from "./page.module.scss";

export default function HomePage() {
    return (
        <>
            <header className={styles.header}>
                <Logo />
                <ThemeToggle />
            </header>
            <main id="conteudo" className={styles.page}>
                <section className={styles.intro} aria-labelledby="home-title">
                    <h1 id="home-title" className={styles.title}>
                        A política brasileira, clara e direta
                    </h1>
                    <p className={styles.lead}>
                        Em breve, você vai poder acompanhar como cada deputado federal vota, se participa das sessões e
                        como usa o dinheiro público.
                    </p>
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
        </>
    );
}