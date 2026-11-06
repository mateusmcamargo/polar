"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { PageMapSection } from "@/components/SiteHeader/HeaderProvider";
import { TRAIL_ICONS } from "./trailIcons";
import styles from "./SnakeTrail.module.scss";

interface SnakeTrailProps {
    sections: readonly PageMapSection[];
    currentId: string | null;
    onNavigate: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
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
export function SnakeTrail({ sections, currentId, onNavigate }: Readonly<SnakeTrailProps>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [path, setPath] = useState("");
    const currentIndex = sections.findIndex((section) => section.id === currentId);

    // the sizes come from the css (--trail-node, --trail-row), so the drawing and the layout cannot drift apart
    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }
        function draw(element: HTMLDivElement) {
            const style = getComputedStyle(element);
            const node = Number.parseFloat(style.getPropertyValue("--trail-node"));
            const row = Number.parseFloat(style.getPropertyValue("--trail-row"));
            if (element.clientWidth > 0 && node > 0 && row > 0) {
                setPath(snakePath(element.clientWidth, node, row, sections.length));
            }
        }
        draw(container);
        const observer = new ResizeObserver(() => draw(container));
        observer.observe(container);
        return () => observer.disconnect();
    }, [sections.length]);

    return (
        <div ref={containerRef} className={styles.snake} style={{ "--count": sections.length } as CSSProperties}>
            <svg className={styles.path} aria-hidden="true">
                <path className={styles.track} d={path} />
                <path className={styles.fill} d={path} pathLength={1} />
            </svg>
            <ol className={styles.nodes}>
                {sections.map((section, index) => {
                    const Icon = section.icon ? TRAIL_ICONS[section.icon] : null;
                    const isCurrent = section.id === currentId;
                    const classes = [index % 2 === 0 ? styles.left : styles.right, index <= currentIndex ? styles.passed : ""].join(" ");
                    return (
                        <li key={section.id} className={classes} style={{ "--index": index } as CSSProperties}>
                            <a href={`#${section.id}`} aria-current={isCurrent ? "location" : undefined} onClick={(event) => onNavigate(event, section.id)}>
                                <span className={styles.node}>{Icon && <Icon aria-hidden="true" />}</span>
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