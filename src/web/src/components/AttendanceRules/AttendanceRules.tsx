import type { CommitteeAbsenceBreakdown } from "@polar/db";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import styles from "./AttendanceRules.module.scss";

const CHAMBER_RULES_URL =
    "https://www2.camara.leg.br/legin/fed/rescad/1989/resolucaodacamaradosdeputados-17-21-setembro-1989-320110-normaatualizada-pl.html";
const PAY_RULES_URL = "https://www2.camara.leg.br/legin/int/atomes/2010/atodamesa-66-14-julho-2010-607368-norma-cd-mesa.html";
const CONSTITUTION_URL = "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm";
// the day the rules below were read, see "Attendance rules" in DATA_SOURCES.md
const RULES_READ_ON = new Date("2026-11-10T12:00:00-03:00");
const dateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

interface Rule {
    question: string;
    plenary: { text: string; law?: string };
    committees: { text: string; law?: string };
}

const RULES: readonly Rule[] = [
    {
        question: "Falta sem justificativa tira dinheiro do salário?",
        plenary: { text: "Sim. Cada dia de falta tira 1/30 da parte variável do salário.", law: "Ato da Mesa 66/2010, art. 4º" },
        committees: { text: "Não. As regras de desconto falam só do plenário.", law: "Ato da Mesa 66/2010" },
    },
    {
        question: "Muitas faltas podem tirar o deputado do lugar?",
        plenary: { text: "Sim, do mandato: faltar a 1/3 das sessões do ano.", law: "Constituição, art. 55" },
        committees: { text: "Sim, da comissão: faltar a 5 reuniões seguidas ou a 1/4 das reuniões do ano.", law: "Regimento Interno, art. 45" },
    },
    {
        question: "O que entra na conta?",
        plenary: { text: "Os dias com sessão de votação." },
        committees: {
            text: "Toda reunião das comissões em que o deputado é titular, inclusive as audiências públicas. Como suplente, só as presenças entram, nunca as faltas.",
        },
    },
];

function percent(part: number, whole: number): string {
    return `${(part / whole) * 100}%`;
}

function faltas(count: number): string {
    return `${count} ${count === 1 ? "falta" : "faltas"}`;
}

interface AttendanceRulesProps {
    year: number;
    deputyName: string;
    breakdown: CommitteeAbsenceBreakdown | null;
}

// how the Câmara counts attendance, and where the unjustified committee absences of the year fell
export function AttendanceRules({ year, deputyName, breakdown }: Readonly<AttendanceRulesProps>) {
    const kinds = breakdown
        ? [
              { key: "hearings", label: "Audiências públicas", count: breakdown.hearings, className: styles.hearing },
              { key: "voting", label: "Reuniões com votação", count: breakdown.votingMeetings, className: styles.voting },
              { key: "other", label: "Outras reuniões", count: breakdown.otherMeetings, className: styles.other },
          ].filter((kind) => kind.count > 0)
        : [];

    return (
        <div className={styles.rules}>
            <h3 className={styles.title}>Como a Câmara conta a presença</h3>

            <div className={styles.ruleList}>
                {RULES.map((rule) => (
                    <section key={rule.question} className={styles.rule}>
                        <h4 className={styles.question}>{rule.question}</h4>
                        <dl className={styles.answers}>
                            {(["plenary", "committees"] as const).map((place) => (
                                <div key={place}>
                                    <dt>{place === "plenary" ? "Plenário" : "Comissões"}</dt>
                                    <dd>
                                        {rule[place].text}
                                        {rule[place].law && <span className={styles.law}>{rule[place].law}</span>}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
            </div>
            <p className={styles.note}>
                Regras:{" "}
                <a href={CHAMBER_RULES_URL}>Regimento Interno da Câmara</a>, <a href={PAY_RULES_URL}>Ato da Mesa 66/2010</a> e{" "}
                <a href={CONSTITUTION_URL}>Constituição Federal</a>. Consultados em {dateFormat.format(RULES_READ_ON)}.
            </p>

            {breakdown && (
                <>
                    <div className={styles.panel}>
                        <h4 className={styles.panelTitle}>
                            Onde foram as {faltas(breakdown.unjustified)} sem justificativa em {year}
                        </h4>
                        <div
                            className={styles.bar}
                            data-reveal="fill"
                            role="img"
                            aria-label={kinds.map((kind) => `${kind.label}: ${faltas(kind.count)}`).join(", ")}
                        >
                            {kinds.map((kind) => (
                                <i key={kind.key} className={kind.className} style={{ width: percent(kind.count, breakdown.unjustified) }} />
                            ))}
                        </div>
                        <dl className={styles.rows}>
                            {kinds.map((kind) => (
                                <div key={kind.key}>
                                    <dt>
                                        <span className={`${styles.key} ${kind.className}`} aria-hidden="true" />
                                        {kind.label}
                                    </dt>
                                    <dd>{faltas(kind.count)}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className={styles.text}>
                            Audiência pública é uma reunião para ouvir convidados sobre um tema. Ela pode começar com qualquer número de
                            deputados, porque não tem votação de projeto (Regimento Interno, art. 50). Na reunião com votação, metade dos membros
                            precisa estar presente.
                        </p>
                    </div>

                    <div className={styles.panel}>
                        <h4 className={styles.panelTitle}>Faltas que coincidiram com outro compromisso</h4>
                        <div className={styles.figures}>
                            <p>
                                <strong>
                                    {breakdown.notClashing} <small>de {breakdown.unjustified}</small>
                                </strong>
                                <span>
                                    <b>sem nenhum outro compromisso registrado no mesmo horário.</b> A Câmara não registrou presença de {deputyName} em
                                    outra reunião nem no plenário enquanto essas reuniões aconteciam.
                                </span>
                            </p>
                            <p>
                                <strong>
                                    {breakdown.clashing} <small>de {breakdown.unjustified}</small>
                                </strong>
                                <span>
                                    no mesmo horário de outra reunião de comissão ou de uma sessão do plenário em que a Câmara registrou a presença de{" "}
                                    {deputyName}.
                                </span>
                            </p>
                        </div>
                        {breakdown.unchecked > 0 && (
                            <p className={styles.text}>
                                {breakdown.unchecked === 1
                                    ? "1 falta não pôde ser conferida, porque a reunião não está nos dados abertos da Câmara."
                                    : `${breakdown.unchecked} faltas não puderam ser conferidas, porque as reuniões não estão nos dados abertos da Câmara.`}
                            </p>
                        )}
                        <p className={styles.calc}>
                            As comissões se reúnem de terça a quinta, a partir das 9h (Regimento Interno, art. 46), e um deputado costuma fazer parte
                            de duas a quatro. Cálculo do polar: compara o horário de cada falta com o horário de início e de fim das outras reuniões e
                            sessões com presença registrada. Quando a Câmara não publica o horário de fim, conta o mesmo dia. Compromissos fora da
                            Câmara ou sem registro de presença não aparecem nesses dados.
                        </p>
                    </div>

                    <SourceNote
                        sourceName={`Câmara dos Deputados, presença em comissões (${year})`}
                        sourceUrl={breakdown.sourceUrl}
                        collectedAt={breakdown.collectedAt}
                    />
                    <SourceNote
                        sourceName="Câmara dos Deputados, eventos e presenças (dados abertos)"
                        sourceUrl="https://dadosabertos.camara.leg.br/"
                        collectedAt={breakdown.eventsCollectedAt}
                    />
                </>
            )}
        </div>
    );
}