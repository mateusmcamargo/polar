"use client";

import type { DeputyYearVoteGroup } from "@polar/db";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { VoteFocusCard } from "./VoteFocusCard";
import { useFocusedVoteId } from "./useFocusedVoteId";
import { VoteGroupList } from "./VoteGroupList";

interface DeputyVotesProps {
    deputyName: string;
    groups: readonly DeputyYearVoteGroup[];
    collectedAt: Date | null;
    // propositions with a plain language summary, which get a badge
    summaryPropositionIds: readonly number[];
    // class of the scrolling area, which sets its max height
    scrollClassName?: string;
}

// the votes of a deputy in a year; when the visitor comes from a vote page (?votacao=), the card of that vote comes before
// the list and its proposition opens with the vote marked
export function DeputyVotes({ deputyName, groups, collectedAt, summaryPropositionIds, scrollClassName }: Readonly<DeputyVotesProps>) {
    const focusedVoteId = useFocusedVoteId();
    return (
        <>
            {focusedVoteId && <VoteFocusCard deputyName={deputyName} groups={groups} voteId={focusedVoteId} collectedAt={collectedAt} />}
            <ScrollSlider direction="vertical" className={scrollClassName} tabIndex={0} role="region" aria-label="Propostas votadas">
                <VoteGroupList groups={groups} focusedVoteId={focusedVoteId} summaryPropositionIds={summaryPropositionIds} />
            </ScrollSlider>
        </>
    );
}