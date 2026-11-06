import type { DeputyOrganRow } from "@polar/db";
import { ScrollSlider } from "@/components/ScrollSlider/ScrollSlider";
import { shortOrganName } from "./shortOrganName";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import styles from "./OrganList.module.scss";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });
const MEMBER_ROLES = new Set(["Titular", "Suplente"]);
const SCROLL_HINT_MIN_ROWS = 8;

function rolePriority(row: DeputyOrganRow): number {
    if (row.roles.some((role) => !MEMBER_ROLES.has(role))) {
        return 0;
    }
    return row.roles.includes("Titular") ? 1 : 2;
}

// leadership roles first, then the member roles
function sortRoles(roles: string[]): string[] {
    return [...roles].sort((first, second) => Number(MEMBER_ROLES.has(first)) - Number(MEMBER_ROLES.has(second)));
}

function OrganRows({ rows, isPast }: Readonly<{ rows: DeputyOrganRow[]; isPast: boolean }>) {
    return (
        <ul className={styles.rows}>
            {rows.map((row) => {
                const organName = shortOrganName(row.name);
                return (
                    <li key={row.organId} data-reveal="rise">
                        <span className={styles.name}>{organName.name}</span>
                        <span className={styles.roles}>
                            {sortRoles(row.roles).map((role) => (
                                <span key={role} className={`${styles.role} ${MEMBER_ROLES.has(role) ? "" : styles.lead}`}>
                                    {role}
                                </span>
                            ))}
                        </span>
                        {organName.subject && <span className={styles.subject}>{organName.subject}</span>}
                        <span className={styles.period}>
                            {isPast && row.endsAt
                                ? `De ${dateFormat.format(row.startsAt)} a ${dateFormat.format(row.endsAt)}`
                                : `Desde ${dateFormat.format(row.startsAt)}`}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

interface OrganListProps {
    currentOrgans: DeputyOrganRow[];
    pastOrgans: DeputyOrganRow[];
}

export function OrganList({ currentOrgans, pastOrgans }: Readonly<OrganListProps>) {
    const currentRows = [...currentOrgans].sort((first, second) => rolePriority(first) - rolePriority(second));
    const currentIds = new Set(currentOrgans.map((row) => row.organId));
    // an organ the deputy is still in does not repeat among the past ones
    const pastRows = pastOrgans
        .filter((row) => !currentIds.has(row.organId))
        .sort((first, second) => (second.endsAt?.getTime() ?? 0) - (first.endsAt?.getTime() ?? 0));

    return (
        <div className={styles.organs}>
            {currentRows.length > 0 ? (
                <OrganRows rows={currentRows} isPast={false} />
            ) : (
                <p className={styles.empty}>Não participa de nenhuma comissão agora.</p>
            )}
            {pastRows.length > 0 && (
                <details className={styles.past}>
                    <summary>Comissões anteriores ({pastRows.length})</summary>
                    {pastRows.length >= SCROLL_HINT_MIN_ROWS && <p className={styles.hint}>Role a lista para ver todos os nomes.</p>}
                    <ScrollSlider direction="vertical" className={styles.scroll} tabIndex={0} role="region" aria-label="Comissões anteriores">
                        <OrganRows rows={pastRows} isPast />
                    </ScrollSlider>
                </details>
            )}
        </div>
    );
}

// committees while they load: a name with its subject and the role at the right
export function OrganListSkeleton() {
    return <SkeletonRows count={4} hasMeta hasValue />;
}