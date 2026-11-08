import { parseGlossaryText } from "@polar/db/glossary";
import { markAmounts } from "@/components/AmountMark/AmountMark";
import styles from "./GlossaryText.module.scss";

export const GLOSSARY_PAGE_PATH = "/glossario";

export function glossaryEntryAnchor(id: string): string {
    return `termo-${id}`;
}

interface GlossaryTextProps {
    text: string;
    // marks the amounts of money and the large numbers of the text like a pen highlight (AmountMark)
    highlightNumbers?: boolean;
}

// text with [[id|shown text]] terms; each term is a link to the glossary page, which GlossaryDialog opens as a panel
// instead when JavaScript is running, so the term also works without it
export function GlossaryText({ text, highlightNumbers = false }: Readonly<GlossaryTextProps>) {
    return (
        <>
            {parseGlossaryText(text).map((segment, index) =>
                segment.kind === "text" ? (
                    highlightNumbers ? (
                        markAmounts(segment.value)
                    ) : (
                        segment.value
                    )
                ) : (
                    <a
                        key={`${segment.id}-${index}`}
                        className={styles.term}
                        href={`${GLOSSARY_PAGE_PATH}#${glossaryEntryAnchor(segment.id)}`}
                        data-glossary-term={segment.id}
                        data-reveal="mark"
                        aria-haspopup="dialog"
                    >
                        {segment.label}
                        <span className="visually-hidden"> (explicação no dicionário)</span>
                    </a>
                ),
            )}
        </>
    );
}