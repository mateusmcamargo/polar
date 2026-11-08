"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Archive, BookOpenText, Ban, ChevronDown, CornerDownRight, Landmark, ScrollText, type LucideIcon } from "lucide-react";
import type { PropositionSummary } from "@polar/db";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import { NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import { describeStatus } from "@/components/PropositionStages/propositionStatus";
import { PropositionStages, voteDomId, type StagesVote } from "@/components/PropositionStages/PropositionStages";
import { GovernmentComparison } from "@/components/PropositionStages/GovernmentComparison";
import { splitIntoStages } from "@/components/PropositionStages/stages";
import { PROPOSITION_TYPE_NAMES } from "@/components/RecentVotes/propositionTypes";
import { classifyVote, type VoteKind } from "@/components/RecentVotes/voteKinds";
import { ResultBadge, VoteBadge } from "@/components/VoteBadge/VoteBadge";
import styles from "./VoteGroupList.module.scss";

const voteDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

// one icon for each status badge, so no badge of the row is only text
const STATUS_ICONS: Readonly<Record<string, LucideIcon>> = {
    "Virou lei": ScrollText,
    "No Senado": Landmark,
    Vetada: Ban,
    Arquivada: Archive,
};

export type VoteGroupItemVote = StagesVote;

export interface VoteGroupItem {
    proposition: PropositionSummary | null;
    // newest first
    votes: VoteGroupItemVote[];
}

interface VoteGroupListProps {
    groups: readonly VoteGroupItem[];
    // the vote the visitor came to see: its group opens, the vote is marked and the list scrolls to it once
    focusedVoteId?: string | null;
    // propositions with a plain language summary: their row gets the "Resumo fácil" badge
    summaryPropositionIds?: readonly number[];
}

// "Aprovada. Sim 353, Não 134" becomes "Aprovada": the counts stay in the line of the vote
function resultWordOf(kind: VoteKind): string {
    return kind.result.split(". ")[0] ?? kind.result;
}

function propositionLabel(proposition: PropositionSummary) {
    return (
        <>
            <abbr title={PROPOSITION_TYPE_NAMES[proposition.typeCode]}>{proposition.typeCode}</abbr> {proposition.number}/{proposition.year}
        </>
    );
}

function propositionText(proposition: PropositionSummary): string {
    return `${proposition.typeCode} ${proposition.number}/${proposition.year}`;
}

// One row per proposition, newest first. The body of the row opens the page of the proposition and the "Mostrar todas as votações" button, a
// separate control, shows its votes by stage; every vote is a link to its own page. On the votes of one deputy the badge is
// the choice of the deputy, otherwise the result of the vote
export function VoteGroupList({ groups, focusedVoteId = null, summaryPropositionIds = [] }: Readonly<VoteGroupListProps>) {
    const idPrefix = useId();
    // what the visitor toggled; a group nobody toggled is open only when it holds the focused vote
    const [toggled, setToggled] = useState<Record<string, boolean>>({});
    // the votes of a group are built the first time it opens and then kept, so closing can be animated too
    const [built, setBuilt] = useState<Record<string, boolean>>({});

    // a group that was never open is built closed and opens on the next frames, so that the opening is a transition
    function toggleGroup(key: string, isOpen: boolean, isBuilt: boolean) {
        if (isBuilt || isOpen) {
            setToggled((current) => ({ ...current, [key]: !isOpen }));
            return;
        }
        setBuilt((current) => ({ ...current, [key]: true }));
        requestAnimationFrame(() => requestAnimationFrame(() => setToggled((current) => ({ ...current, [key]: true }))));
    }

    useEffect(() => {
        if (!focusedVoteId) {
            return;
        }
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById(voteDomId(focusedVoteId))?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    }, [focusedVoteId]);

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
                const key = String(proposition?.id ?? latestVote.id);
                const holdsFocus = focusedVoteId !== null && group.votes.some((vote) => vote.id === focusedVoteId);
                const isOpen = toggled[key] ?? holdsFocus;
                const isBuilt = isOpen || built[key] === true;
                const panelId = `${idPrefix}-${key}`;
                const toggleName = proposition ? `da ${propositionText(proposition)}` : "desta proposta";
                const status = proposition ? describeStatus(proposition.situation, proposition.situationAt, proposition.dispatch) : null;
                const StatusIcon = status?.shortLabel ? STATUS_ICONS[status.shortLabel] : undefined;
                const bodyContent = (
                    <>
                        <p className={styles.meta}>
                            <span>{voteDateFormat.format(latestVote.occurredAt)}</span>
                            <span>{votes.length === 1 ? "1 votação" : `${votes.length} votações`}</span>
                            <span>{mainVote.kind.label}</span>
                        </p>
                        <div className={styles.titleRow}>
                            <p className={styles.title}>{proposition ? propositionLabel(proposition) : "Votação do plenário"}</p>
                            {proposition && summaryPropositionIds.includes(proposition.id) && (
                                <span className={styles.summaryTag}>
                                    <BookOpenText aria-hidden="true" />
                                    Resumo fácil de ler
                                </span>
                            )}
                        </div>
                        <div className={styles.badges}>
                            {mainVote.choice ? <VoteBadge choice={mainVote.choice} size="small" /> : <ResultBadge word={resultWordOf(mainVote.kind)} size="small" />}
                            {status?.shortLabel && (
                                <span className={status.shortLabel === "Virou lei" ? `${styles.tag} ${styles.lawTag}` : styles.tag}>
                                    {StatusIcon && <StatusIcon aria-hidden="true" />}
                                    {status.shortLabel}
                                </span>
                            )}
                        </div>
                        <GovernmentComparison choice={mainVote.choice} governmentOrientation={mainVote.governmentOrientation} />
                        {proposition && <p className={styles.ementa}>{proposition.summary}</p>}
                    </>
                );
                return (
                    <li key={key} className={styles.group} data-reveal="rise">
                        {proposition ? (
                            <Link className={styles.body} href={`/propostas/${proposition.id}`} transitionTypes={NAV_FORWARD}>
                                {bodyContent}
                                {/* the mark of a link: this card opens the page of the proposition */}
                                <CornerDownRight className={styles.openMark} aria-hidden="true" />
                                <LinkPending />
                            </Link>
                        ) : (
                            <div className={styles.body}>{bodyContent}</div>
                        )}
                        <button
                            type="button"
                            className={styles.toggle}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            aria-label={`${isOpen ? (votes.length === 1 ? "Ocultar a votação" : "Ocultar as votações") : votes.length === 1 ? "Mostrar a votação" : "Mostrar todas as votações"} ${toggleName}`}
                            onClick={() => toggleGroup(key, isOpen, isBuilt)}
                        >
                            <span>{isOpen ? (votes.length === 1 ? "Ocultar a votação" : "Ocultar as votações") : votes.length === 1 ? "Mostrar a votação" : "Mostrar todas as votações"}</span>
                            <ChevronDown aria-hidden="true" />
                        </button>
                        {isBuilt && (
                            <div id={panelId} className={styles.panel} data-open={isOpen} inert={!isOpen}>
                                <div className={styles.panelInner}>
                                    <div className={styles.panelContent}>
                                        <PropositionStages stages={splitIntoStages([...group.votes].reverse())} focusedVoteId={focusedVoteId} compact />
                                    </div>
                                </div>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}