// layouts of the party map: the drawing keeps its own size and scales to the column, and a phone gets a taller layout with its own
// text size instead of the wide one squeezed (same pattern as GenerationChart)

export interface MapLayout {
    key: "wide" | "narrow";
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
    maxRadius: number;
    // width of one letter of a bold party acronym, used to keep the labels apart
    charWidth: number;
    // distance between the grid lines, as a share of the axis
    xStep: number;
    yStep: number;
}

export const WIDE_MAP: MapLayout = {
    key: "wide",
    width: 640,
    height: 520,
    left: 56,
    right: 24,
    top: 16,
    bottom: 62,
    maxRadius: 34,
    charWidth: 8,
    xStep: 0.1,
    yStep: 0.1,
};

export const NARROW_MAP: MapLayout = {
    key: "narrow",
    width: 360,
    height: 440,
    left: 44,
    right: 26,
    top: 16,
    bottom: 58,
    maxRadius: 22,
    charWidth: 8.5,
    xStep: 0.25,
    yStep: 0.2,
};

export const MIN_RADIUS = 4;

export interface LabelItem {
    key: string;
    cx: number;
    cy: number;
    radius: number;
    text: string;
}

export interface PlacedLabel {
    x: number;
    y: number;
    anchor: "start" | "middle" | "end";
}

interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
}

const LABEL_HEIGHT = 15;

function boxOf(label: PlacedLabel, textWidth: number): Box {
    const left = label.anchor === "start" ? label.x : label.anchor === "end" ? label.x - textWidth : label.x - textWidth / 2;
    return { left, top: label.y - 12, width: textWidth, height: LABEL_HEIGHT };
}

function overlaps(first: Box, second: Box): boolean {
    return first.left < second.left + second.width && second.left < first.left + first.width && first.top < second.top + second.height && second.top < first.top + first.height;
}

// the first free spot around each circle, largest circles first; when none is free the label goes to the right of the circle
export function placeLabels(items: readonly LabelItem[], layout: MapLayout): Map<string, PlacedLabel> {
    const placed: Box[] = [];
    const result = new Map<string, PlacedLabel>();
    for (const item of [...items].sort((first, second) => second.radius - first.radius)) {
        const textWidth = item.text.length * layout.charWidth + 6;
        const gap = 4;
        const options: PlacedLabel[] = [
            { x: item.cx + item.radius + gap, y: item.cy + 4, anchor: "start" },
            { x: item.cx - item.radius - gap, y: item.cy + 4, anchor: "end" },
            { x: item.cx, y: item.cy - item.radius - 5, anchor: "middle" },
            { x: item.cx, y: item.cy + item.radius + 14, anchor: "middle" },
            { x: item.cx + item.radius + gap, y: item.cy - 10, anchor: "start" },
            { x: item.cx - item.radius - gap, y: item.cy - 10, anchor: "end" },
            { x: item.cx + item.radius + gap, y: item.cy + 18, anchor: "start" },
            { x: item.cx - item.radius - gap, y: item.cy + 18, anchor: "end" },
        ];
        const fits = (option: PlacedLabel) => {
            const box = boxOf(option, textWidth);
            return box.left >= 2 && box.left + box.width <= layout.width - 2 && !placed.some((other) => overlaps(box, other));
        };
        const choice = options.find(fits) ?? options[0];
        if (choice) {
            placed.push(boxOf(choice, textWidth));
            result.set(item.key, choice);
        }
    }
    return result;
}