"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import styles from "./TwoRowSlider.module.scss";

// phones show a long list of buttons (the parties) as a slider of two packed rows: odd items on top, even items below, so the order
// still reads from left to right. The list gets the width of its longest row, measured, because css cannot size a wrapping row on
// its own
function fitRows(list: HTMLUListElement) {
    // the items stretch to fill their row only once fitted, so they are measured with the stretch turned off
    list.removeAttribute("data-fitted");
    const widths = [...list.children].map((item) => item.getBoundingClientRect().width);
    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
    const rowWidth = (parity: number) => {
        const row = widths.filter((_, index) => index % 2 === parity);
        return row.reduce((total, width) => total + width, 0) + gap * Math.max(row.length - 1, 0);
    };
    list.style.setProperty("--row-width", `${Math.ceil(Math.max(rowWidth(0), rowWidth(1)))}px`);
    list.setAttribute("data-fitted", "");
}

interface TwoRowSliderProps {
    // name of the list, read by screen readers
    label: string;
    // anything that changes the width of the items (their text, their order), so the rows are measured again
    remeasureOn: unknown;
    // the items: <li> elements that hold one button each
    children: ReactNode;
}

// from 900 px the items wrap as an ordinary list. Used by the legends of the hemicycle, of the party map and of the party radar
export function TwoRowSlider({ label, remeasureOn, children }: Readonly<TwoRowSliderProps>) {
    const listRef = useRef<HTMLUListElement>(null);

    // measured before the first paint after hydration, again when the items change and after the web font loads, which changes the
    // width of the labels
    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) {
            return;
        }
        fitRows(list);
        let isCurrent = true;
        void document.fonts.ready.then(() => {
            if (isCurrent) {
                fitRows(list);
            }
        });
        return () => {
            isCurrent = false;
        };
    }, [remeasureOn]);

    return (
        <ScrollSlider className={styles.scroll}>
            <ul ref={listRef} className={styles.list} aria-label={label}>
                {children}
            </ul>
        </ScrollSlider>
    );
}