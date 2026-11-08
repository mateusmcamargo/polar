const dayFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

export interface StatusDescription {
    // plain language, can carry glossary markers
    headline: string;
    detail: string | null;
    // the official text and date, shown next to the plain text: "Situação oficial: Arquivada, em 17/09/2025"
    official: string;
    // the proposition became a norm: the page adds the notice that some rules start later
    isNorm: boolean;
    // badge of the list, null when the status does not deserve one
    shortLabel: string | null;
}

const NORM_SITUATION = "Transformado em Norma Jurídica";
// "Transformado na Emenda Constitucional 136/2025. DOU 10/09/2025 PÁG 05 COL 02."
const NORM_DISPATCH_PATTERN = /^Transformad[oa] (?:na|no) (.+?)\. (DOU|DCD) (\d{2}\/\d{2}\/\d{4})/;

interface StatusRow {
    headline: string;
    detail: string | null;
    shortLabel: string | null;
}

// only the statuses with a reviewed text are translated; any other value is shown as the Câmara published it
const STATUS_ROWS: Readonly<Record<string, StatusRow>> = {
    "Aguardando Sanção": {
        headline: "O Congresso aprovou. Falta a sanção do presidente",
        detail: "O presidente pode sancionar ou vetar.",
        shortLabel: null,
    },
    "Aguardando Apreciação do Veto": {
        headline: "Foi vetada. O Congresso ainda vai analisar o veto",
        detail: "Se o Congresso derrubar o veto, a parte vetada volta ao texto.",
        shortLabel: "Vetada",
    },
    "Aguardando Promulgação": {
        headline: "Espera a promulgação",
        detail: "Depois da promulgação, o texto vai para o [[diario-oficial-da-uniao|Diário Oficial]].",
        shortLabel: null,
    },
    Arquivada: { headline: "Arquivada", detail: null, shortLabel: "Arquivada" },
    "Aguardando Apreciação pelo Senado Federal": {
        headline: "Está no Senado",
        detail: "A Câmara terminou a votação e a proposta foi enviada.",
        shortLabel: "No Senado",
    },
};

function describeNorm(dispatch: string | null): { headline: string; detail: string | null } {
    const match = dispatch ? NORM_DISPATCH_PATTERN.exec(dispatch) : null;
    if (!match) {
        return { headline: "Virou norma jurídica", detail: null };
    }
    const [, name, publisher, date] = match;
    const published =
        publisher === "DOU" ? `, publicada no [[diario-oficial-da-uniao|Diário Oficial]] em ${date}` : `, publicada em ${date}`;
    return { headline: `Virou a ${name}${published}`, detail: null };
}

// What the Câmara says about the proposition today, with the plain text next to the official one. The outcome in the
// Senate is never inferred: the official status and its date are shown as published. Null when no status was collected.
export function describeStatus(situation: string | null, situationAt: Date | null, dispatch: string | null): StatusDescription | null {
    if (!situation) {
        return null;
    }
    const official = `Situação oficial: ${situation}${situationAt ? `, em ${dayFormat.format(situationAt)}` : ""}`;

    if (situation === NORM_SITUATION) {
        return {
            ...describeNorm(dispatch),
            detail: "Algumas regras só começam a valer depois. O texto da norma diz quando.",
            official,
            isNorm: true,
            shortLabel: "Virou lei",
        };
    }
    const row = STATUS_ROWS[situation];
    if (row) {
        return { ...row, official, isNorm: false };
    }
    return { headline: situation, detail: null, official, isNorm: false, shortLabel: null };
}