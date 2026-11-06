// reading the estimated year from the scroll and the other way round, for the chronological clock. The sections of the rulers page are
// eras, newest first: the top of an era is its last year and its bottom is its first year

// the section counts as current once its top passes this share of the window height
export const ACTIVE_LINE = 0.3;

export interface EraSection {
    id: string;
    startYear: number;
    endYear: number;
}

interface SectionWithYears {
    id: string;
    startYear?: number;
    endYear?: number;
}

export function eraSections(sections: readonly SectionWithYears[]): EraSection[] {
    return sections.flatMap((section) =>
        section.startYear === undefined || section.endYear === undefined ? [] : [{ id: section.id, startYear: section.startYear, endYear: section.endYear }],
    );
}

export function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}

// year at a share (0 to 1) of the way down an era
export function yearInEra(era: EraSection, share: number): number {
    return era.endYear - clamp01(share) * (era.endYear - era.startYear);
}

// the era a year belongs to; a year shared by two eras (1945, 1964...) goes to the newer one, and a gap goes to the nearest
export function eraOfYear(eras: readonly EraSection[], year: number): EraSection | null {
    const inside = eras.find((era) => year <= era.endYear && year >= era.startYear);
    if (inside) {
        return inside;
    }
    const newest = eras[0];
    const oldest = eras.at(-1);
    if (!newest || !oldest) {
        return null;
    }
    return year > newest.endYear ? newest : oldest;
}

// moves the page so that the line of the active section sits at the estimated year
export function scrollToYear(eras: readonly EraSection[], year: number): void {
    const era = eraOfYear(eras, year);
    const element = era ? document.getElementById(era.id) : null;
    if (!era || !element) {
        return;
    }
    const share = era.endYear === era.startYear ? 0 : (era.endYear - year) / (era.endYear - era.startYear);
    const index = eras.indexOf(era);
    const nextElement = eras[index + 1] ? document.getElementById(eras[index + 1]?.id ?? "") : null;
    const top = element.getBoundingClientRect().top;
    const nextTop = nextElement ? nextElement.getBoundingClientRect().top : top + element.offsetHeight;
    const target = window.scrollY + top + clamp01(share) * (nextTop - top) - window.innerHeight * ACTIVE_LINE;
    window.scrollTo({ top: target, behavior: "instant" });
}