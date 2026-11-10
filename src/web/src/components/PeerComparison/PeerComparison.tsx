import { SkeletonArea } from "@/components/Skeleton/Skeleton";
import { percentLabel, round2 } from "@/components/PartyMap/movementText";
import styles from "./PeerComparison.module.scss";

const moneyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// the deputies are grouped in this many slices of the ruler, so a ruler is a few paths and not one line per deputy
const SLICES = 200;
const VIEW_WIDTH = 1000;
// a slice with at least this many deputies is drawn darker; the first level is one or two deputies
const DARKER_FROM = [1, 3, 8, 20] as const;
const LEVEL_OPACITY = [0.3, 0.45, 0.65, 0.85] as const;

export interface PeerRuler {
    id: string;
    label: string;
    kind: "rate" | "money";
    // the value of every deputy in the comparison
    values: readonly number[];
    // the value of the deputy of the page, null when there is no record
    own: number | null;
}

function format(kind: PeerRuler["kind"], value: number): string {
    return kind === "rate" ? percentLabel(value) : moneyFormat.format(value);
}

// one path per darkness level, each with a vertical stroke for every slice of that level
function levelPaths(values: readonly number[], low: number, high: number): string[] {
    const counts = Array.from({ length: SLICES }, () => 0);
    for (const value of values) {
        const slice = high === low ? Math.floor(SLICES / 2) : Math.min(SLICES - 1, Math.floor(((value - low) / (high - low)) * SLICES));
        counts[slice] = (counts[slice] ?? 0) + 1;
    }
    const paths = LEVEL_OPACITY.map(() => "");
    counts.forEach((count, slice) => {
        const level = DARKER_FROM.findLastIndex((from) => count >= from);
        if (level >= 0) {
            paths[level] += `M${round2(((slice + 0.5) * VIEW_WIDTH) / SLICES)} 6V26`;
        }
    });
    return paths;
}

interface PeerComparisonProps {
    deputyName: string;
    rulers: readonly PeerRuler[];
}

// where the deputy stands among all the deputies in each number of the year: votes with the government, quota, office budget and housing
// allowance. A ruler goes from the lowest to the highest value, with the deputy marked and a sentence that says the same in words.
// The numbers are shown side by side and never ranked as better or worse (DESIGN.md, "Peer comparison")
export function PeerComparison({ deputyName, rulers }: Readonly<PeerComparisonProps>) {
    return (
        <div className={styles.peers}>
            <p className={styles.lead}>
                Cada régua vai do menor ao maior valor entre os deputados. Cada risco cinza mostra deputados com valor parecido: quanto mais escuro, mais
                deputados. O marcador preto é {deputyName}.
            </p>
            <div className={styles.rows}>
                {rulers.map((ruler) => {
                    const low = Math.min(...ruler.values);
                    const high = Math.max(...ruler.values);
                    const own = ruler.own;
                    const below = own === null ? 0 : ruler.values.filter((value) => value < own).length;
                    const equal = own === null ? 0 : ruler.values.filter((value) => value === own).length - 1;
                    const position = own === null ? null : high === low ? 50 : round2(((own - low) / (high - low)) * 100);
                    return (
                        <div key={ruler.id} className={styles.row} role="group" aria-label={ruler.label}>
                            <div className={styles.head}>
                                <h3 className={styles.name}>{ruler.label}</h3>
                                <p className={styles.amount}>{own === null ? "sem registro" : format(ruler.kind, own)}</p>
                            </div>
                            <p>
                                {own === null
                                    ? "Sem registro neste ano."
                                    : `Valor maior que o de ${below} dos ${ruler.values.length} deputados${equal > 0 ? `; igual ao de outros ${equal}` : ""}.`}
                            </p>
                            <div className={styles.ruler} aria-hidden="true">
                                <svg viewBox={`0 0 ${VIEW_WIDTH} 32`} preserveAspectRatio="none">
                                    <line className={styles.baseline} x1="0" x2={VIEW_WIDTH} y1="16" y2="16" />
                                    {levelPaths(ruler.values, low, high).map((path, level) =>
                                        path ? <path key={level} className={styles.slices} d={path} style={{ strokeOpacity: LEVEL_OPACITY[level] }} /> : null,
                                    )}
                                </svg>
                                {position !== null && <span className={styles.marker} style={{ left: `${position}%` }} />}
                            </div>
                            <p className={styles.ends} aria-hidden="true">
                                <span>menor: {format(ruler.kind, low)}</span>
                                <span>maior: {format(ruler.kind, high)}</span>
                            </p>
                        </div>
                    );
                })}
            </div>
            <p className={styles.sentence}>Os gráficos mostram dados lado a lado. Um número não explica o outro.</p>
        </div>
    );
}

// the rulers while they load: four boxes
export function PeerComparisonSkeleton() {
    return <SkeletonArea ratio="4 / 5" />;
}