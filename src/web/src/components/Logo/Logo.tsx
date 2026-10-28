import Link from "next/link";
import styles from "./Logo.module.scss";

export function Logo() {
    return (
        <Link href="/" className={styles.logo} aria-label="polar, página inicial">
            <svg className={styles.mark} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="15" r="7" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="12" cy="3.5" r="2.5" fill="currentColor" />
            </svg>
            <span className={styles.wordmark}>polar</span>
        </Link>
    );
}