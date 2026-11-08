import type { VoteCounts } from "@polar/db";
import { Check, CircleDashed, X } from "lucide-react";
import { resultToneOf, VoteBadge } from "@/components/VoteBadge/VoteBadge";
import type { VoteKind } from "@/components/RecentVotes/voteKinds";
import styles from "./VoteResult.module.scss";

interface VoteResultProps {
    kind: VoteKind;
    counts: VoteCounts;
    // deputies in office that day without a registered vote
    notVoted: number;
}

function votedWord(count: number): string {
    return count === 1 ? "votou" : "votaram";
}

// result word, the Sim against Não bar and the count of each choice; the numbers come from the individual votes
export function VoteResult({ kind, counts, notVoted }: Readonly<VoteResultProps>) {
    // "Aprovada. Sim 353, Não 134" becomes "Aprovada": the counts have their own place below
    const resultWord = kind.result.split(". ")[0] ?? kind.result;
    const segments = [
        { key: "yes", count: counts.yes, className: styles.yes },
        { key: "no", count: counts.no, className: styles.no },
        { key: "abstention", count: counts.abstention, className: styles.abstain },
        { key: "obstruction", count: counts.obstruction, className: styles.obstruct },
    ];
    const resultTone = resultToneOf(resultWord);
    const barDescription = `${counts.yes} Sim, ${counts.no} Não, ${counts.abstention} abstenções e ${counts.obstruction} obstruções`;
    const rows = [
        { choice: "YES", count: counts.yes },
        { choice: "NO", count: counts.no },
        { choice: "ABSTENTION", count: counts.abstention },
        { choice: "OBSTRUCTION", count: counts.obstruction },
        { choice: "NOT_VOTED", count: notVoted },
    ].filter((row) => row.count > 0 || row.choice === "YES" || row.choice === "NO");

    return (
        <div className={styles.result}>
            <div className={styles.sticker}>
                <p className={styles.label}>{kind.label}</p>
                <div className={styles.headline}>
                    <p className={styles.word}>{resultWord}</p>
                    {/* a seal beside the word: the word says the result, the icon repeats it */}
                    <span className={styles.seal} aria-hidden="true">
                        {resultTone === "positive" ? <Check /> : resultTone === "negative" ? <X /> : <CircleDashed />}
                    </span>
                </div>
                <p>
                    <span className={styles.count}>{counts.yes}</span> {votedWord(counts.yes)} Sim <span aria-hidden="true">|</span>{" "}
                    <span className={styles.count}>{counts.no}</span> {votedWord(counts.no)} Não
                </p>
            </div>
            <div className={styles.bar} role="img" aria-label={barDescription}>
                {segments
                    .filter((segment) => segment.count > 0)
                    .map((segment) => (
                        <span key={segment.key} className={segment.className} style={{ flexGrow: segment.count }} />
                    ))}
            </div>
            <ul className={styles.counts}>
                {rows.map((row) => (
                    <li key={row.choice}>
                        <VoteBadge choice={row.choice} size="small" />
                        <strong>{row.count}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}