import type { MarcoLocation } from "@polar/db/marcos";
import { MAP_HEIGHT, MAP_WIDTH, STATE_SHAPES } from "@/components/StateMap/stateShapes";
import { projectToMap, stateBounds } from "./projection";
import styles from "./LocationMap.module.scss";

interface LocationMapProps {
    location: MarcoLocation;
    // the landmark name, for the title read by screen readers
    name: string;
    // "full" draws all of Brazil, "thumb" is cropped to the state and is meant for cards
    variant?: "full" | "thumb";
    // unique on the page, links the svg to its title and description
    idPrefix: string;
}

const MARKER_RADIUS = { full: 11, thumb: 5 };
const THUMB_MARGIN = 6;

// map of Brazil with the state of the landmark filled and a round point at its real latitude and longitude (DESIGN.md, "Landmarks")
export function LocationMap({ location, name, variant = "full", idPrefix }: Readonly<LocationMapProps>) {
    const point = projectToMap(location.latitude, location.longitude);
    const bounds = variant === "thumb" ? stateBounds(location.stateCode, THUMB_MARGIN) : { minX: 0, minY: 0, width: MAP_WIDTH, height: MAP_HEIGHT };
    const highlighted = STATE_SHAPES[location.stateCode];
    const titleId = `${idPrefix}-title`;
    const descriptionId = `${idPrefix}-description`;
    const visibleStates = Object.entries(STATE_SHAPES).filter(([code]) => variant === "full" || code === location.stateCode);

    return (
        <svg
            className={variant === "thumb" ? styles.thumb : styles.full}
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
        >
            <title id={titleId}>{`Mapa do Brasil marcando: ${name}`}</title>
            <desc id={descriptionId}>{location.description}</desc>
            {visibleStates
                .filter(([code]) => code !== location.stateCode)
                .map(([code, shape]) => (
                    <path key={code} className={styles.state} d={shape.path} />
                ))}
            {highlighted && <path className={styles.highlight} d={highlighted.path} />}
            <circle className={styles.marker} cx={point.x} cy={point.y} r={MARKER_RADIUS[variant]} />
        </svg>
    );
}