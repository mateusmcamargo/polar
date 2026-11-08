import Link from "next/link";
import type { DeputyYearVoteGroup } from "@polar/db";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import { NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import { splitIntoStages } from "@/components/PropositionStages/stages";
import { PROPOSITION_TYPE_NAMES } from "@/components/RecentVotes/propositionTypes";
import { classifyVote } from "@/components/RecentVotes/voteKinds";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import { VoteBadge } from "@/components/VoteBadge/VoteBadge";
import styles from "./VoteFocusCard.module.scss";

const TIME_ZONE = "America/Sao_Paulo";
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE });
const timeFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });

interface VoteFocusCardProps {
    deputyName: string;
    groups: readonly DeputyYearVoteGroup[];
    voteId: string;
    collectedAt: Date | null;
}

// what the visitor came to see: which vote it is and how the deputy voted, before the long list. Nothing is shown when the
// vote is not in the list of the year
export function VoteFocusCard({ deputyName, groups, voteId, collectedAt }: Readonly<VoteFocusCardProps>) {
    const group = groups.find((candidate) => candidate.votes.some((vote) => vote.id === voteId));
    const vote = group?.votes.find((candidate) => candidate.id === voteId);
    if (!group || !vote) {
        return null;
    }
    const proposition = group.proposition;
    const kind = classifyVote(vote.description, vote.approved);
    const stage = splitIntoStages([...group.votes].reverse()).find((candidate) => candidate.votes.some((stageVote) => stageVote.id === voteId));

    return (
        <section className={styles.card} aria-labelledby="focus-title">
            <p className={styles.kicker}>Votação em foco</p>
            <h2 id="focus-title" className={styles.title}>
                {proposition && (
                    <>
                        <abbr title={PROPOSITION_TYPE_NAMES[proposition.typeCode]}>{proposition.typeCode}</abbr> {proposition.number}/{proposition.year} ·{" "}
                    </>
                )}
                {stage && stage.votes.length > 1 && stage.opener?.id !== vote.id ? `${stage.label} · ` : ""}
                {kind.label}
            </h2>
            <p className={styles.you}>
                <span>
                    Em {dateFormat.format(vote.occurredAt)}, às {timeFormat.format(vote.occurredAt)}. Voto de {deputyName}:
                </span>
                <VoteBadge choice={vote.choice} />
            </p>
            <p className={styles.result}>Resultado: {kind.result}.</p>
            <ul className={styles.links}>
                <li>
                    <Link href={`/votacoes/${vote.id}`} transitionTypes={NAV_FORWARD}>
                        Ver a votação inteira e o mapa
                        <LinkPending />
                    </Link>
                </li>
                {proposition && (
                    <li>
                        <Link href={`/propostas/${proposition.id}`} transitionTypes={NAV_FORWARD}>
                            Entender a proposta
                            <LinkPending />
                        </Link>
                    </li>
                )}
            </ul>
            <SourceNote sourceName="Câmara dos Deputados, votações nominais do plenário" sourceUrl={vote.sourceUrl} collectedAt={collectedAt} />
        </section>
    );
}