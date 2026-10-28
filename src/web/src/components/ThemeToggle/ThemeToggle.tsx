"use client";

import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.scss";

export const THEME_STORAGE_KEY = "theme";

function readEffectiveTheme(): "light" | "dark" {
    const root = document.documentElement;
    const explicitTheme = root.getAttribute("data-theme");
    if (explicitTheme === "light" || explicitTheme === "dark") {
        return explicitTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
    // react strict mode clears the attribute set by the inline script on the dev remount, this restores it
    useLayoutEffect(() => {
        try {
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (storedTheme === "light" || storedTheme === "dark") {
                document.documentElement.setAttribute("data-theme", storedTheme);
            }
        } catch {
            // storage can be blocked, the system preference applies
        }
    }, []);

    function toggleTheme() {
        const nextTheme = readEffectiveTheme() === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", nextTheme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch {
            // the choice still applies until the page is closed
        }
    }

    // both icons are rendered and css shows the right one, so the markup is the same on server and client
    return (
        <button type="button" className={styles.toggle} onClick={toggleTheme} aria-label="Alternar entre tema claro e escuro">
            <Moon className={styles.moon} aria-hidden="true" />
            <Sun className={styles.sun} aria-hidden="true" />
        </button>
    );
}