import type { Thesis } from "@polar/db/rulers";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import styles from "./ThesisPair.module.scss";

interface ThesisPairProps {
    theses: readonly [Thesis, Thesis];
}

// two readings of the same facts in identical panels, so neither side gets more visual weight
export function ThesisPair({ theses }: Readonly<ThesisPairProps>) {
    return (
        <div className={styles.pair}>
            {theses.map((thesis) => (
                <section key={thesis.heading} className={styles.thesis}>
                    <h3 className={styles.heading}>{thesis.heading}</h3>
                    <p className={styles.holders}>{thesis.holders}</p>
                    <ul className={styles.arguments}>
                        {thesis.arguments.map((argument) => (
                            <li key={argument}>
                                <GlossaryText text={argument} />
                            </li>
                        ))}
                    </ul>
                    <EditorialSources sources={thesis.sources} />
                </section>
            ))}
        </div>
    );
}