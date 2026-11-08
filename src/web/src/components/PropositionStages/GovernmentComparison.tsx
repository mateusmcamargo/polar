import { Equal, EqualNot } from "lucide-react";
import styles from "./GovernmentComparison.module.scss";

interface GovernmentComparisonProps {
    // the choice of the deputy, only on the votes of one deputy
    choice?: string;
    governmentOrientation?: string | null;
}

// "Votou como o governo" only when the government oriented and the deputy voted; the wording is neutral on purpose
export function GovernmentComparison({ choice, governmentOrientation }: Readonly<GovernmentComparisonProps>) {
    if (!choice || !governmentOrientation || governmentOrientation === "LIBERATED" || choice === "NOT_VOTED" || choice === "ARTICLE_17") {
        return null;
    }
    const isSame = governmentOrientation === choice;
    return (
        <span className={styles.comparison}>
            {isSame ? <Equal aria-hidden="true" /> : <EqualNot aria-hidden="true" />}
            {isSame ? "Votou como o governo orientou" : "Votou diferente do governo"}
        </span>
    );
}