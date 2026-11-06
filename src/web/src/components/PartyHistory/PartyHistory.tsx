import type { DeputyPartyPeriod } from "@polar/db";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { SkeletonRows } from "@/components/Skeleton/Skeleton";
import styles from "./PartyHistory.module.scss";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

interface PartyHistoryProps {
    periods: DeputyPartyPeriod[];
}

// newest first; the current party has a filled marker
export function PartyHistory({ periods }: Readonly<PartyHistoryProps>) {
    return (
        <ol className={styles.timeline}>
            {periods.map((period) => (
                <li key={period.startsAt.toISOString()} className={period.endsAt ? undefined : styles.current} data-reveal="rise">
                    <span className={styles.pin} aria-hidden="true" />
                    <div>
                        <p className={styles.when}>
                            {period.endsAt
                                ? `${dateFormat.format(period.startsAt)} a ${dateFormat.format(period.endsAt)}`
                                : `Desde ${dateFormat.format(period.startsAt)}`}
                        </p>
                        <p className={styles.what}>
                            {period.party ? (
                                <>
                                    <PartyBadge acronym={period.party.acronym} /> {period.party.name}
                                </>
                            ) : (
                                "Partido que não existe mais (extinto ou unido a outro)"
                            )}
                        </p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

// party timeline while it loads: a pin, the party and the period
export function PartyHistorySkeleton() {
    return <SkeletonRows count={2} leading="pin" hasMeta hasDividers={false} />;
}