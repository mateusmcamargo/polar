import { Check, CircleDashed, Gavel, Hand, Minus, Unlock, X, type LucideIcon } from "lucide-react";
import styles from "./VoteBadge.module.scss";

interface VoteStyle {
    label: string;
    icon: LucideIcon;
    className: string | undefined;
}

// color is never alone: each choice has its own icon and word, see "Data colors" in DESIGN.md
const VOTE_STYLES: Readonly<Record<string, VoteStyle>> = {
    YES: { label: "Sim", icon: Check, className: styles.yes },
    NO: { label: "Não", icon: X, className: styles.no },
    ABSTENTION: { label: "Abstenção", icon: Minus, className: styles.abstain },
    OBSTRUCTION: { label: "Obstrução", icon: Hand, className: styles.obstruct },
    // solid chip, unlike the absent ones: the presiding deputy is on the seat of the session, not missing from it
    ARTICLE_17: { label: "Presidia a sessão", icon: Gavel, className: styles.presiding },
    // in office that day with no vote registered; the Câmara does not say why
    NOT_VOTED: { label: "Não votou", icon: CircleDashed, className: styles.absent },
    // orientation of a bancada: the leader did not say how to vote, see the glossary
    LIBERATED: { label: "Liberou o voto", icon: Unlock, className: styles.absent },
};

interface VoteBadgeProps {
    choice: string;
    // "fill" is the badge section of a legend button: it takes the whole height and the left side of its container
    size?: "regular" | "small" | "fill";
}

export function VoteBadge({ choice, size = "regular" }: Readonly<VoteBadgeProps>) {
    const voteStyle = VOTE_STYLES[choice] ?? { label: "Ausente", icon: CircleDashed, className: styles.absent };
    const Icon = voteStyle.icon;
    return (
        <span className={`${styles.badge} ${voteStyle.className ?? ""} ${size === "small" ? styles.small : size === "fill" ? styles.fill : ""}`}>
            <Icon aria-hidden="true" />
            {voteStyle.label}
        </span>
    );
}

const POSITIVE_RESULT = /^(aprovad|mantid)/i;
const NEGATIVE_RESULT = /^(rejeitad|retirad|suprimid)/i;

export type ResultTone = "positive" | "negative" | "neutral";

// first word of the result of a vote ("Aprovada", "Rejeitado", "Mantido") told as positive, negative or neutral; a result
// the Câmara did not record stays neutral
export function resultToneOf(word: string): ResultTone {
    return POSITIVE_RESULT.test(word) ? "positive" : NEGATIVE_RESULT.test(word) ? "negative" : "neutral";
}

interface ResultBadgeProps {
    // first word of the result of a vote ("Aprovada", "Rejeitado", "Mantido", "Resultado não informado")
    word: string;
    size?: "regular" | "small";
}

// the result of a vote with the same icon, word and color pairs as a vote; a result the Câmara did not record stays neutral
export function ResultBadge({ word, size = "regular" }: Readonly<ResultBadgeProps>) {
    const tone = resultToneOf(word);
    const isPositive = tone === "positive";
    const isNegative = tone === "negative";
    const Icon = isPositive ? Check : isNegative ? X : CircleDashed;
    const className = isPositive ? styles.yes : isNegative ? styles.no : styles.absent;
    return (
        <span className={`${styles.badge} ${className ?? ""} ${size === "small" ? styles.small : ""}`}>
            {/* the icon sits in a small seal, the same style as the seal of the result card */}
            <span className={styles.seal} aria-hidden="true">
                <Icon />
            </span>
            {word}
        </span>
    );
}