import Image from "next/image";
import type { PlenaryVote, Statement, TimelineEntry } from "@polar/db/editorial";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { OldPrint } from "@/components/OldPrint/OldPrint";
import { VoteBadge } from "@/components/VoteBadge/VoteBadge";
import styles from "./EditorialTimeline.module.scss";

export function StatementText({ statement }: Readonly<{ statement: Statement }>) {
    const { image } = statement;
    return (
        <div className={styles.statement}>
            <p>
                {statement.lead && <strong>{statement.lead}</strong>} <GlossaryText text={statement.text} highlightNumbers />
            </p>
            {image?.look === "old-print" && <OldPrint image={image} />}
            {image && image.look !== "old-print" && (
                <figure className={styles.photo}>
                    <Image src={image.file} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 600px) 320px, 80vw" />
                    <figcaption>
                        {image.caption} Foto: <a href={image.sourceUrl}>{image.author}</a>, licença {image.license}, via Wikimedia Commons.
                    </figcaption>
                </figure>
            )}
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
            {/* the same badges as the vote pages (icon, word and color); the text after the count says what the vote was about */}
            <ul className={styles.legend}>
                <li>
                    <VoteBadge choice="YES" size="small" />
                    <strong>{vote.yes}</strong>
                    <span>{vote.yesLabel}</span>
                </li>
                <li>
                    <VoteBadge choice="NO" size="small" />
                    <strong>{vote.no}</strong>
                    <span>{vote.noLabel}</span>
                </li>
                {vote.abstentions > 0 && (
                    <li>
                        <VoteBadge choice="ABSTENTION" size="small" />
                        <strong>{vote.abstentions}</strong>
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