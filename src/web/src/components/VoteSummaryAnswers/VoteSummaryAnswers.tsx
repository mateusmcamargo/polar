import type { Sources, VoteSummary } from "@polar/db/vote-summaries";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { MapEntry } from "@/components/PageSection/MapEntry";
import { SectionIcon, type SectionIconName } from "@/components/SectionIcon/SectionIcon";
import styles from "./VoteSummaryAnswers.module.scss";

// the four questions every summary answers, see "Vote summaries" in EDITORIAL.md; each has its own icon, drawn in the question and
// in the page map
const SUMMARY_QUESTIONS: readonly { key: "result" | "life" | "benefited" | "affected"; question: string; icon: SectionIconName }[] = [
    { key: "result", question: "Que resultado isso traz?", icon: "goal" },
    { key: "life", question: "O que muda na minha vida?", icon: "life" },
    { key: "benefited", question: "Quem é beneficiado?", icon: "benefited" },
    { key: "affected", question: "Quem é afetado?", icon: "affected" },
];

const accessDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

// "Fontes: title (publisher, acessado em dd/mm/aaaa); ..."
export function AnswerSources({ sources }: Readonly<{ sources: Sources }>) {
    return (
        <span className={styles.sources}>
            Fontes:{" "}
            {sources.map((source, index) => (
                <span key={source.url}>
                    {index > 0 && "; "}
                    <a href={source.url}>{source.title}</a> ({source.publisher}, acessado em{" "}
                    {accessDateFormat.format(new Date(`${source.accessedOn}T12:00:00-03:00`))})
                </span>
            ))}
            .
        </span>
    );
}

interface VoteSummaryAnswersProps {
    summary: VoteSummary;
    // id of the page section that holds the answers: each question is an entry of the page map below it
    sectionId: string;
}

// the four questions of a reviewed summary, each with its icon and sources
export function VoteSummaryAnswers({ summary, sectionId }: Readonly<VoteSummaryAnswersProps>) {
    return (
        <dl className={styles.answers}>
            {SUMMARY_QUESTIONS.map(({ key, question, icon }) => (
                <div key={key} id={`${sectionId}-${key}`} className={styles.answer}>
                    <MapEntry id={`${sectionId}-${key}`} label={question} icon={icon} parentId={sectionId} />
                    <dt>
                        <SectionIcon name={icon} />
                        {question}
                    </dt>
                    <dd>
                        <GlossaryText text={summary[key].text} />
                        <AnswerSources sources={summary[key].sources} />
                    </dd>
                </div>
            ))}
        </dl>
    );
}