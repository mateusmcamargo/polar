// editorial content of the landmarks (/marcos), written by hand from sources, see docs/EDITORIAL.md
// every chart point and every statement carries its sources, so a number without one fails the type check

import type { FactRow, Sources, Statement, Thesis, TimelineEntry } from "../editorial";

export type { FactRow, Source, Sources, Statement, Thesis, TimelineEntry } from "../editorial";

export type MarcoKind = "work" | "event" | "place";

// where the landmark is, drawn on the map of Brazil; the point is projected with the same transform as the IBGE outlines
export interface MarcoLocation {
    // decimal degrees, negative to the south and to the west
    latitude: number;
    longitude: number;
    // acronym of the state that is highlighted on the map
    stateCode: string;
    // short place name for the legend and the card, such as "Foz do Iguaçu (PR)"
    placeLabel: string;
    // sentence that says where it is, for the caption and for screen readers
    description: string;
}

export interface NumberFigure {
    value: string;
    caption: string;
    sources: Sources;
}

export interface GenerationPoint {
    year: number;
    // gigawatt-hours produced in the year
    gigawattHours: number;
}

export interface GenerationChartData {
    intro: string;
    points: readonly GenerationPoint[];
    // year drawn in sticker yellow with its value written
    highlightYear: number;
    // sentence under the drawing, with what the reader needs to read it
    note: string;
    sources: Sources;
}

export interface BreakdownRow {
    label: string;
    // US$ millions
    amount: number;
    explanation: string;
    // true when the amount is calculated from other rows and not published as such
    calculated?: boolean;
}

export interface RevenueBreakdownData {
    intro: string;
    year: number;
    // total revenue of the year, US$ millions, the 100% of the shares
    total: number;
    totalLabel: string;
    rows: readonly [BreakdownRow, ...BreakdownRow[]];
    note: string;
    sources: Sources;
}

export interface TariffPoint {
    year: number;
    // US$ per kilowatt per month
    value: number;
}

export interface TariffSeries {
    label: string;
    // drawn with a solid or a dashed line, so the series never rely on color
    line: "solid" | "dashed";
    points: readonly TariffPoint[];
}

export interface TariffChartData {
    intro: string;
    series: readonly TariffSeries[];
    note: string;
    sources: Sources;
}

// how the energy of a plant shared by two countries is divided, in average megawatts of one year
export interface EnergySplitData {
    year: number;
    unit: string;
    firstCountry: { name: string; supplied: number };
    secondCountry: { name: string; supplied: number };
    // sentence that explains how to read the bars
    note: string;
    sources: Sources;
}

export interface AgreementSection {
    title: string;
    intro: string;
    split: EnergySplitData;
    // the rules and decisions, in plain statements with their sources
    rules: readonly TimelineEntry[];
    // figures that two official sources give differently are shown with both
    divergence: readonly Statement[];
    // what is still open, said with date and source
    open: readonly Statement[];
}

export interface DecidedItem {
    statement: Statement;
    // slug of a page of /governantes, linked when that page exists
    rulerSlug?: string;
}

export interface MarcoPage {
    slug: string;
    kind: MarcoKind;
    // short line above the name, such as "Grande obra · Energia"
    kicker: string;
    name: string;
    tags: readonly string[];
    summary: string;
    facts: { rows: readonly FactRow[]; sources: Sources };
    numbers: { intro: string; figures: readonly NumberFigure[]; generation: GenerationChartData };
    timeline: readonly TimelineEntry[];
    decided: { intro: string; items: readonly DecidedItem[] };
    agreement: AgreementSection | null;
    money: {
        intro: string;
        works: readonly Statement[];
        revenue: RevenueBreakdownData;
        tariff: TariffChartData;
    };
    theses: { intro: string; pair: readonly [Thesis, Thesis] };
    location: MarcoLocation;
    today: readonly Statement[];
    trivia: readonly Statement[];
    // yyyy-mm-dd of the last full review, shown on the page
    reviewedOn: string;
    // path of this file in the public repository, for the change history link
    contentFile: string;
}

export interface MarcoGalleryEntry {
    slug: string;
    name: string;
    kind: MarcoKind;
    // short line on the card, such as "Rio Paraná · 1974 a 1984"
    caption: string;
    location: MarcoLocation;
}

export interface MarcoGroup {
    id: string;
    name: string;
    entries: readonly MarcoGalleryEntry[];
}