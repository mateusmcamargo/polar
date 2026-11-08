// types shared by every area written by hand from sources (rulers, landmarks), see docs/EDITORIAL.md
// every statement needs at least one source, so a statement without one fails the type check
// statement texts may mark glossary terms as [[id]] or [[id|shown text]], see glossary.ts

import type { Source, Sources } from "./sources";

export type { Source, Sources };

// photo shown under a statement; the author and the license are always shown with it
export interface StatementImage {
    file: string;
    // size of the file in pixels, so the page reserves the right space and keeps the proportion
    width: number;
    height: number;
    alt: string;
    caption: string;
    author: string;
    license: string;
    sourceUrl: string;
    // "old-print" lays the photo on an aged printed page (OldPrint); without it the photo is shown plain
    look?: "old-print";
}

export interface Statement {
    // short bold lead, such as the name of a law
    lead?: string;
    text: string;
    sources: Sources;
    image?: StatementImage;
}

export interface PlenaryVote {
    yes: number;
    no: number;
    abstentions: number;
    yesLabel: string;
    noLabel: string;
}

export interface TimelineEntry {
    // short label shown on the left, such as "2011" or "abr 2016"
    when: string;
    statements: readonly Statement[];
    vote?: PlenaryVote;
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