"use client";

import { useState } from "react";
import styles from "./SummaryMetrics.module.scss";

export interface SummaryMetric {
    id: string;
    label: string;
    // null when there is too little data, see "Metrics" in USE_CASES.md
    figure: string | null;
    base: string;
    explanation: string;
}

interface SummaryMetricsProps {
    metrics: SummaryMetric[];
}

// one explanation open at a time, below the strip, so the area keeps a single comic block
export function SummaryMetrics({ metrics }: Readonly<SummaryMetricsProps>) {
    const [openMetricId, setOpenMetricId] = useState<string | null>(null);
    const openMetric = metrics.find((metric) => metric.id === openMetricId);

    return (
        <div className={styles.summary}>
            <div className={styles.metrics}>
                {metrics.map((metric) => (
                    <div key={metric.id} className={styles.metric}>
                        <span className={styles.figure}>{metric.figure ?? "–"}</span>
                        <span className={styles.label}>{metric.label}</span>
                        <span className={styles.base}>{metric.base}</span>
                        <button
                            type="button"
                            className={styles.term}
                            aria-expanded={openMetricId === metric.id}
                            aria-controls={`metric-${metric.id}`}
                            onClick={() => setOpenMetricId(openMetricId === metric.id ? null : metric.id)}
                        >
                            O que é isso?<span className="visually-hidden"> ({metric.label})</span>
                        </button>
                    </div>
                ))}
            </div>
            {openMetric && (
                <div id={`metric-${openMetric.id}`} className={styles.balloon} role="note">
                    <p className={styles.balloonLabel}>
                        <strong>{openMetric.label}</strong>
                    </p>
                    <p>{openMetric.explanation}</p>
                </div>
            )}
        </div>
    );
}