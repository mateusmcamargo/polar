import Link from "next/link";
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
                    >
                        {year}
                    </Link>
                ))}
            </nav>
        </div>
    );
}