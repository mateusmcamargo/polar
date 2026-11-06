import type { Case, CaseStage, RulerPage } from "@polar/db/rulers";
import { StatementText } from "@/components/EditorialTimeline/EditorialTimeline";
import styles from "./CaseList.module.scss";

type Gender = RulerPage["grammaticalGender"];

// the same verb for the same act on every page, see docs/EDITORIAL.md
const STAGE_LABELS: Readonly<Record<CaseStage, Readonly<Record<Gender, string>>>> = {
    investigation: { feminine: "Investigada", masculine: "Investigado" },
    charged: { feminine: "Denunciada", masculine: "Denunciado" },
    defendant: { feminine: "Ré", masculine: "Réu" },
    convicted: { feminine: "Condenada", masculine: "Condenado" },
    acquitted: { feminine: "Absolvida", masculine: "Absolvido" },
    closed: { feminine: "Arquivado", masculine: "Arquivado" },
    timeBarred: { feminine: "Prescrito", masculine: "Prescrito" },
    annulled: { feminine: "Anulado", masculine: "Anulado" },
};

interface CaseListProps {
    cases: readonly Case[];
    gender: Gender;
}

export function CaseList({ cases, gender }: Readonly<CaseListProps>) {
    if (cases.length === 0) {
        return <p className={styles.empty}>Nenhuma investigação formal sobre a pessoa durante o mandato.</p>;
    }
    return (
        <ul className={styles.list}>
            {cases.map((item) => {
                const current = item.steps.at(-1) ?? item.steps[0];
                return (
                    <li key={item.title} className={styles.case} data-reveal="rise">
                        <div className={styles.head}>
                            <h3 className={styles.title}>{item.title}</h3>
                            <span className={styles.stage}>
                                <span className="visually-hidden">Etapa atual: </span>
                                {STAGE_LABELS[current.stage][gender]} em {current.year}
                            </span>
                        </div>
                        <ol className={styles.steps} aria-label="Etapas do caso">
                            {item.steps.map((step) => (
                                <li key={`${step.stage}-${step.year}`} aria-current={step === current ? "step" : undefined}>
                                    {STAGE_LABELS[step.stage][gender]} ({step.year})
                                </li>
                            ))}
                        </ol>
                        {item.summary.map((statement) => (
                            <StatementText key={statement.text} statement={statement} />
                        ))}
                        {item.defense && (
                            <div className={styles.defense}>
                                <p className={styles.defenseLabel}>O que disse a defesa</p>
                                <StatementText statement={item.defense} />
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}