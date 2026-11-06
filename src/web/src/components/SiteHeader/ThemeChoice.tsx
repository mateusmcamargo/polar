"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, readEffectiveTheme, type Theme } from "@/components/ThemeToggle/ThemeToggle";
import styles from "./ThemeChoice.module.scss";

const CHOICES: readonly { theme: Theme; label: string }[] = [
    { theme: "light", label: "Claro" },
    { theme: "dark", label: "Escuro" },
];

// the theme changes through the data-theme attribute (any button) or the system preference
function subscribeToTheme(onChange: () => void): () => void {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener("change", onChange);
    return () => {
        observer.disconnect();
        query.removeEventListener("change", onChange);
    };
}

// the two themes as words, for the menu of the phone header, where a button that only shows a moon or a sun would not say what it does
export function ThemeChoice() {
    // the server does not know the theme, so no button is marked until the page is on screen
    const current = useSyncExternalStore(subscribeToTheme, readEffectiveTheme, () => null);

    return (
        <div className={styles.choice} role="group" aria-label="Aparência do site">
            {CHOICES.map(({ theme, label }) => (
                <button key={theme} type="button" aria-pressed={current === theme} onClick={() => applyTheme(theme)}>
                    {label}
                </button>
            ))}
        </div>
    );
}