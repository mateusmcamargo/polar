import type { ReactNode } from "react";
import styles from "./Explanation.module.scss";

interface ExplanationProps {
    // read by screen readers after "O que é isso?", so each toggle names its subject
    subject: string;
    children: ReactNode;
}

// "O que é isso?" toggle that opens a speech balloon; works without JavaScript
export function Explanation({ subject, children }: Readonly<ExplanationProps>) {
    return (
        <details className={styles.explanation}>
            <summary>
                O que é isso?<span className="visually-hidden"> ({subject})</span>
            </summary>
            <div className={styles.balloon} role="note">
                {children}
            </div>
        </details>
    );
}