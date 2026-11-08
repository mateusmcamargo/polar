import Link from "next/link";
import { Building2, Landmark, MapPin, type LucideIcon } from "lucide-react";
import type { MarcoGalleryEntry, MarcoKind } from "@polar/db/marcos";
import { LocationMap } from "@/components/LocationMap/LocationMap";
import { NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import styles from "./MarcoCard.module.scss";

// the icon never stands alone, the kind of landmark is always written next to it
const KIND_DISPLAY: Readonly<Record<MarcoKind, { label: string; icon: LucideIcon }>> = {
    work: { label: "Grande obra", icon: Building2 },
    event: { label: "Fato histórico", icon: Landmark },
    place: { label: "Lugar", icon: MapPin },
};

interface MarcoCardProps {
    entry: MarcoGalleryEntry;
}

// list card in two parts, the state with the point of the landmark on top and the text below (kind, name and caption)
export function MarcoCard({ entry }: Readonly<MarcoCardProps>) {
    const kind = KIND_DISPLAY[entry.kind];

    return (
        <Link className={styles.card} href={`/marcos/${entry.slug}`} transitionTypes={NAV_FORWARD}>
            <span className={styles.frame}>
                <LocationMap location={entry.location} name={entry.name} variant="thumb" idPrefix={`card-${entry.slug}`} />
            </span>
            <span className={styles.body}>
                <span className={styles.kind}>
                    <kind.icon aria-hidden="true" />
                    {kind.label}
                </span>
                <span className={styles.name}>{entry.name}</span>
                <span className={styles.caption}>{entry.caption}</span>
                <span className={styles.cta}>Ver o marco</span>
            </span>
        </Link>
    );
}