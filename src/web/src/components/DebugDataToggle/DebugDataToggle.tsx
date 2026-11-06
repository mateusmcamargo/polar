"use client";

import { Database } from "lucide-react";
import { IS_DEBUG_MODE, setDataEnabled, useDataEnabled } from "./debugData";
import styles from "./DebugDataToggle.module.scss";

// floating switch of debug mode; renders nothing outside it
export function DebugDataToggle() {
    const isEnabled = useDataEnabled();
    if (!IS_DEBUG_MODE) {
        return null;
    }
    return (
        <button type="button" role="switch" aria-checked={isEnabled} className={styles.toggle} onClick={() => setDataEnabled(!isEnabled)}>
            <Database aria-hidden="true" />
            <span className={styles.text}>Carregar dados</span>
            <span className={styles.track} aria-hidden="true">
                <span className={styles.thumb} />
            </span>
        </button>
    );
}
