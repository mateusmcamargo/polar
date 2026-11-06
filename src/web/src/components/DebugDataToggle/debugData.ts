"use client";

import { useSyncExternalStore } from "react";

// debug mode (DEBUG_MODE=true in the root .env) shows a floating switch that turns the data off, so the loading states can be
// seen and styled. Outside debug mode the data is always on. The choice lives in localStorage, shared by every tab
const STORAGE_KEY = "debug-data";
const listeners = new Set<() => void>();

export const IS_DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === "true";

function readEnabled(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
        return true;
    }
}

function subscribe(onChange: () => void): () => void {
    listeners.add(onChange);
    window.addEventListener("storage", onChange);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
    };
}

export function setDataEnabled(enabled: boolean) {
    try {
        localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
        // without storage the switch does nothing
    }
    listeners.forEach((listener) => listener());
}

// false only in debug mode with the switch off; the server and the first render always say true
export function useDataEnabled(): boolean {
    const stored = useSyncExternalStore(subscribe, readEnabled, () => true);
    return !IS_DEBUG_MODE || stored;
}
