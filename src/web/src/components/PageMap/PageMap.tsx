"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ChevronDown } from "lucide-react";
import { ChronoClock } from "@/components/ChronoClock/ChronoClock";
import { SnakeTrail } from "@/components/SnakeTrail/SnakeTrail";
import { useHeader, type PageMapSection } from "@/components/SiteHeader/HeaderProvider";
import styles from "./PageMap.module.scss";

export type { PageMapSection };

interface PageMapProps {
    sections: readonly PageMapSection[];
}

// map of a long profile page. A page puts it at the start of its content: it registers the sections with the header, which shows
// them below 900 px (the section being read, with a progress line, and the list), and from 1200 px it draws the list in the empty
// space at the left of the reading column (DESIGN.md, "Page map"). Without script the links still jump to the sections. Sections that
// carry an icon (the eras of the rulers page) are drawn as a snake trail instead of a list (DESIGN.md, "Era trail")
export function PageMap({ sections }: Readonly<PageMapProps>) {
    const { currentId, registerSections } = useHeader();
    const navRef = useRef<HTMLElement>(null);
    const [hasMoreBelow, setHasMoreBelow] = useState(false);

    useEffect(() => registerSections(sections), [sections, registerSections]);

    // the era trail scrolls on short windows and its scrollbar is hidden, so an arrow at the bottom tells there is more below
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) {
            return;
        }
        function update(element: HTMLElement) {
            setHasMoreBelow(element.scrollHeight - element.scrollTop - element.clientHeight > 4);
        }
        const onScroll = () => update(nav);
        update(nav);
        nav.addEventListener("scroll", onScroll, { passive: true });
        const observer = new ResizeObserver(onScroll);
        observer.observe(nav);
        return () => {
            nav.removeEventListener("scroll", onScroll);
            observer.disconnect();
        };
    }, []);

    function handleClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
        const target = document.getElementById(id);
        if (!target) {
            return;
        }
        event.preventDefault();
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
    }

    const isTrail = sections.some((section) => section.icon);

    return (
        <nav ref={navRef} className={isTrail ? `${styles.map} ${styles.beside}` : styles.map} aria-label={isTrail ? "Linha do tempo das eras" : "Mapa da página"}>
            <p className={styles.title}>{isTrail ? "Linha do tempo" : "Nesta página"}</p>
            {isTrail ? (
                <>
                    <ChronoClock sections={sections} />
                    <SnakeTrail sections={sections} currentId={currentId} onNavigate={handleClick} />
                    {hasMoreBelow && (
                        <span className={styles.more} aria-hidden="true">
                            <ChevronDown />
                        </span>
                    )}
                </>
            ) : (
                <ol className={styles.list}>
                    {sections.map((section) => (
                        <li key={section.id}>
                            <a href={`#${section.id}`} aria-current={section.id === currentId ? "location" : undefined} onClick={(event) => handleClick(event, section.id)}>
                                {section.label}
                            </a>
                        </li>
                    ))}
                </ol>
            )}
        </nav>
    );
}