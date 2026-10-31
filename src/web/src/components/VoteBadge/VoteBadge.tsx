import { Check, CircleDashed, Hand, Minus, X, type LucideIcon } from "lucide-react";
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
    ARTICLE_17: { label: "Presidia a sessão", icon: CircleDashed, className: styles.absent },
};

interface VoteBadgeProps {
    choice: string;
    size?: "regular" | "small";
}

export function VoteBadge({ choice, size = "regular" }: Readonly<VoteBadgeProps>) {
    const voteStyle = VOTE_STYLES[choice] ?? { label: "Ausente", icon: CircleDashed, className: styles.absent };
    const Icon = voteStyle.icon;
    return (
        <span className={`${styles.badge} ${voteStyle.className ?? ""} ${size === "small" ? styles.small : ""}`}>
            <Icon aria-hidden="true" />
            {voteStyle.label}
        </span>
    );
}