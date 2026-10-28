// geometry of the hemicycle in svg units, see "Hemicycle" in DESIGN.md
export const HEMICYCLE_WIDTH = 420;
export const HEMICYCLE_HEIGHT = 222;
export const CENTER_X = 210;
export const CENTER_Y = 212;
export const SEAT_SIZE = 6.4;

const INNER_RADIUS = 74;
const OUTER_RADIUS = 200;
const ROW_COUNT = 13;

// server and browser trigonometry differ in the last digits, rounding keeps hydration identical
function round(value: number): number {
    return Math.round(value * 100) / 100;
}

export interface SeatPosition {
    x: number;
    y: number;
    // rotation that makes the seat face the center, in degrees
    rotation: number;
}

// rows of a semicircle filled in order of angle, from left to right, so each party forms a slice
export function layoutSeats(partySizes: number[]): SeatPosition[][] {
    const seatCount = partySizes.reduce((sum, size) => sum + size, 0);
    const radii = Array.from({ length: ROW_COUNT }, (_, row) => INNER_RADIUS + ((OUTER_RADIUS - INNER_RADIUS) * row) / (ROW_COUNT - 1));
    const radiusSum = radii.reduce((sum, radius) => sum + radius, 0);

    // longer rows get more positions, the last row absorbs the rounding
    const rowCounts = radii.map((radius) => Math.round((seatCount * radius) / radiusSum));
    rowCounts[ROW_COUNT - 1] = (rowCounts[ROW_COUNT - 1] ?? 0) + seatCount - rowCounts.reduce((sum, count) => sum + count, 0);

    const positions: (SeatPosition & { angle: number; row: number })[] = [];
    radii.forEach((radius, row) => {
        const count = rowCounts[row] ?? 0;
        for (let index = 0; index < count; index++) {
            const angle = Math.PI - (index * Math.PI) / Math.max(1, count - 1);
            positions.push({
                // rounded so near ties sort the same way on server and browser
                angle: Math.round(angle * 1e6) / 1e6,
                row,
                x: round(CENTER_X + radius * Math.cos(angle)),
                y: round(CENTER_Y - radius * Math.sin(angle)),
                rotation: round(90 - (angle * 180) / Math.PI),
            });
        }
    });
    positions.sort((first, second) => second.angle - first.angle || first.row - second.row);

    const seatsByParty: SeatPosition[][] = [];
    let cursor = 0;
    for (const size of partySizes) {
        seatsByParty.push(positions.slice(cursor, cursor + size));
        cursor += size;
    }
    return seatsByParty;
}