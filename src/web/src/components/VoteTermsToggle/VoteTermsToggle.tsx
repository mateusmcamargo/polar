import { Vote } from "lucide-react";
import styles from "./VoteTermsToggle.module.scss";

interface VoteTermsToggleProps {
    isOn: boolean;
    onToggle: () => void;
}

// shortcut of the dictionary: shows only the terms about votes, grouped by kind, and goes back to the full list when pressed again
export function VoteTermsToggle({ isOn, onToggle }: Readonly<VoteTermsToggleProps>) {
    return (
        <button type="button" className={styles.toggle} aria-pressed={isOn} onClick={onToggle}>
            <Vote aria-hidden="true" />
            Votações
        </button>
    );
}