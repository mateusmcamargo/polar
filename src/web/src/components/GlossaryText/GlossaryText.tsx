import { parseGlossaryText } from "@polar/db/glossary";
import styles from "./GlossaryText.module.scss";

export const GLOSSARY_PAGE_PATH = "/glossario";

export function glossaryEntryAnchor(id: string): string {
    return `termo-${id}`;
}

interface GlossaryTextProps {
    text: string;
}

// text with [[id|shown text]] terms; each term is a link to the glossary page, which GlossaryDialog opens as a panel
// instead when JavaScript is running, so the term also works without it
export function GlossaryText({ text }: Readonly<GlossaryTextProps>) {
    return (
        <>
            {parseGlossaryText(text).map((segment, index) =>
                segment.kind === "text" ? (
                    segment.value
                ) : (
                    <a
                        key={`${segment.id}-${index}`}
                        className={styles.term}
                        href={`${GLOSSARY_PAGE_PATH}#${glossaryEntryAnchor(segment.id)}`}
                        data-glossary-term={segment.id}
                        aria-haspopup="dialog"
                    >
                        {segment.label}
                        <span className="visually-hidden"> (explicação no glossário)</span>
                    </a>
                ),
            )}
        </>
    );
}