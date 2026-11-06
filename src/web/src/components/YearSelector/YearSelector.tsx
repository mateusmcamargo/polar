import Link from "next/link";
import { LinkPending } from "@/components/LinkPending/LinkPending";
import { NAV_BACK, NAV_FORWARD } from "@/components/PageTransition/PageTransition";
import styles from "./YearSelector.module.scss";

interface YearSelectorProps {
    // the newest year lives at the base path, for example /deputados/{id} or /deputados/{id}/gastos
    basePath: string;
    years: number[];
    selectedYear: number;
}

// older years live at {basePath}/{ano}
export function YearSelector({ basePath, years, selectedYear }: Readonly<YearSelectorProps>) {
    return (
        <div className={styles.selector}>
            <span id="year-label">Ano:</span>
            <nav className={styles.years} aria-labelledby="year-label">
                {years.map((year, index) => (
                    <Link
                        key={year}
                        href={index === 0 ? basePath : `${basePath}/${year}`}
                        aria-current={year === selectedYear ? "page" : undefined}
                        scroll={false}
                        // a newer year moves forward, an older one back
                        transitionTypes={year > selectedYear ? NAV_FORWARD : NAV_BACK}
                    >
                        {year}
                        <LinkPending />
                    </Link>
                ))}
            </nav>
        </div>
    );
}