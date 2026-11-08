import Link from "next/link";
import type { VoteNote } from "@polar/db/vote-summaries";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import { NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import { classifyVote, type VoteKind } from "@/components/RecentVotes/voteKinds";
import { ResultBadge, VoteBadge } from "@/components/VoteBadge/VoteBadge";
import { AnswerSources } from "@/components/VoteSummaryAnswers/VoteSummaryAnswers";
import { GovernmentComparison } from "./GovernmentComparison";
import { describeStageDates, describeStageDecision, type Stage, type StageVote } from "./stages";
import styles from "./PropositionStages.module.scss";

const TIME_ZONE = "America/Sao_Paulo";
const dayMonthFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });

export interface StagesVote extends StageVote {
    // the choice of the deputy, only on the votes of one deputy
    choice?: string;
    governmentOrientation?: string | null;
}

interface PropositionStagesProps<Vote extends StagesVote> {
    stages: readonly Stage<Vote>[];
    // the vote whose own page this is: marked as "Esta votação"
    currentVoteId?: string;
    // the vote the visitor came to see: marked as "Em foco"
    focusedVoteId?: string | null;
    // hand written notes of a reviewed summary, shown under their votes
    notes?: readonly VoteNote[];
    // inside a list of propositions: no sentence on what each stage decided, and the title of a single stage is left out
    compact?: boolean;
}

// "Aprovada. Sim 353, Não 134" becomes "Aprovada": the counts stay in the line of the vote
function resultWordOf(kind: VoteKind): string {
    return kind.result.split(". ")[0] ?? kind.result;
}

export function voteDomId(voteId: string): string {
    return `votacao-${voteId}`;
}

// the votes of a proposition by stage (turn, Senate changes), oldest first; every vote is a link to its own page. On the
// votes of one deputy the badge is the choice of the deputy, otherwise the result of the vote
export function PropositionStages<Vote extends StagesVote>({
    stages,
    currentVoteId,
    focusedVoteId,
    notes = [],
    compact = false,
}: Readonly<PropositionStagesProps<Vote>>) {
    const showTitles = !compact || stages.length > 1;
    return (
        <div className={styles.stages}>
            {stages.map((stage) => (
                <section key={stage.label} className={styles.stage}>
                    {showTitles && (
                        <h3 className={styles.stageTitle}>
                            {stage.label} <span className={styles.stageDates}>· {describeStageDates(stage)}</span>
                        </h3>
                    )}
                    {!compact && <p className={styles.decision}>{describeStageDecision(stage)}</p>}
                    <ol className={styles.votes}>
                        {stage.votes.map((vote) => {
                            const kind = classifyVote(vote.description, vote.approved);
                            const isCurrent = vote.id === currentVoteId;
                            const isFocused = vote.id === focusedVoteId;
                            const note = notes.find((candidate) => candidate.voteId === vote.id);
                            return (
                                <li key={vote.id} id={voteDomId(vote.id)} className={isCurrent || isFocused ? styles.marked : undefined}>
                                    <div className={styles.row}>
                                        <Link
                                            className={styles.voteLink}
                                            href={`/votacoes/${vote.id}`}
                                            transitionTypes={NAV_FORWARD}
                                            aria-current={isCurrent || isFocused ? "true" : undefined}
                                        >
                                            <span className={styles.kind}>
                                                {kind.label}
                                                {isCurrent && <span className={styles.mark}>Esta votação</span>}
                                                {isFocused && <span className={styles.mark}>Em foco</span>}
                                            </span>
                                            <span className={styles.result}>
                                                {kind.result} · {dayMonthFormat.format(vote.occurredAt)} às {timeFormat.format(vote.occurredAt)}
                                            </span>
                                            <GovernmentComparison choice={vote.choice} governmentOrientation={vote.governmentOrientation} />
                                            <LinkPending />
                                        </Link>
                                        {vote.choice ? <VoteBadge choice={vote.choice} size="small" /> : <ResultBadge word={resultWordOf(kind)} size="small" />}
                                    </div>
                                    {note && (
                                        <div className={styles.note}>
                                            <p>
                                                <GlossaryText text={note.text} />
                                            </p>
                                            <AnswerSources sources={note.sources} />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </section>
            ))}
        </div>
    );
}