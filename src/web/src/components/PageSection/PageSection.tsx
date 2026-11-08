import type { ReactNode } from "react";
import { SectionIcon, type SectionIconName } from "@/components/SectionIcon/SectionIcon";
import { MapEntry } from "./MapEntry";
import styles from "./PageSection.module.scss";

interface PageSectionProps {
    // anchor of the section, used by the page map and by links to it
    id: string;
    title: string;
    // the same icon is drawn in the title and in the page map
    icon: SectionIconName;
    // shorter name for the page map, when the title is long or comes from data
    label?: string;
    // small line above the title that groups sections ("A pessoa", "O governo")
    kicker?: string;
    // extra class for the layout of the content of this page
    className?: string;
    // -1 lets a script move the focus to the section after jumping to it
    tabIndex?: number;
    children: ReactNode;
}

// a section of a page: ink rule, kicker and title with its icon (DESIGN.md, "Page map"). It also registers itself in the page map, so
// the map is never written by hand and follows the page: a section that is not rendered is not in the map
export function PageSection({ id, title, icon, label, kicker, className, tabIndex, children }: Readonly<PageSectionProps>) {
    const titleId = `${id}-title`;

    return (
        <section id={id} className={className ? `${styles.block} ${className}` : styles.block} aria-labelledby={titleId} tabIndex={tabIndex}>
            <MapEntry id={id} label={label ?? title} icon={icon} />
            {kicker && <p className={styles.kicker}>{kicker}</p>}
            <h2 id={titleId} className={styles.title}>
                <SectionIcon name={icon} />
                {title}
            </h2>
            {children}
        </section>
    );
}