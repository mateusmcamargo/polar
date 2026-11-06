import type { PlenaryVote, Statement, TimelineEntry } from "@polar/db/rulers";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import styles from "./EditorialTimeline.module.scss";

export function StatementText({ statement }: Readonly<{ statement: Statement }>) {
    return (
        <div className={styles.statement}>
            <p>
                {statement.lead && <strong>{statement.lead}</strong>} <GlossaryText text={statement.text} />
            </p>
            <EditorialSources sources={statement.sources} />
        </div>
    );
}

function percent(part: number, total: number): string {
    return `${((part / total) * 100).toFixed(1)}%`;
}

function VoteBar({ vote }: Readonly<{ vote: PlenaryVote }>) {
    const total = vote.yes + vote.no + vote.abstentions;
    return (
        <div className={styles.vote}>
            <div className={styles.bar} data-reveal="fill" aria-hidden="true">
                <span className={styles.yes} style={{ width: percent(vote.yes, total) }} />
                <span className={styles.no} style={{ width: percent(vote.no, total) }} />
                {vote.abstentions > 0 && <span className={styles.abstain} style={{ width: percent(vote.abstentions, total) }} />}
            </div>
            <ul className={styles.legend}>
                <li>
                    <span className={`${styles.swatch} ${styles.yes}`} aria-hidden="true" />
                    <strong>{vote.yes}</strong> {vote.yesLabel}
                </li>
                <li>
                    <span className={`${styles.swatch} ${styles.no}`} aria-hidden="true" />
                    <strong>{vote.no}</strong> {vote.noLabel}
                </li>
                {vote.abstentions > 0 && (
                    <li>
                        <span className={`${styles.swatch} ${styles.abstain}`} aria-hidden="true" />
                        <strong>{vote.abstentions}</strong> {vote.abstentions === 1 ? "abstenção" : "abstenções"}
                    </li>
                )}
            </ul>
        </div>
    );
}

interface EditorialTimelineProps {
    entries: readonly TimelineEntry[];
}

export function EditorialTimeline({ entries }: Readonly<EditorialTimelineProps>) {
    return (
        <ol className={styles.timeline}>
            {entries.map((entry, index) => (
                <li key={`${entry.when}-${index}`} className={styles.entry} data-reveal="rise">
                    <span className={styles.when}>{entry.when}</span>
                    <div className={styles.body}>
                        {entry.statements.map((statement) => (
                            <StatementText key={statement.text} statement={statement} />
                        ))}
                        {entry.vote && <VoteBar vote={entry.vote} />}
                    </div>
                </li>
            ))}
        </ol>
    );
}