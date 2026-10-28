"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { stateName } from "@/components/DeputySearch/brazilianStates";
import { MAP_HEIGHT, MAP_WIDTH, STATE_SHAPES } from "./stateShapes";
import styles from "./StateMap.module.scss";

const COLOR_STEPS = 5;
// too small for a readable label, the tooltip and the state buttons name them
const STATES_WITHOUT_LABEL = new Set(["AL", "DF", "ES", "PB", "RJ", "RN", "SE"]);

type CountRange = readonly [number, number];

// up to five ranges that split the distinct non zero values in equal parts
function buildCountRanges(counts: Record<string, number>): CountRange[] {
    const values = [...new Set(Object.values(counts).filter((count) => count > 0))].sort((first, second) => first - second);
    const steps = Math.min(COLOR_STEPS, values.length);
    const ranges: CountRange[] = [];
    for (let step = 0; step < steps; step++) {
        const low = values[Math.floor((step * values.length) / steps)] ?? 0;
        const high = values[Math.floor(((step + 1) * values.length) / steps) - 1] ?? low;
        ranges.push([low, high]);
    }
    return ranges;
}

// 0 is the empty color; ranges use the darkest steps when there are fewer than five
function colorStep(ranges: CountRange[], count: number): number {
    if (count === 0) {
        return 0;
    }
    const rangeIndex = ranges.findIndex(([low, high]) => count >= low && count <= high);
    return rangeIndex + 1 + (COLOR_STEPS - ranges.length);
}

function deputiesLabel(count: number): string {
    return `${count} ${count === 1 ? "deputado" : "deputados"}`;
}

interface Tooltip {
    stateCode: string;
    left: number;
    top: number;
}

interface StateMapProps {
    countsByState: Record<string, number>;
    selectedStateCode: string;
    legendTitle: string;
    // when set, the scale goes from the background to this color instead of the default scale
    scaleColor?: string;
    onSelectState: (stateCode: string) => void;
}

export function StateMap({ countsByState, selectedStateCode, legendTitle, scaleColor, onSelectState }: Readonly<StateMapProps>) {
    const frameRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<Tooltip | null>(null);

    const ranges = buildCountRanges(countsByState);
    const hasEmptyStates = Object.values(countsByState).some((count) => count === 0);
    const stateCodes = Object.keys(STATE_SHAPES);
    // the selected state is drawn last so its thick outline is not covered by neighbors
    const drawingOrder = [...stateCodes.filter((code) => code !== selectedStateCode), ...stateCodes.filter((code) => code === selectedStateCode)];
    const topStates = Object.entries(countsByState)
        .sort((first, second) => second[1] - first[1])
        .slice(0, 3)
        .map(([code, count]) => `${stateName(code)}, ${count}`)
        .join("; ");

    function showTooltip(event: PointerEvent<SVGPathElement>, stateCode: string) {
        const frame = frameRef.current?.getBoundingClientRect();
        if (!frame) {
            return;
        }
        setTooltip({ stateCode, left: event.clientX - frame.left, top: event.clientY - frame.top });
    }

    return (
        <div
            className={scaleColor ? `${styles.map} ${styles.colorScale}` : styles.map}
            style={scaleColor ? ({ "--map-scale-color": scaleColor } as CSSProperties) : undefined}
        >
            <div className={styles.frame} ref={frameRef}>
                {/* the state buttons below the map are the keyboard and screen reader path, the map is a pointer shortcut */}
                <svg
                    className={styles.drawing}
                    viewBox={`-4 -4 ${MAP_WIDTH + 8} ${MAP_HEIGHT + 8}`}
                    role="img"
                    aria-label={`Mapa do Brasil. ${legendTitle}. Estados com mais deputados: ${topStates}.`}
                    onPointerLeave={() => setTooltip(null)}
                >
                    {drawingOrder.map((code) => {
                        const step = colorStep(ranges, countsByState[code] ?? 0);
                        return (
                            <path
                                key={code}
                                d={STATE_SHAPES[code]?.path}
                                className={code === selectedStateCode ? styles.selectedState : styles.state}
                                style={{ fill: `var(--map-${step})` }}
                                onClick={() => onSelectState(code)}
                                onPointerMove={(event) => showTooltip(event, code)}
                            />
                        );
                    })}
                    {stateCodes
                        .filter((code) => !STATES_WITHOUT_LABEL.has(code))
                        .map((code) => {
                            const shape = STATE_SHAPES[code];
                            const step = colorStep(ranges, countsByState[code] ?? 0);
                            return (
                                <text
                                    key={code}
                                    x={shape?.labelX}
                                    y={shape?.labelY}
                                    className={styles.label}
                                    style={{ fill: step >= 4 ? "var(--map-on-dark-steps)" : "var(--map-on-light-steps)" }}
                                >
                                    {code}
                                </text>
                            );
                        })}
                </svg>
                {tooltip && (
                    <div className={styles.tooltip} style={{ left: tooltip.left, top: tooltip.top }} aria-hidden="true">
                        <strong>{stateName(tooltip.stateCode)}</strong> · {deputiesLabel(countsByState[tooltip.stateCode] ?? 0)}
                    </div>
                )}
            </div>
            <div className={styles.legend}>
                <p className={styles.legendTitle}>{legendTitle}</p>
                <ol className={styles.legendSteps}>
                    {hasEmptyStates && (
                        <li className={styles.legendStep}>
                            <span className={styles.swatch} style={{ background: "var(--map-0)" }} />
                            nenhum
                        </li>
                    )}
                    {ranges.map(([low, high], index) => (
                        <li key={low} className={styles.legendStep}>
                            <span className={styles.swatch} style={{ background: `var(--map-${index + 1 + (COLOR_STEPS - ranges.length)})` }} />
                            {low === high ? low : `${low} a ${high}`}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}