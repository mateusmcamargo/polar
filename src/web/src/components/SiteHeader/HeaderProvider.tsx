"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { ACTIVE_LINE, clamp01, yearInEra } from "@/components/ChronoClock/chronology";
import type { TrailIconName } from "@/components/SnakeTrail/trailIcons";

export interface PageMapSection {
    // id of the section element in the page
    id: string;
    label: string;
    // sections that are eras of a trail (the rulers page) also carry their years and an icon, which switches the map to a snake trail
    years?: string;
    icon?: TrailIconName;
    // the same years as numbers, for the chronological clock
    startYear?: number;
    endYear?: number;
}

// what the scroll tracking tells the chronological clock
export interface ChronoState {
    // estimated year at the active line, or null on a page without eras
    year: number | null;
}

export interface GlossaryRequest {
    // term to open the glossary at, or null for the top of the list
    termId: string | null;
    // grows on every request, so asking for the same term twice scrolls again
    count: number;
    // element to give the focus back to when the glossary closes
    opener: HTMLElement | null;
}

interface HeaderContextValue {
    sections: readonly PageMapSection[];
    currentId: string | null;
    // a page with a map registers its sections; the returned function removes them
    registerSections: (sections: readonly PageMapSection[]) => () => void;
    // the header puts its progress line here, and scrolling moves it through the dom
    progressRef: RefObject<HTMLElement | null>;
    // the chronological clock follows the scroll without rendering: it is told the year on every update and answers by writing to the dom
    subscribeChrono: (listener: (state: ChronoState) => void) => () => void;
    glossaryRequest: GlossaryRequest;
    openGlossary: (termId: string | null, opener?: HTMLElement | null) => void;
}

const HeaderContext = createContext<HeaderContextValue | null>(null);

const NO_SECTIONS: readonly PageMapSection[] = [];

const NO_YEAR: ChronoState = { year: null };

export function useHeader(): HeaderContextValue {
    const value = useContext(HeaderContext);
    if (!value) {
        throw new Error("useHeader needs the HeaderProvider of the root layout");
    }
    return value;
}

// state shared by the header, the page map and the glossary: the sections of the page being read (and the one in view), and the
// requests to open the glossary. Scroll tracking lives here, once, and only runs on pages that register a map
export function HeaderProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [sections, setSections] = useState<readonly PageMapSection[]>(NO_SECTIONS);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [glossaryRequest, setGlossaryRequest] = useState<GlossaryRequest>({ termId: null, count: 0, opener: null });
    const progressRef = useRef<HTMLElement | null>(null);
    const chronoListeners = useRef(new Set<(state: ChronoState) => void>());
    const chronoState = useRef<ChronoState>(NO_YEAR);

    const registerSections = useCallback((next: readonly PageMapSection[]) => {
        setSections(next);
        // a page that unmounts after the next one registered must not clear the next one's sections
        return () => setSections((current) => (current === next ? NO_SECTIONS : current));
    }, []);

    const openGlossary = useCallback((termId: string | null, opener: HTMLElement | null = null) => {
        setGlossaryRequest((current) => ({ termId, count: current.count + 1, opener }));
    }, []);

    const subscribeChrono = useCallback((listener: (state: ChronoState) => void) => {
        chronoListeners.current.add(listener);
        listener(chronoState.current);
        return () => {
            chronoListeners.current.delete(listener);
        };
    }, []);

    useEffect(() => {
        if (sections.length === 0) {
            return;
        }
        let frame = 0;
        function update() {
            frame = 0;
            const page = document.documentElement;
            const line = window.innerHeight * ACTIVE_LINE;
            const isAtBottom = window.innerHeight + window.scrollY >= page.scrollHeight - 2;
            let found: string | null = null;
            let foundIndex = -1;
            const tops = sections.map((section) => document.getElementById(section.id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY);
            for (const [index, top] of tops.entries()) {
                if (top <= line) {
                    found = sections[index]?.id ?? found;
                    foundIndex = index;
                }
            }
            // a short last section never reaches the line, so the end of the page selects it
            if (isAtBottom) {
                found = sections.at(-1)?.id ?? found;
                foundIndex = sections.length - 1;
            }
            setCurrentId(found);
            // share of the trail already travelled, as the empty part left of the path (--trail-offset): the section being read plus how
            // far the scroll went toward the next one. Only the trail of the rulers page draws it
            const lastIndex = sections.length - 1;
            let travelled = 0;
            if (foundIndex >= lastIndex) {
                travelled = 1;
            } else if (foundIndex >= 0) {
                const top = tops[foundIndex] ?? 0;
                const nextTop = tops[foundIndex + 1] ?? top + 1;
                travelled = (foundIndex + Math.min(1, Math.max(0, (line - top) / (nextTop - top)))) / lastIndex;
            }
            page.style.setProperty("--trail-offset", String(1 - travelled));
            // estimated year: the last year of the era at its top, its first year at its bottom
            const firstEra = sections[0];
            const foundEra = sections[foundIndex];
            let year: number | null = null;
            if (firstEra?.endYear !== undefined) {
                year = firstEra.endYear;
                if (foundEra?.startYear !== undefined && foundEra.endYear !== undefined) {
                    const top = tops[foundIndex] ?? 0;
                    const nextTop = tops[foundIndex + 1] ?? top + (document.getElementById(foundEra.id)?.offsetHeight ?? 1);
                    year = yearInEra({ id: foundEra.id, startYear: foundEra.startYear, endYear: foundEra.endYear }, clamp01((line - top) / (nextTop - top)));
                }
                const lastEra = sections.at(-1);
                if (isAtBottom && lastEra?.startYear !== undefined) {
                    year = lastEra.startYear;
                }
            }
            chronoState.current = { year };
            for (const listener of chronoListeners.current) {
                listener(chronoState.current);
            }
            // the progress line moves through the dom, so scrolling renders only when the section changes
            const range = page.scrollHeight - window.innerHeight;
            progressRef.current?.style.setProperty("--progress", String(range > 0 ? Math.min(1, window.scrollY / range) : 0));
        }
        function scheduleUpdate() {
            if (!frame) {
                frame = requestAnimationFrame(update);
            }
        }
        update();
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate);
        return () => {
            cancelAnimationFrame(frame);
            document.documentElement.style.removeProperty("--trail-offset");
            chronoState.current = NO_YEAR;
            window.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("resize", scheduleUpdate);
        };
    }, [sections]);

    const value = useMemo(
        () => ({ sections, currentId: sections.length > 0 ? currentId : null, registerSections, progressRef, subscribeChrono, glossaryRequest, openGlossary }),
        [sections, currentId, registerSections, subscribeChrono, glossaryRequest, openGlossary],
    );

    return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}