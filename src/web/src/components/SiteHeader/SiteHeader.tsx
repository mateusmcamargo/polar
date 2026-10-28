import { Logo } from "@/components/Logo/Logo";
import { MainNav } from "@/components/MainNav/MainNav";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import styles from "./SiteHeader.module.scss";

export function SiteHeader() {
    return (
        <header className={styles.header}>
            <div className={styles.bar}>
                <Logo />
                <MainNav placement="top" />
                <ThemeToggle />
            </div>
        </header>
    );
}