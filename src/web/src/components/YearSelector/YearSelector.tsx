import Link from "next/link";
import styles from "./YearSelector.module.scss";

interface YearSelectorProps {
    deputyId: number;
    years: number[];
    selectedYear: number;
}

// the newest year lives at /deputados/{id}, older ones at /deputados/{id}/{ano}
export function YearSelector({ deputyId, years, selectedYear }: Readonly<YearSelectorProps>) {
    return (
        <div className={styles.selector}>
            <span id="year-label">Ano:</span>
            <nav className={styles.years} aria-labelledby="year-label">
                {years.map((year, index) => (
                    <Link
                        key={year}
                        href={index === 0 ? `/deputados/${deputyId}` : `/deputados/${deputyId}/${year}`}
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