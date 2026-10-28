import { PARTY_COLORS } from "@polar/db/party-colors";
import styles from "./PartyBadge.module.scss";

const NO_PARTY_ACRONYM = "S.PART.";

function relativeLuminance(hexColor: string): number {
    const channels = [1, 3, 5].map((start) => {
        const value = Number.parseInt(hexColor.slice(start, start + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const [red = 0, green = 0, blue = 0] = channels;
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

// black or white text, whichever has the higher contrast against the party color
function textTokenFor(hexColor: string): string {
    const luminance = relativeLuminance(hexColor);
    const contrastWithWhite = 1.05 / (luminance + 0.05);
    const contrastWithBlack = (luminance + 0.05) / (relativeLuminance("#121110") + 0.05);
    return contrastWithWhite >= contrastWithBlack ? "var(--color-on-data-dark)" : "var(--color-on-data-light)";
}

interface PartyBadgeProps {
    acronym: string | null;
}

export function PartyBadge({ acronym }: Readonly<PartyBadgeProps>) {
    if (!acronym || acronym === NO_PARTY_ACRONYM) {
        return <span className={styles.neutral}>Sem partido</span>;
    }

    const partyColor = PARTY_COLORS[acronym];
    if (!partyColor) {
        return <span className={styles.neutral}>{acronym}</span>;
    }

    return (
        <span className={styles.badge} style={{ backgroundColor: partyColor.color, color: textTokenFor(partyColor.color) }}>
            {acronym}
        </span>
    );
}