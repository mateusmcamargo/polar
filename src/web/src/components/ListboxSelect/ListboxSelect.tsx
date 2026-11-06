"use client";

import { useDeferredValue, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import styles from "./ListboxSelect.module.scss";

const TYPEAHEAD_RESET_MS = 700;
const PAGE_STEP = 8;
const SKELETON_ROWS = 6;

export interface ListboxOption {
    value: string;
    // plain text of the option, read when typing its first letters
    text: string;
    // what the option shows, such as a party badge and a count
    content: ReactNode;
    // options with the same group sit together under its name, in the given order
    group?: string;
}

interface ListboxSelectProps {
    id: string;
    label: string;
    value: string;
    options: readonly ListboxOption[];
    // data still loading (or turned off in debug mode): the window keeps showing the skeleton
    isLoading?: boolean;
    onChange: (value: string) => void;
}

function plainText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

// select that shows elements in its options (a native select only shows text), following the WAI-ARIA select only combobox:
// a button opens a listbox below it; arrows, Home, End, Page Up and Page Down move, Enter or Space choose, Escape closes,
// typing the first letters jumps to an option, and leaving the field closes the list without changing the value
export function ListboxSelect({ id, label, value, options, isLoading = false, onChange }: Readonly<ListboxSelectProps>) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const typeaheadRef = useRef({ text: "", time: 0 });
    // the window opens at once with a skeleton, and the options render in a second, deferred pass that a tap does not wait for
    const deferredIsOpen = useDeferredValue(isOpen);
    const showsOptions = isOpen && deferredIsOpen && !isLoading;

    const selectedIndex = Math.max(
        0,
        options.findIndex((option) => option.value === value),
    );
    const selected = options[selectedIndex];
    const labelId = `${id}-label`;
    const listId = `${id}-listbox`;
    const optionId = (index: number) => `${id}-option-${index}`;

    useEffect(() => {
        if (isOpen) {
            listRef.current?.focus({ preventScroll: true });
        }
    }, [isOpen]);

    useEffect(() => {
        if (showsOptions) {
            document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
        }
    }, [id, showsOptions, activeIndex]);

    function open(index: number) {
        setActiveIndex(index);
        setIsOpen(true);
    }

    function close(returnFocus: boolean) {
        setIsOpen(false);
        if (returnFocus) {
            buttonRef.current?.focus();
        }
    }

    function choose(index: number) {
        const option = options[index];
        if (option) {
            onChange(option.value);
        }
        close(true);
    }

    function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open(selectedIndex);
        }
    }

    // next option whose text starts with the letters typed in the last moment; one repeated letter cycles through its options
    function typeahead(character: string, now: number) {
        const state = typeaheadRef.current;
        state.text = now - state.time > TYPEAHEAD_RESET_MS ? character : state.text + character;
        state.time = now;
        const query = plainText(state.text);
        const isCycling = [...query].every((letter) => letter === query[0]);
        const start = isCycling ? activeIndex + 1 : activeIndex;
        for (let step = 0; step < options.length; step++) {
            const index = (start + step) % options.length;
            const text = plainText(options[index]?.text ?? "");
            if (text.startsWith(isCycling ? (query[0] ?? "") : query)) {
                setActiveIndex(index);
                return;
            }
        }
    }

    function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const last = options.length - 1;
        const moves: Record<string, number> = {
            ArrowDown: Math.min(activeIndex + 1, last),
            ArrowUp: Math.max(activeIndex - 1, 0),
            Home: 0,
            End: last,
            PageDown: Math.min(activeIndex + PAGE_STEP, last),
            PageUp: Math.max(activeIndex - PAGE_STEP, 0),
        };
        const move = moves[event.key];
        if (move !== undefined) {
            event.preventDefault();
            setActiveIndex(move);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            choose(activeIndex);
        } else if (event.key === "Escape") {
            event.preventDefault();
            close(true);
        } else if (event.key === "Tab") {
            close(false);
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            typeahead(event.key, event.timeStamp);
        }
    }

    function handleBlur(event: FocusEvent<HTMLDivElement>) {
        if (!rootRef.current?.contains(event.relatedTarget)) {
            setIsOpen(false);
        }
    }

    // consecutive options of the same group render together under its name
    const sections: { group: string | undefined; items: { option: ListboxOption; index: number }[] }[] = [];
    options.forEach((option, index) => {
        const current = sections.at(-1);
        if (current && current.group === option.group) {
            current.items.push({ option, index });
        } else {
            sections.push({ group: option.group, items: [{ option, index }] });
        }
    });

    function renderOption({ option, index }: { option: ListboxOption; index: number }) {
        const isSelected = index === selectedIndex;
        return (
            <div
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                className={index === activeIndex ? `${styles.option} ${styles.active}` : styles.option}
                onPointerMove={() => setActiveIndex(index)}
                // keeps the focus in the list, so the blur does not close it before the click
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
            >
                <span className={styles.optionContent}>{option.content}</span>
                {isSelected && <Check className={styles.check} aria-hidden="true" />}
            </div>
        );
    }

    return (
        <div ref={rootRef} className={styles.field} onBlur={handleBlur}>
            <span id={labelId} className={styles.label}>
                {label}
            </span>
            <div className={styles.box}>
                <button
                    ref={buttonRef}
                    id={id}
                    type="button"
                    className={styles.button}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? listId : undefined}
                    aria-labelledby={`${labelId} ${id}`}
                    onClick={() => (isOpen ? close(true) : open(selectedIndex))}
                    onKeyDown={handleButtonKeyDown}
                >
                    <span className={styles.optionContent}>{selected?.content}</span>
                    <ChevronDown className={styles.chevron} aria-hidden="true" />
                </button>
                {isOpen && (
                    <ScrollSlider
                        ref={listRef}
                        direction="vertical"
                        frameClassName={styles.popup}
                        className={styles.listbox}
                        id={listId}
                        role="listbox"
                        tabIndex={-1}
                        aria-labelledby={labelId}
                        aria-activedescendant={showsOptions ? optionId(activeIndex) : undefined}
                        aria-busy={!showsOptions}
                        onKeyDown={handleListKeyDown}
                    >
                        {!showsOptions && <SkeletonRows count={SKELETON_ROWS} leading="tag" size="small" hasDividers={false} />}
                        {showsOptions &&
                            sections.map((section, sectionIndex) =>
                                section.group ? (
                                    <div key={section.group} role="group" aria-labelledby={`${id}-group-${sectionIndex}`}>
                                        <div id={`${id}-group-${sectionIndex}`} role="presentation" className={styles.groupName}>
                                            {section.group}
                                        </div>
                                        {section.items.map(renderOption)}
                                    </div>
                                ) : (
                                    section.items.map(renderOption)
                                ),
                            )}
                    </ScrollSlider>
                )}
            </div>
        </div>
    );
}