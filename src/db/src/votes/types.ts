// plain language summaries of what a proposition does, written by hand from sources, see docs/EDITORIAL.md
// a summary answers four questions, each with its own sources; the proposition page shows only summaries with status "reviewed"
// texts may mark glossary terms as [[id]] or [[id|shown text]], see glossary.ts

import type { Sources } from "../sources";

export type { Source, Sources } from "../sources";

// a hand written note that explains one specific vote of the proposition, shown on the proposition page next to that vote
export interface VoteNote {
    // id of the vote the note explains, for example "2270800-165"
    voteId: string;
    text: string;
    sources: Sources;
}

// one answer: short sentences, with the people who said each opinion named and the party between parentheses
export interface SummaryAnswer {
    text: string;
    sources: Sources;
}

export interface VoteSummary {
    // Câmara id of the proposition, the prefix of the vote ids
    propositionId: number;
    status: "draft" | "reviewed";
    // yyyy-mm-dd, required once the summary is reviewed
    reviewedAt?: string;
    // "Que resultado isso traz?": what the proposition does and where it stands
    result: SummaryAnswer;
    // "O que muda na minha vida?": what changes for people, or that the sources point to no direct change
    life: SummaryAnswer;
    // "Quem é beneficiado?": who gains, as the sources say
    benefited: SummaryAnswer;
    // "Quem é afetado?": who pays, loses or is bound by new rules, with criticisms and defenses attributed by name
    affected: SummaryAnswer;
    // optional notes on specific votes, shown only once the summary is reviewed
    voteNotes?: VoteNote[];
}