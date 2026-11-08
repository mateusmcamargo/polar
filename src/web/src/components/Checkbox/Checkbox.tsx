import type { ReactNode } from "react";
import { Check } from "lucide-react";
import styles from "./Checkbox.module.scss";

interface CheckboxProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: ReactNode;
}

// a checkbox in the style of the site: a square box with an ink edge, a check mark when on, and a label that is part of the
// target (44 px high). The real input stays in the page, hidden but focusable, so keyboard and screen readers work as in any
// checkbox; the box is its drawing
export function Checkbox({ id, checked, onChange, children }: Readonly<CheckboxProps>) {
    return (
        <label className={styles.checkbox} htmlFor={id}>
            <input id={id} className={styles.input} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            <span className={styles.box} aria-hidden="true">
                <Check />
            </span>
            <span className={styles.text}>{children}</span>
        </label>
    );
}