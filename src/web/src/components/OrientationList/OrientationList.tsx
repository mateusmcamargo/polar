import type { VoteOrientationRow } from "@polar/db";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { VoteBadge } from "@/components/VoteBadge/VoteBadge";
import styles from "./OrientationList.module.scss";

// after the government, the leaderships that speak for the whole chamber, then the parties and blocs
const LEADERSHIP_KINDS = ["OPPOSITION", "MAJORITY", "MINORITY"];

interface OrientationListProps {
    orientations: readonly VoteOrientationRow[];
}

function OrientationRow({ orientation }: Readonly<{ orientation: VoteOrientationRow }>) {
    return (
        <li>
            <span className={styles.name}>{orientation.bancada}</span>
            <VoteBadge choice={orientation.choice} size="small" />
        </li>
    );
}

// the government first and highlighted, then opposition, majority and minority, then every party and bloc as the Câmara
// published it; blocs are not split into parties because the names come abbreviated
export function OrientationList({ orientations }: Readonly<OrientationListProps>) {
    const government = orientations.find((orientation) => orientation.kind === "GOVERNMENT");
    const leaderships = LEADERSHIP_KINDS.flatMap((kind) => orientations.filter((orientation) => orientation.kind === kind));
    const groups = orientations
        .filter((orientation) => orientation.kind === "PARTY" || orientation.kind === "BLOC")
        .sort((first, second) => first.bancada.localeCompare(second.bancada, "pt-BR"));

    if (orientations.length === 0) {
        return <p className={styles.empty}>A Câmara não publicou orientações para esta votação.</p>;
    }

    return (
        <div className={styles.orientations}>
            {government && (
                <div className={styles.government}>
                    <p className={styles.label}>Orientação do governo</p>
                    <div className={styles.governmentRow}>
                        <strong>{government.bancada}</strong>
                        <VoteBadge choice={government.choice} />
                    </div>
                </div>
            )}
            {leaderships.length > 0 && (
                <ul className={styles.list} aria-label="Lideranças da Câmara">
                    {leaderships.map((orientation) => (
                        <OrientationRow key={orientation.bancada} orientation={orientation} />
                    ))}
                </ul>
            )}
            {groups.length > 0 && (
                <>
                    <h3 className={styles.subtitle}>Partidos e blocos</h3>
                    <ul className={styles.list} aria-label="Partidos e blocos">
                        {groups.map((orientation) => (
                            <OrientationRow key={orientation.bancada} orientation={orientation} />
                        ))}
                    </ul>
                </>
            )}
            <p className={styles.note}>
                <GlossaryText text="[[bloco-parlamentar|Bloco]] é um grupo de partidos que vota junto. A Câmara publica o nome do bloco abreviado, por isso alguns terminam em reticências. Quando o líder [[liberacao-do-voto|libera o voto]], cada deputado decide sozinho." />
            </p>
        </div>
    );
}