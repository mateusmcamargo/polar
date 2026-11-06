import { ViewTransition, type ReactNode } from "react";

// navigation direction set on links with transitionTypes: forward goes deeper (list to profile, profile to spending, to a newer
// year), back returns. Links without a type, the browser back button and the reveal after loading.tsx use a short fade
export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];

const PAGE_CLASSES = { "nav-forward": "nav-forward", "nav-back": "nav-back" };

// wraps the content of a page, so the browser animates it when the route changes (View Transitions API, CSS in globals.scss).
// It goes in each page, not in a layout, because a layout stays mounted and never enters or exits
export function PageTransition({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <ViewTransition enter={{ ...PAGE_CLASSES, default: "page-enter" }} exit={{ ...PAGE_CLASSES, default: "page-exit" }} default="none">
            {children}
        </ViewTransition>
    );
}