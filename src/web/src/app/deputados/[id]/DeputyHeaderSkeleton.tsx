import { Skeleton } from "@/components/Skeleton/Skeleton";
import styles from "./DeputyHeaderSkeleton.module.scss";

interface DeputyHeaderSkeletonProps {
    // large: the portrait of the profile; small: the thumbnail of the spending page
    photo: "large" | "small";
}

// top of the deputy pages while they load: crumb, portrait, name, tags, the intro and the actions row
export function DeputyHeaderSkeleton({ photo }: Readonly<DeputyHeaderSkeletonProps>) {
    return (
        <div className={photo === "large" ? `${styles.header} ${styles.large}` : `${styles.header} ${styles.small}`} aria-hidden="true">
            <Skeleton width="min(14em, 60%)" className={styles.crumb} />
            <div className={styles.identity}>
                <Skeleton shape="block" className={styles.photo} />
                <div className={styles.names}>
                    {photo === "small" && <Skeleton width="10em" className={styles.kicker} />}
                    <Skeleton width="min(12em, 100%)" className={styles.name} />
                    <div className={styles.tags}>
                        <Skeleton shape="block" width="48px" height="26px" />
                        <Skeleton shape="block" width="72px" height="26px" />
                    </div>
                </div>
            </div>
            <div className={styles.lines}>
                <Skeleton />
                <Skeleton width="70%" />
            </div>
            <div className={styles.actions}>
                <Skeleton shape="block" width="9em" height="44px" />
                <Skeleton shape="block" width="7em" height="44px" />
            </div>
        </div>
    );
}