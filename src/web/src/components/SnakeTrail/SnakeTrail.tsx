"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { PageMapSection } from "@/components/SiteHeader/HeaderProvider";
import { TRAIL_ICONS } from "./trailIcons";
import styles from "./SnakeTrail.module.scss";

interface SnakeTrailProps {
    sections: readonly PageMapSection[];
    currentId: string | null;
    onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
    // a narrow winding band with all the labels in a column beside it, for the rail of computers (the default spreads the nodes over the whole width)
    compact?: boolean;
}

// path through the centers of the nodes, with vertical tangents so every turn is a smooth S
function snakePath(width: number, node: number, row: number, count: number): string {
    const xLeft = node / 2;
    const xRight = width - node / 2;
    const xOf = (index: number) => (index % 2 === 0 ? xLeft : xRight);
    const yOf = (index: number) => index * row + node / 2;
    let path = `M${xOf(0)} ${yOf(0)}`;
    for (let index = 1; index < count; index++) {
        const pull = row * 0.7;
        path += ` C${xOf(index - 1)} ${yOf(index - 1) + pull} ${xOf(index)} ${yOf(index) - pull} ${xOf(index)} ${yOf(index)}`;
    }
    return path;
}

// a trail in the shape of a snake: the eras are nodes that alternate between the left and the right edge, joined by a path that fills
// as the page scrolls (the share comes from HeaderProvider as --trail-offset). Scrolling goes back in time, so the first node is the
// most recent era and the path fills toward the oldest one
export function SnakeTrail({ sections, currentId, onNavigate, compact = false }: Readonly<SnakeTrailProps>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [path, setPath] = useState("");
    const currentIndex = sections.findIndex((section) => section.id === currentId);
    // the filled part of the trail is the pills shown through this mask; ids cannot hold the colons of useId
    const maskId = `trail-fill-${useId().replaceAll(":", "")}`;

    // the sizes come from the layout (the position of the first two nodes and the size of the first one), because the rows of the
    // compact trail follow the height of the window and so cannot be read from a custom property; --trail-span is a plain length
    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        function draw(element: HTMLDivElement) {
            const items = element.querySelectorAll<HTMLElement>("li");
            const nodeElement = element.querySelector<HTMLElement>("[data-trail-node]");
            const node = nodeElement?.offsetHeight ?? 0;
            const row = items.length > 1 ? (items[1]?.offsetTop ?? 0) - (items[0]?.offsetTop ?? 0) : 0;
            const span = Number.parseFloat(getComputedStyle(element).getPropertyValue("--trail-span"));
            const width = span > 0 ? span : element.clientWidth;
            if (width > 0 && node > 0 && row > 0) {
                setPath(snakePath(width, node, row, sections.length));
            }
        }
        draw(container);
        const observer = new ResizeObserver(() => draw(container));
        observer.observe(container);
        return () => observer.disconnect();
    }, [sections.length]);

    return (
        <div ref={containerRef} className={compact ? `${styles.snake} ${styles.compact}` : styles.snake} style={{ "--count": sections.length } as CSSProperties}>
            <svg className={styles.path} aria-hidden="true">
                <defs>
                    <mask id={maskId} maskUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
                        <path className={styles.progress} d={path} pathLength={1} />
                    </mask>
                </defs>
                <path className={styles.track} d={path} />
                <path className={styles.fill} d={path} mask={`url(#${maskId})`} />
            </svg>
            <ol className={styles.nodes}>
                {sections.map((section, index) => {
                    const Icon = section.icon ? TRAIL_ICONS[section.icon] : null;
                    const isCurrent = section.id === currentId;
                    const classes = [index % 2 === 0 ? styles.left : styles.right, index <= currentIndex ? styles.passed : ""].join(" ");
                    return (
                        <li key={section.id} className={classes} style={{ "--index": index } as CSSProperties}>
                            <a href={`#${section.id}`} aria-current={isCurrent ? "location" : undefined} onClick={(event) => onNavigate(event, section.id)}>
                                <span className={styles.node} data-trail-node="">{Icon && <Icon aria-hidden="true" />}</span>
                                <span className={styles.label}>
                                    <span className={styles.name}>{section.label}</span>
                                    {section.years && <span className={styles.years}>{section.years}</span>}
                                    {isCurrent && <span className={styles.here}>Você está aqui</span>}
                                </span>
                            </a>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}