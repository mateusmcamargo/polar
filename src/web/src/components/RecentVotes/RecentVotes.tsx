import type { DeputyVoteGroup } from "@polar/db";
import { VoteBadge } from "@/components/VoteBadge/VoteBadge";
import { PROPOSITION_TYPE_NAMES, propositionPageUrl } from "./propositionTypes";
import { classifyVote } from "./voteKinds";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import styles from "./RecentVotes.module.scss";

const voteDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

interface RecentVotesProps {
    groups: DeputyVoteGroup[];
}

export function RecentVotes({ groups }: Readonly<RecentVotesProps>) {
    return (
        <ul className={styles.groups}>
            {groups.map((group) => {
                const votes = group.votes.map((vote) => ({ ...vote, kind: classifyVote(vote.description, vote.approved) }));
                // the badge of the group shows the vote on the main text, or the latest vote when there is none
                const mainVote = votes.find((vote) => vote.kind.isMainText) ?? votes[0];
                const latestVote = votes[0];
                if (!mainVote || !latestVote) {
                    return null;
                }
                const proposition = group.proposition;
                return (
                    <li key={latestVote.id} className={styles.group} data-reveal="rise">
                        <details>
                            <summary className={styles.summary}>
                                <div className={styles.heading}>
                                    <p className={styles.meta}>
                                        <span>{voteDateFormat.format(latestVote.occurredAt)}</span>
                                        <span>{votes.length === 1 ? "1 votação" : `${votes.length} votações`}</span>
                                    </p>
                                    <p className={styles.title}>
                                        {proposition ? (
                                            <>
                                                <abbr title={PROPOSITION_TYPE_NAMES[proposition.typeCode]}>{proposition.typeCode}</abbr>{" "}
                                                {proposition.number}/{proposition.year}
                                            </>
                                        ) : (
                                            "Votação do plenário"
                                        )}
                                    </p>
                                </div>
                                <div className={styles.mainVote}>
                                    <VoteBadge choice={mainVote.choice} />
                                    <small>{mainVote.kind.phrase}</small>
                                </div>
                                {proposition && <p className={styles.ementa}>{proposition.summary}</p>}
                                <span className={styles.more}>
                                    {votes.length === 1 ? "Ver a votação" : `Ver as ${votes.length} votações`}
                                </span>
                            </summary>
                            <ul className={styles.votes}>
                                {votes.map((vote) => (
                                    <li key={vote.id}>
                                        <div>
                                            <span className={styles.kind}>{vote.kind.label}</span>
                                            <span className={styles.result}>{vote.kind.result}</span>
                                        </div>
                                        <VoteBadge choice={vote.choice} size="small" />
                                    </li>
                                ))}
                            </ul>
                            {proposition && (
                                <p className={styles.link}>
                                    <a href={propositionPageUrl(proposition.id)}>Ver a proposta no site da Câmara</a>
                                </p>
                            )}
                        </details>
                    </li>
                );
            })}
        </ul>
    );
}

// latest votes while they load: a proposal with its date and the vote at the right
export function RecentVotesSkeleton() {
    return <SkeletonRows count={5} hasMeta hasValue />;
}