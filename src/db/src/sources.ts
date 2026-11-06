// source of a statement written by hand (president pages, glossary), see docs/EDITORIAL.md

export interface Source {
    title: string;
    publisher: string;
    url: string;
    // yyyy-mm-dd
    accessedOn: string;
}

// at least one source, so a statement without one fails the type check
export type Sources = readonly [Source, ...Source[]];