import type { CSSProperties, ReactNode } from "react";
import styles from "./Skeleton.module.scss";

// widths that repeat along a list, so the rows look like text of different lengths
const LINE_WIDTHS = ["72%", "56%", "64%", "48%", "68%", "52%"];
const META_WIDTHS = ["40%", "32%", "46%", "36%"];
const TRACK_WIDTHS = ["92%", "64%", "48%", "36%", "28%", "20%"];
const BAR_WIDTHS = ["64%", "88%", "52%", "76%", "40%", "70%", "58%", "94%", "46%", "80%", "34%", "66%"];

function pick(widths: readonly string[], index: number): string {
    return widths[index % widths.length] ?? "100%";
}

function classNames(...names: (string | false | undefined)[]): string {
    return names.filter(Boolean).join(" ");
}

type SkeletonShape = "text" | "block" | "circle";

interface SkeletonProps {
    // text is one line of the surrounding font size; block is a box; circle keeps its width as height
    shape?: SkeletonShape;
    // any css length; percentages follow the parent, so the shape stretches with the screen
    width?: string;
    height?: string;
    className?: string;
}

// one placeholder shape: the panel fill with a soft sweep, square like every other shape of the site
export function Skeleton({ shape = "text", width, height, className }: Readonly<SkeletonProps>) {
    const style = { "--skeleton-width": width, "--skeleton-height": height } as CSSProperties;
    return <span className={classNames(styles.skeleton, styles[shape], className)} style={style} aria-hidden="true" />;
}

// the only part a screen reader hears: the shapes are hidden, this hidden text says that the data is on its way
export function SkeletonStatus({ label = "Carregando os dados…" }: Readonly<{ label?: string }>) {
    return (
        <p role="status" className="visually-hidden">
            {label}
        </p>
    );
}

interface SkeletonRowsProps {
    count: number;
    // what opens each row: a round photo, a tag (party badge, state code) or a timeline pin
    leading?: "avatar" | "tag" | "pin";
    // a second, shorter line below the first, like the date or the party under a name
    hasMeta?: boolean;
    // a short value at the right, like an amount or a vote
    hasValue?: boolean;
    // a thin bar below the text, like the share of a spending category
    hasTrack?: boolean;
    // hairlines between the rows, as in the data lists; off inside the select window
    hasDividers?: boolean;
    // row height: small for select options (44 px), medium for data lists, large for lists with photos
    size?: "small" | "medium" | "large";
    className?: string;
}

// rows of a list: the shape of most data blocks (votes, committees, suppliers, receipts, deputies)
export function SkeletonRows({
    count,
    leading,
    hasMeta = false,
    hasValue = false,
    hasTrack = false,
    hasDividers = true,
    size = "medium",
    className,
}: Readonly<SkeletonRowsProps>) {
    return (
        <div className={classNames(styles.rows, hasDividers && styles.divided, className)} aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className={classNames(styles.row, styles[size])}>
                    {leading === "avatar" && <Skeleton shape="circle" width="56px" />}
                    {leading === "tag" && <Skeleton shape="block" width="48px" height="22px" />}
                    {leading === "pin" && <Skeleton shape="circle" width="12px" />}
                    <span className={styles.rowBody}>
                        <Skeleton width={pick(LINE_WIDTHS, index)} />
                        {hasMeta && <Skeleton width={pick(META_WIDTHS, index)} className={styles.meta} />}
                        {hasTrack && <Skeleton shape="block" width={pick(TRACK_WIDTHS, index)} height="6px" />}
                    </span>
                    {hasValue && <Skeleton width="4.5em" />}
                </div>
            ))}
        </div>
    );
}

// big figures side by side (one column on phones), each with a label and a smaller base line, like the year summary
export function SkeletonFigures({ count, className }: Readonly<{ count: number; className?: string }>) {
    const style = { "--skeleton-columns": count } as CSSProperties;
    return (
        <div className={classNames(styles.figures, className)} style={style} aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className={styles.figure}>
                    <Skeleton width="3.2em" className={styles.figureNumber} />
                    <Skeleton width={pick(LINE_WIDTHS, index)} />
                    <Skeleton width={pick(META_WIDTHS, index)} className={styles.meta} />
                </div>
            ))}
        </div>
    );
}

// horizontal bars with a label and a value, like the months of the spending or the quota against the average
export function SkeletonBars({ count, className }: Readonly<{ count: number; className?: string }>) {
    return (
        <div className={classNames(styles.bars, className)} aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className={styles.bar}>
                    <Skeleton width="3em" />
                    <span className={styles.barTrack}>
                        <Skeleton shape="block" width={pick(BAR_WIDTHS, index)} height="12px" />
                    </span>
                    <Skeleton width="4.5em" />
                </div>
            ))}
        </div>
    );
}

// pieces of one block stacked with the usual gap, such as a figure above its bars
export function SkeletonStack({ children, className }: Readonly<{ children: ReactNode; className?: string }>) {
    return (
        <div className={classNames(styles.stack, className)} aria-hidden="true">
            {children}
        </div>
    );
}

// fields of a filter bar, as tall as the real controls: one column on phones, side by side from small screens
export function SkeletonControls({ count, className }: Readonly<{ count: number; className?: string }>) {
    const style = { "--skeleton-columns": count } as CSSProperties;
    return (
        <div className={classNames(styles.controls, className)} style={style} aria-hidden="true">
            {Array.from({ length: count }, (_, index) => (
                <span key={index} className={styles.control}>
                    <Skeleton width="5em" className={styles.meta} />
                    <Skeleton shape="block" height="44px" />
                </span>
            ))}
        </div>
    );
}

interface SkeletonAreaProps {
    // width / height of the drawing it stands for, such as "420 / 222" for the chamber
    ratio: string;
    // the largest width of the drawing; it shrinks with the screen below that
    maxWidth?: string;
    className?: string;
}

// one box with the proportions of a drawing (chamber, map, chart), so the page does not jump when it arrives
export function SkeletonArea({ ratio, maxWidth, className }: Readonly<SkeletonAreaProps>) {
    const style = { "--skeleton-ratio": ratio, "--skeleton-max-width": maxWidth } as CSSProperties;
    return (
        <span className={classNames(styles.areaFrame, className)} style={style} aria-hidden="true">
            <Skeleton shape="block" height="auto" className={styles.area} />
        </span>
    );
}