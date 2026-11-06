import Image from "next/image";
import Link from "next/link";
import { Briefcase, Crown, Hourglass, Landmark, Users, type LucideIcon } from "lucide-react";
import type { GalleryEntry, RulerRole, RulerTerm } from "@polar/db/rulers";
import { NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import styles from "./RulerCard.module.scss";

// the icon never stands alone, the office name is always next to it
export const ROLE_DISPLAY: Readonly<Record<RulerRole, { label: string; icon: LucideIcon }>> = {
    president: { label: "Presidente", icon: Landmark },
    primeMinister: { label: "Primeiro-ministro", icon: Briefcase },
    emperor: { label: "Imperador", icon: Crown },
    king: { label: "Rei", icon: Crown },
    regent: { label: "Regente", icon: Hourglass },
    princessRegent: { label: "Princesa regente", icon: Hourglass },
    regency: { label: "Regência de três", icon: Users },
    junta: { label: "Junta militar", icon: Users },
};

function termText(term: RulerTerm): string {
    if (term.end === null) {
        return `desde ${term.start}`;
    }
    return term.start === term.end ? `${term.start}` : `${term.start}–${term.end}`;
}

export function termsText(entry: GalleryEntry): string {
    // "1887–1888, 1876–1877 e 1871–1872"
    return new Intl.ListFormat("pt-BR", { type: "conjunction" }).format(entry.terms.map(termText));
}

function initials(name: string): string {
    const words = name.split(" ").filter((word) => word.length > 2);
    return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
}

interface RulerCardProps {
    entry: GalleryEntry;
    hasPage: boolean;
}

// gallery card in two parts, the portrait on top edge to edge and the text below (office, name and terms); only people with a page are links, the others say "Em breve"
export function RulerCard({ entry, hasPage }: Readonly<RulerCardProps>) {
    const portrait = entry.portrait ? (
        <Image className={styles.photo} src={entry.portrait.file} alt="" width={240} height={320} sizes="(min-width: 600px) 180px, 45vw" />
    ) : (
        <span className={styles.placeholder} aria-hidden="true">
            {entry.role === "junta" ? "Junta" : entry.role === "regency" ? "Regência" : initials(entry.name)}
        </span>
    );
    const frame = <span className={styles.frame}>{portrait}</span>;
    const role = ROLE_DISPLAY[entry.role];
    const names = (
        <>
            <span className={styles.role}>
                <role.icon aria-hidden="true" />
                {role.label}
            </span>
            <span className={styles.name}>{entry.name}</span>
            <span className={styles.years}>{termsText(entry)}</span>
        </>
    );

    if (hasPage) {
        return (
            <Link className={`${styles.card} ${styles.open}`} href={`/governantes/${entry.slug}`} transitionTypes={NAV_FORWARD}>
                {frame}
                <span className={styles.body}>
                    {names}
                    <span className={styles.cta}>Ver história</span>
                </span>
            </Link>
        );
    }
    return (
        <div className={`${styles.card} ${styles.soon}`}>
            {frame}
            <span className={styles.body}>
                {names}
                <span className={styles.soonLabel}>Em breve</span>
            </span>
        </div>
    );
}