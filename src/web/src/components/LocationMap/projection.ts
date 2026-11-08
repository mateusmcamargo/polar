import { STATE_SHAPES } from "@/components/StateMap/stateShapes";

// the outlines in stateShapes.ts are an equirectangular projection with the longitude scaled by cos 15°. The two scales and the
// anchor were fitted on known extremes of the outlines (the west end of Acre, the north end of Roraima and the north, south and
// west ends of Paraná) and checked against the Itaipu dam, which has to land on the western border of Paraná
const UNITS_PER_DEGREE_LATITUDE = 15.76;
const UNITS_PER_DEGREE_LONGITUDE = 15.22;
const ANCHOR = { longitude: -54.62, latitude: -22.52, x: 296.7, y: 440.1 };

export interface MapPoint {
    x: number;
    y: number;
}

// decimal degrees (negative to the south and to the west) to the svg units of the outlines
export function projectToMap(latitude: number, longitude: number): MapPoint {
    return {
        x: ANCHOR.x + (longitude - ANCHOR.longitude) * UNITS_PER_DEGREE_LONGITUDE,
        y: ANCHOR.y + (ANCHOR.latitude - latitude) * UNITS_PER_DEGREE_LATITUDE,
    };
}

export interface MapBounds {
    minX: number;
    minY: number;
    width: number;
    height: number;
}

// box around the outline of one state, for the cropped drawing of the cards
export function stateBounds(stateCode: string, margin: number): MapBounds {
    const path = STATE_SHAPES[stateCode]?.path ?? "";
    const numbers = (path.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const xs = numbers.filter((_, index) => index % 2 === 0);
    const ys = numbers.filter((_, index) => index % 2 === 1);
    const minX = Math.min(...xs) - margin;
    const minY = Math.min(...ys) - margin;
    return { minX, minY, width: Math.max(...xs) + margin - minX, height: Math.max(...ys) + margin - minY };
}