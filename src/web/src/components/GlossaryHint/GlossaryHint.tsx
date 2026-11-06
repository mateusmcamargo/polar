import { BookOpen } from "lucide-react";
import styles from "./GlossaryHint.module.scss";

// shown once near the top of a page that marks glossary terms
export function GlossaryHint() {
    return (
        <p className={styles.hint}>
            <BookOpen aria-hidden="true" />
            Palavras com fundo amarelo e o desenho de um livro têm explicação no dicionário. Toque nelas.
        </p>
    );
}