"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, type HTMLAttributes, type PointerEvent, type ReactNode, type Ref, type UIEvent } from "react";
import styles from "./ScrollSlider.module.scss";

const MIN_THUMB_LENGTH = 44;

type Direction = "horizontal" | "vertical";

interface ScrollSliderProps extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "children"> {
    // horizontal: the bar sits below the area (the phone sliders); vertical: beside it (the scrolling lists)
    direction?: Direction;
    // classes of the scrolling area, which set its size: the horizontal-slider mixin, or the max height of a list
    className?: string;
    // classes of the outer frame, for parents that size it, such as the glossary panel
    frameClassName?: string;
    // the scrolling area, for parents that move it themselves (back to the start after a filter, to a term)
    ref?: Ref<HTMLDivElement>;
    children: ReactNode;
}

interface Drag {
    pointerId: number;
    startPointer: number;
    startScroll: number;
    pixelsPerThumbPixel: number;
}

// the same math for both directions, read through these names
function axis(viewport: HTMLElement, direction: Direction) {
    return direction === "horizontal"
        ? { scroll: viewport.scrollLeft, size: viewport.clientWidth, content: viewport.scrollWidth }
        : { scroll: viewport.scrollTop, size: viewport.clientHeight, content: viewport.scrollHeight };
}

function setScroll(viewport: HTMLElement, direction: Direction, value: number) {
    if (direction === "horizontal") {
        viewport.scrollLeft = value;
    } else {
        viewport.scrollTop = value;
    }
}

// scrolling area with a large, high contrast bar in place of the native scrollbar, which phones and Firefox draw thin and
// without our colors. The bar follows the real scroll and dragging it scrolls the area. It only shows while the content
// overflows, and it is hidden from assistive technology: the area keeps its native scrolling with touch, wheel and keyboard
export function ScrollSlider({ direction = "horizontal", className, frameClassName, ref, children, onScroll, ...viewportProps }: Readonly<ScrollSliderProps>) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<Drag | null>(null);
    const isHorizontal = direction === "horizontal";

    // the thumb moves through the dom, so scrolling never re-renders the children
    function updateThumb() {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        const thumb = thumbRef.current;
        if (!viewport || !track || !thumb) {
            return;
        }
        const { scroll, size, content } = axis(viewport, direction);
        const scrollRange = content - size;
        track.hidden = scrollRange <= 1;
        if (track.hidden) {
            return;
        }
        const trackLength = isHorizontal ? track.clientWidth : track.clientHeight;
        const thumbLength = Math.max(MIN_THUMB_LENGTH, (trackLength * size) / content);
        const thumbOffset = (scroll / scrollRange) * (trackLength - thumbLength);
        thumb.style[isHorizontal ? "width" : "height"] = `${thumbLength}px`;
        thumb.style.transform = isHorizontal ? `translateX(${thumbOffset}px)` : `translateY(${thumbOffset}px)`;
    }

    // after every render and before the paint, because a filter can hide items without changing the size of the area
    useLayoutEffect(updateThumb);

    const handleResize = useEffectEvent(updateThumb);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) {
            return;
        }
        const observer = new ResizeObserver(() => handleResize());
        observer.observe(viewport);
        for (const child of viewport.children) {
            observer.observe(child);
        }
        return () => observer.disconnect();
    }, []);

    function setViewportRef(element: HTMLDivElement | null) {
        viewportRef.current = element;
        if (typeof ref === "function") {
            ref(element);
        } else if (ref) {
            ref.current = element;
        }
    }

    function handleScroll(event: UIEvent<HTMLDivElement>) {
        updateThumb();
        onScroll?.(event);
    }

    // a press on the thumb drags it; a press on the rail first centers the thumb there, then drags
    function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        const thumb = thumbRef.current;
        if (!viewport || !track || !thumb || event.button !== 0) {
            return;
        }
        const { size, content } = axis(viewport, direction);
        const thumbLength = isHorizontal ? thumb.offsetWidth : thumb.offsetHeight;
        const scrollRange = content - size;
        const thumbRange = (isHorizontal ? track.clientWidth : track.clientHeight) - thumbLength;
        if (scrollRange <= 0 || thumbRange <= 0) {
            return;
        }
        const pixelsPerThumbPixel = scrollRange / thumbRange;
        const pointer = isHorizontal ? event.clientX : event.clientY;
        if (event.target !== thumb) {
            const trackStart = isHorizontal ? track.getBoundingClientRect().left : track.getBoundingClientRect().top;
            const thumbOffset = pointer - trackStart - thumbLength / 2;
            setScroll(viewport, direction, Math.min(Math.max(thumbOffset, 0), thumbRange) * pixelsPerThumbPixel);
        }
        // snapping would pull the area back while the thumb is held
        viewport.style.scrollSnapType = "none";
        dragRef.current = { pointerId: event.pointerId, startPointer: pointer, startScroll: axis(viewport, direction).scroll, pixelsPerThumbPixel };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId || !viewportRef.current) {
            return;
        }
        const pointer = isHorizontal ? event.clientX : event.clientY;
        setScroll(viewportRef.current, direction, drag.startScroll + (pointer - drag.startPointer) * drag.pixelsPerThumbPixel);
    }

    function endDrag(event: PointerEvent<HTMLDivElement>) {
        if (dragRef.current?.pointerId !== event.pointerId) {
            return;
        }
        dragRef.current = null;
        if (viewportRef.current) {
            viewportRef.current.style.scrollSnapType = "";
        }
    }

    const frameClasses = [styles.slider, isHorizontal ? styles.horizontal : styles.vertical, frameClassName].filter(Boolean).join(" ");
    return (
        <div className={frameClasses}>
            <div {...viewportProps} ref={setViewportRef} className={className ? `${styles.viewport} ${className}` : styles.viewport} onScroll={handleScroll}>
                {children}
            </div>
            <div
                ref={trackRef}
                className={styles.track}
                aria-hidden="true"
                // horizontal bars belong to phone sliders, which overflow: the server html already shows them (css hides them from
                // 900 px), so the bar does not pop in after hydration; vertical bars wait for the measure
                hidden={!isHorizontal}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
            >
                <div ref={thumbRef} className={styles.thumb} />
            </div>
        </div>
    );
}