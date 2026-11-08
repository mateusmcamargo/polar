import type { Sources } from "@polar/db/editorial";
import styles from "./EditorialSources.module.scss";

interface EditorialSourcesProps {
    sources: Sources;
}

// source line of an editorial statement; the access date of the whole page is shown once in its footer
// when two sources share a publisher ("Planalto; Planalto"), each one is named by its title instead
export function EditorialSources({ sources }: Readonly<EditorialSourcesProps>) {
    const publisherCounts = new Map<string, number>();
    for (const source of sources) {
        publisherCounts.set(source.publisher, (publisherCounts.get(source.publisher) ?? 0) + 1);
    }
    return (
        <p className={styles.sources}>
            {sources.length === 1 ? "Fonte: " : "Fontes: "}
            {sources.map((source, index) => (
                <span key={source.url}>
                    {index > 0 && "; "}
                    <a href={source.url} title={source.title}>
                        {(publisherCounts.get(source.publisher) ?? 0) > 1 ? source.title : source.publisher}
                    </a>
                </span>
            ))}
            .
        </p>
    );
}