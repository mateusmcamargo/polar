import { classifyVote, type VoteKind } from "@/components/RecentVotes/voteKinds";

const dayFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });
const monthYearFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", month: "2-digit", year: "numeric" });
const dayOnlyFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit" });

// the Plenário votes the changes made by the Senate as a vote on its amendments
const SENATE_CHANGES_PATTERN = /emendas? do senado/i;

export interface StageVote {
    id: string;
    occurredAt: Date;
    description: string;
    approved: boolean | null;
}

export interface Stage<Vote extends StageVote> {
    label: string;
    // "no 2º turno" and "do 2º turno", used inside a sentence
    where: string;
    partOf: string;
    // the vote that opened the stage; its result is what the stage decided. Null when no vote opens a stage
    opener: Vote | null;
    openerKind: VoteKind | null;
    firstAt: Date;
    lastAt: Date;
    // chronological
    votes: Vote[];
}

function startsStage(vote: StageVote, kind: VoteKind): boolean {
    return kind.isMainText || (kind.label === "Emenda" && SENATE_CHANGES_PATTERN.test(vote.description));
}

function describeOpener(vote: StageVote, kind: VoteKind): { label: string; where: string; partOf: string } {
    if (!kind.isMainText && SENATE_CHANGES_PATTERN.test(vote.description)) {
        return { label: "Mudanças do Senado", where: "nas mudanças do Senado", partOf: "das mudanças do Senado" };
    }
    if (kind.round) {
        return { label: `${kind.round}º turno`, where: `no ${kind.round}º turno`, partOf: `do ${kind.round}º turno` };
    }
    return { label: "Votação do texto", where: "na votação do texto", partOf: "da votação do texto" };
}

// A vote that opens a stage is the main text of a turn, the main text of a proposition without turns, or the Senate
// changes. A procedural vote joins the next stage, or the previous one when there is none; every other vote (parts of the
// text, amendments, final wording) joins the previous stage, or the next one when there is none. A proposition with no
// opening vote has a single stage. Votes come oldest first.
export function splitIntoStages<Vote extends StageVote>(votesChronological: readonly Vote[]): Stage<Vote>[] {
    const kinds = votesChronological.map((vote) => classifyVote(vote.description, vote.approved));
    const openerIndexes = kinds.flatMap((kind, index) => (startsStage(votesChronological[index]!, kind) ? [index] : []));

    const first = votesChronological[0];
    const last = votesChronological.at(-1);
    if (!first || !last) {
        return [];
    }
    if (openerIndexes.length === 0) {
        return [{ label: "Votações", where: "nas votações", partOf: "das votações", opener: null, openerKind: null, firstAt: first.occurredAt, lastAt: last.occurredAt, votes: [...votesChronological] }];
    }

    const stageVotes: Vote[][] = openerIndexes.map(() => []);
    votesChronological.forEach((vote, index) => {
        const ownPosition = openerIndexes.indexOf(index);
        let position = ownPosition;
        if (ownPosition === -1) {
            const nextPosition = openerIndexes.findIndex((openerIndex) => openerIndex > index);
            const previousPosition = openerIndexes.findLastIndex((openerIndex) => openerIndex < index);
            const preferNext = kinds[index]!.isProcedural;
            const preferred = preferNext ? nextPosition : previousPosition;
            position = preferred !== -1 ? preferred : preferNext ? previousPosition : nextPosition;
        }
        stageVotes[position]!.push(vote);
    });

    const stages = openerIndexes.map((openerIndex, position) => {
        const opener = votesChronological[openerIndex]!;
        const openerKind = kinds[openerIndex]!;
        const votes = stageVotes[position]!;
        return {
            ...describeOpener(opener, openerKind),
            opener,
            openerKind,
            firstAt: votes[0]!.occurredAt,
            lastAt: votes.at(-1)!.occurredAt,
            votes,
        };
    });

    // two stages with the same label are told apart by the date
    return stages.map((stage) =>
        stages.filter((other) => other.label === stage.label).length > 1
            ? { ...stage, label: `${stage.label}, ${dayFormat.format(stage.firstAt)}` }
            : stage,
    );
}

// "16/09/2025", "16 e 17/09/2025" in one month, or "30/09/2025 a 01/10/2025"
export function describeStageDates(stage: Pick<Stage<StageVote>, "firstAt" | "lastAt">): string {
    const firstDay = dayFormat.format(stage.firstAt);
    const lastDay = dayFormat.format(stage.lastAt);
    if (firstDay === lastDay) {
        return firstDay;
    }
    if (monthYearFormat.format(stage.firstAt) === monthYearFormat.format(stage.lastAt)) {
        return `${dayOnlyFormat.format(stage.firstAt)} e ${lastDay}`;
    }
    return `${firstDay} a ${lastDay}`;
}

// what the stage decided, in one sentence, from the result of the vote that opened it
export function describeStageDecision<Vote extends StageVote>(stage: Stage<Vote>): string {
    if (!stage.opener || !stage.openerKind) {
        return "Nenhuma destas votações decidiu o texto principal da proposta.";
    }
    const subject = stage.openerKind.isMainText
        ? `O Plenário votou o texto principal${stage.openerKind.round ? ` no ${stage.openerKind.round}º turno` : ""}`
        : "O Plenário votou as mudanças feitas pelo Senado";
    return `${subject}. Resultado: ${stage.openerKind.result}.`;
}