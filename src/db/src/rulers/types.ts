// editorial content of the rulers gallery, written by hand from sources, see docs/EDITORIAL.md
// every statement needs at least one source, so a statement without one fails the type check
// statement texts may mark glossary terms as [[id]] or [[id|shown text]], see glossary.ts

import type { Source, Sources } from "../sources";

export type { Source, Sources };

// photo shown under a statement; the author and the license are always shown with it
export interface StatementImage {
    file: string;
    alt: string;
    caption: string;
    author: string;
    license: string;
    sourceUrl: string;
}

export interface Statement {
    // short bold lead, such as the name of a law
    lead?: string;
    text: string;
    sources: Sources;
    image?: StatementImage;
}

export interface TimelineEntry {
    // short label shown on the left, such as "2011" or "abr 2016"
    when: string;
    statements: readonly Statement[];
    vote?: PlenaryVote;
}

export interface PlenaryVote {
    yes: number;
    no: number;
    abstentions: number;
    yesLabel: string;
    noLabel: string;
}

// stages of docs/EDITORIAL.md, "Investigations and controversies"
export type CaseStage = "investigation" | "charged" | "defendant" | "convicted" | "acquitted" | "closed" | "timeBarred" | "annulled";

export interface CaseStep {
    stage: CaseStage;
    year: number;
}

export interface Case {
    title: string;
    summary: readonly Statement[];
    // in order, the last step is the current stage
    steps: readonly [CaseStep, ...CaseStep[]];
    defense: Statement | null;
}

export interface Thesis {
    heading: string;
    holders: string;
    arguments: readonly string[];
    sources: Sources;
}

export interface FactRow {
    label: string;
    value: string;
}

export interface MoneyFigure {
    value: string;
    caption: string;
}

export interface MoneyBlock {
    label: string;
    figures: readonly MoneyFigure[];
    explanation: readonly Statement[];
}

export interface PollPoint {
    // short label for the axis and the table, such as "jun 2013"
    label: string;
    // yyyy-mm-dd, places the point on the time axis: the fieldwork day, or the 15th when only the month is known
    fieldworkDate: string;
    // share that rated the government "ótimo ou bom"
    good: number;
    sources: Sources;
}

export interface RulerPage {
    slug: string;
    // grammatical gender of the labels ("Absolvida" or "Absolvido"), as the person is referred to by official records
    grammaticalGender: "feminine" | "masculine";
    officeLabel: string;
    civilName: string;
    partyAcronym: string | null;
    tags: readonly string[];
    summary: string;
    facts: { rows: readonly FactRow[]; sources: Sources };
    before: readonly TimelineEntry[];
    policies: { intro: string; entries: readonly TimelineEntry[] };
    // official economic indicators of the years in office, not tied to any law
    economy: { intro: string; entries: readonly TimelineEntry[] };
    world: readonly TimelineEntry[];
    opinion: { intro: string; points: readonly PollPoint[]; note: string };
    cases: { intro: string; items: readonly Case[] };
    endOfTerm: {
        heading: string;
        intro: Statement;
        entries: readonly TimelineEntry[];
        decided: readonly Statement[];
        theses: readonly [Thesis, Thesis];
    } | null;
    after: { entries: readonly TimelineEntry[]; money: readonly MoneyBlock[] };
    trivia: readonly Statement[];
    // yyyy-mm-dd of the last full review, shown on the page
    reviewedOn: string;
    // path of this file in the public repository, for the change history link
    contentFile: string;
}

export interface Portrait {
    file: string;
    author: string;
    license: string;
    sourceUrl: string;
}

export interface RulerTerm {
    start: number;
    // null while in office
    end: number | null;
}

// office shown on each gallery card, with an icon; regencies and juntas are groups of people
export type RulerRole = "president" | "primeMinister" | "emperor" | "king" | "regent" | "princessRegent" | "regency" | "junta";

export interface GalleryEntry {
    slug: string;
    name: string;
    // most recent first, the gallery orders people by the start of their most recent term
    terms: readonly [RulerTerm, ...RulerTerm[]];
    role: RulerRole;
    portrait: Portrait | null;
}

export interface GalleryEra {
    // stable key for the era section anchor and the trail icon
    id: string;
    name: string;
    years: string;
    // the same years as numbers, for the chronological clock; null means the era goes on today
    startYear: number;
    endYear: number | null;
    // most recent first
    people: readonly GalleryEntry[];
}