"use client";

import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { useHeader, type PageMapSection } from "@/components/SiteHeader/HeaderProvider";
import { eraSections, scrollToYear } from "./chronology";
import styles from "./ChronoClock.module.scss";

interface ChronoClockProps {
    sections: readonly PageMapSection[];
}

const PIXELS_PER_YEAR = 7;
const TAPE_HEIGHT = 48;

function clampYear(year: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, year));
}

// chronological clock of the era trail: the estimated year of what is being read, over a dial like a compass tape. The needle stays
// at the center and the tape slides under it. Dragging the dial (or the arrow keys) scrolls the page to that year, and scrolling the
// page moves the dial. The year is written to the dom, not to state, because it changes on every scroll frame (DESIGN.md, "Era trail")
export function ChronoClock({ sections }: Readonly<ChronoClockProps>) {
    const { subscribeChrono } = useHeader();
    const eras = useMemo(() => eraSections(sections), [sections]);
    const minYear = Math.min(...eras.map((era) => era.startYear));
    const maxYear = Math.max(...eras.map((era) => era.endYear));
    // the tape runs a decade past both ends, so the edges never show empty space
    const tapeStart = Math.floor(minYear / 10) * 10 - 10;
    const tapeEnd = Math.ceil(maxYear / 10) * 10 + 10;
    const yearRef = useRef<HTMLSpanElement>(null);
    const tapeRef = useRef<HTMLDivElement>(null);
    const dialRef = useRef<HTMLDivElement>(null);
    const currentYear = useRef(maxYear);
    const drag = useRef<{ x: number; year: number } | null>(null);

    const tape = useMemo(() => {
        const dots: string[] = [];
        const mids: string[] = [];
        const majors: string[] = [];
        const labels: number[] = [];
        for (let year = tapeStart; year <= tapeEnd; year++) {
            const x = (year - tapeStart) * PIXELS_PER_YEAR;
            if (year % 10 === 0) {
                majors.push(`M${x} 22V${TAPE_HEIGHT}`);
                labels.push(year);
            } else if (year % 5 === 0) {
                mids.push(`M${x} 28V${TAPE_HEIGHT}`);
            } else {
                dots.push(`M${x} 38V${TAPE_HEIGHT}`);
            }
        }
        return { dots: dots.join(""), mids: mids.join(""), majors: majors.join(""), labels, width: (tapeEnd - tapeStart) * PIXELS_PER_YEAR };
    }, [tapeStart, tapeEnd]);

    function show(year: number) {
        currentYear.current = year;
        const rounded = Math.round(year);
        if (yearRef.current) {
            yearRef.current.textContent = String(rounded);
        }
        if (tapeRef.current) {
            tapeRef.current.style.transform = `translateX(${-(year - tapeStart) * PIXELS_PER_YEAR}px)`;
        }
        dialRef.current?.setAttribute("aria-valuenow", String(rounded));
        dialRef.current?.setAttribute("aria-valuetext", `Ano estimado ${rounded}`);
    }

    // follows the scroll, except while the reader is dragging the dial, which is the one moving the page
    useEffect(
        () =>
            subscribeChrono(({ year }) => {
                if (year !== null && !drag.current) {
                    show(year);
                }
            }),
        // show only reads refs and the tape start
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [subscribeChrono, tapeStart],
    );

    function goTo(year: number) {
        const clamped = clampYear(year, minYear, maxYear);
        show(clamped);
        scrollToYear(eras, clamped);
    }

    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        drag.current = { x: event.clientX, year: currentYear.current };
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        if (drag.current) {
            // dragging the tape to the right brings earlier years under the needle
            goTo(drag.current.year - (event.clientX - drag.current.x) / PIXELS_PER_YEAR);
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const step = event.shiftKey ? 10 : 1;
        const targets: Record<string, number> = {
            ArrowLeft: Math.round(currentYear.current) - step,
            ArrowDown: Math.round(currentYear.current) - step,
            ArrowRight: Math.round(currentYear.current) + step,
            ArrowUp: Math.round(currentYear.current) + step,
            PageDown: Math.round(currentYear.current) - 10,
            PageUp: Math.round(currentYear.current) + 10,
            Home: minYear,
            End: maxYear,
        };
        const target = targets[event.key];
        if (target !== undefined) {
            event.preventDefault();
            goTo(target);
        }
    }

    return (
        <div className={styles.clock}>
            <div className={styles.readout} aria-hidden="true">
                <span className={styles.est}>est</span>
                <span ref={yearRef} className={styles.year}>
                    {maxYear}
                </span>
            </div>
            <div
                ref={dialRef}
                className={styles.dial}
                role="slider"
                tabIndex={0}
                aria-label="Ano estimado do que você está lendo"
                aria-valuemin={minYear}
                aria-valuemax={maxYear}
                aria-valuenow={maxYear}
                aria-valuetext={`Ano estimado ${maxYear}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={() => (drag.current = null)}
                onPointerCancel={() => (drag.current = null)}
                onKeyDown={handleKeyDown}
            >
                <div className={styles.mask}>
                    <div ref={tapeRef} className={styles.tape} style={{ transform: `translateX(${-(maxYear - tapeStart) * PIXELS_PER_YEAR}px)` }}>
                        <svg width={tape.width} height={TAPE_HEIGHT} viewBox={`0 0 ${tape.width} ${TAPE_HEIGHT}`} aria-hidden="true">
                            <path className={styles.dot} d={tape.dots} />
                            <path className={styles.mid} d={tape.mids} />
                            <path className={styles.major} d={tape.majors} />
                            {tape.labels.map((year) => (
                                <text key={year} x={(year - tapeStart) * PIXELS_PER_YEAR} y={14}>
                                    {year}
                                </text>
                            ))}
                        </svg>
                    </div>
                </div>
                <div className={styles.needle} />
            </div>
            <p className={styles.hint}>est = ano estimado. Arraste o dial.</p>
        </div>
    );
}