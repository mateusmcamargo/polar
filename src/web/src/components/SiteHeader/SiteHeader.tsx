"use client";

import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronDown, Menu, Moon, X } from "lucide-react";
import { ChronoClock } from "@/components/ChronoClock/ChronoClock";
import { GlossaryContent } from "@/components/GlossaryContent/GlossaryContent";
import { Logo } from "@/components/Logo/Logo";
import { MainNav } from "@/components/MainNav/MainNav";
import { SnakeTrail } from "@/components/SnakeTrail/SnakeTrail";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import { useHeader } from "./HeaderProvider";
import { ThemeChoice } from "./ThemeChoice";
import styles from "./SiteHeader.module.scss";

type Panel = "menu" | "sections" | "glossary";

const PANEL_ID = "header-panel";
const GLOSSARY_PREFIX = "cabecalho-";
// the same width where the top navigation replaces the bottom one; from it the glossary opens in a side panel
const DESKTOP_MEDIA_QUERY = "(min-width: 900px)";

// header of the site. From 900 px it is the top bar: logo, navigation, glossary button and theme button. Below that it is one
// sticky header that grows downward: the logo (or, on a page with a map, the section being read with a progress line) on the
// left and a button on the right that opens the menu. The menu, the list of sections and the glossary all open inside the
// header, which looks like it is pulled out of the top of the screen (DESIGN.md, "Header")
export function SiteHeader() {
    const { sections, currentId, glossaryRequest, openGlossary, progressRef } = useHeader();
    const pathname = usePathname();
    const [panel, setPanel] = useState<Panel | null>(null);
    const [glossaryTermId, setGlossaryTermId] = useState<string | null>(null);
    // a new copy of the glossary for every request clears the search and scrolls to the term again
    const [glossaryKey, setGlossaryKey] = useState(0);
    // the glossary is mounted on the first request and stays, so it slides closed with its content
    const [hasOpenedGlossary, setHasOpenedGlossary] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const hasMap = sections.length > 0;
    // the eras of the rulers page: the panel draws the snake trail instead of the list
    const isTrail = sections.some((section) => section.icon);
    const currentIndex = sections.findIndex((section) => section.id === currentId);
    const currentLabel = sections[currentIndex]?.label;
    const showsSections = panel === "sections" && hasMap;
    const visiblePanel = panel === "sections" && !hasMap ? null : panel;

    // a new page starts with the header closed, and a new glossary request opens it here below 900 px (from 900 px the side panel
    // answers the same request). Both follow the "adjust state while rendering" pattern, not an effect
    const [seenPathname, setSeenPathname] = useState(pathname);
    const [seenRequestCount, setSeenRequestCount] = useState(glossaryRequest.count);
    if (seenPathname !== pathname) {
        setSeenPathname(pathname);
        setPanel(null);
    }
    if (seenRequestCount !== glossaryRequest.count) {
        setSeenRequestCount(glossaryRequest.count);
        if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
            setGlossaryTermId(glossaryRequest.termId);
            setGlossaryKey((key) => key + 1);
            setHasOpenedGlossary(true);
            setPanel("glossary");
        }
    }

    // the page behind stays still while the header is open (globals.scss)
    useEffect(() => {
        if (visiblePanel) {
            document.documentElement.setAttribute("data-header-open", "");
            return () => document.documentElement.removeAttribute("data-header-open");
        }
    }, [visiblePanel]);

    function closePanel() {
        setPanel(null);
        menuButtonRef.current?.focus();
    }

    function handleSectionClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
        const target = document.getElementById(id);
        if (!target) {
            return;
        }
        event.preventDefault();
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        history.replaceState(null, "", `#${id}`);
        // the header closes and the focus follows the reader to the section
        setPanel(null);
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
        // the page is locked while the header is open (globals.scss); scrolling before it unlocks lands the section in the wrong place
        requestAnimationFrame(() => requestAnimationFrame(() => target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" })));
    }

    return (
        <header
            className={styles.header}
            data-panel={visiblePanel ?? ""}
            data-map={hasMap}
            style={{ viewTransitionName: "site-header" }}
            onKeyDown={(event) => {
                if (event.key === "Escape" && visiblePanel) {
                    closePanel();
                }
            }}
        >
            <div className={styles.bar}>
                <div className={styles.left}>
                    <div className={styles.brand}>
                        <Logo />
                    </div>
                    {hasMap && (
                        <button
                            type="button"
                            className={styles.where}
                            aria-expanded={showsSections}
                            aria-controls={PANEL_ID}
                            onClick={() => setPanel(showsSections ? null : "sections")}
                        >
                            <span className={styles.count}>
                                {currentIndex < 0 ? (isTrail ? "Linha do tempo" : "Nesta página") : `${isTrail ? "Era" : "Seção"} ${currentIndex + 1} de ${sections.length}`}
                                <ChevronDown aria-hidden="true" />
                            </span>
                            <span className={styles.name}>{currentLabel ?? "Início da página"}</span>
                        </button>
                    )}
                    <p className={styles.glossaryTitle}>
                        <BookOpen aria-hidden="true" />
                        Glossário
                    </p>
                </div>

                <MainNav placement="top" />

                <div className={styles.tools}>
                    <button type="button" className={styles.glossaryButton} onClick={(event) => openGlossary(null, event.currentTarget)}>
                        <BookOpen aria-hidden="true" />
                        Glossário
                    </button>
                    <ThemeToggle />
                </div>

                <button
                    ref={menuButtonRef}
                    type="button"
                    className={styles.menuButton}
                    aria-expanded={visiblePanel !== null}
                    aria-controls={PANEL_ID}
                    onClick={() => (visiblePanel ? closePanel() : setPanel("menu"))}
                >
                    {visiblePanel ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                    {visiblePanel ? "Fechar" : "Menu"}
                </button>

                {hasMap && <span ref={progressRef as RefObject<HTMLSpanElement>} className={styles.progress} aria-hidden="true" />}
            </div>

            <div id={PANEL_ID} className={styles.panels}>
                <div className={`${styles.panel} ${styles.menuPanel}`} inert={visiblePanel !== "menu"}>
                    <div className={styles.clip}>
                        <div className={styles.slide}>
                            <ul className={styles.menuList}>
                                <li>
                                    <button type="button" className={styles.menuRow} onClick={(event) => openGlossary(null, event.currentTarget)}>
                                        <BookOpen aria-hidden="true" />
                                        <span>
                                            Glossário
                                            <span className={styles.hint}>O que significam as palavras difíceis</span>
                                        </span>
                                    </button>
                                </li>
                                <li className={styles.appearance}>
                                    <span className={styles.appearanceLabel}>
                                        <Moon aria-hidden="true" />
                                        Aparência
                                    </span>
                                    <ThemeChoice />
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={`${styles.panel} ${styles.sectionsPanel}`} inert={!showsSections}>
                    <div className={styles.clip}>
                        <div className={styles.slide}>
                            <p className={styles.panelTitle}>{isTrail ? "Do mais novo ao mais antigo" : "Nesta página"}</p>
                            {isTrail ? (
                                <div className={styles.trail}>
                                    <ChronoClock sections={sections} />
                                    <SnakeTrail sections={sections} currentId={currentId} onNavigate={handleSectionClick} />
                                </div>
                            ) : (
                                <ol className={styles.sectionList}>
                                    {sections.map((section) => (
                                        <li key={section.id}>
                                            <a
                                                href={`#${section.id}`}
                                                aria-current={section.id === currentId ? "location" : undefined}
                                                onClick={(event) => handleSectionClick(event, section.id)}
                                            >
                                                {section.label}
                                                {section.id === currentId && <span className={styles.here}>Você está aqui</span>}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`${styles.panel} ${styles.glossaryPanel}`} inert={visiblePanel !== "glossary"}>
                    <div className={styles.clip}>
                        <div className={`${styles.slide} ${styles.glossarySlide}`}>
                            {hasOpenedGlossary && <GlossaryContent key={glossaryKey} idPrefix={GLOSSARY_PREFIX} currentId={glossaryTermId} />}
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.scrim} aria-hidden="true" onClick={closePanel} />
        </header>
    );
}