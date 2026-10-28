import styles from "./SourceNote.module.scss";

interface SourceNoteProps {
    sourceName: string;
    sourceUrl: string;
    collectedAt: Date | null;
}

const collectionDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

export function SourceNote({ sourceName, sourceUrl, collectedAt }: Readonly<SourceNoteProps>) {
    return (
        <p className={styles.note}>
            Fonte: <a href={sourceUrl}>{sourceName}</a>.
            {collectedAt && <> Coletado em {collectionDateFormat.format(collectedAt)}.</>}
        </p>
    );
}