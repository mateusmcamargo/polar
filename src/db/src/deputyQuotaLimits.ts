// monthly CEAP limit per deputy by state, from the "Anexo Único" of Ato da Mesa n. 43/2009
// each table applies from the first month listed; this file is updated by hand when the Mesa changes the values

export interface QuotaLimitTable {
    // first month (yyyy-mm) in which the table applies
    startsAt: string;
    actName: string;
    sourceUrl: string;
    collectedAt: string;
    monthlyLimitByState: Readonly<Record<string, string>>;
}

// newest first
export const QUOTA_LIMIT_TABLES: readonly QuotaLimitTable[] = [
    {
        // Ato da Mesa n. 244 was published on 2026-02-20 and applies to the quota of February
        startsAt: "2026-02",
        actName: "Ato da Mesa n. 244/2026",
        sourceUrl: "https://www2.camara.leg.br/comunicacao/assessoria-de-imprensa/guia-para-jornalistas/cota-parlamentar",
        collectedAt: "2026-10-31",
        monthlyLimitByState: {
            AC: "57359.87",
            AL: "53164.36",
            AM: "56151.46",
            AP: "55929.26",
            BA: "50965.29",
            CE: "54879.34",
            DF: "41612.55",
            ES: "49160.15",
            GO: "46979.73",
            MA: "54537.99",
            MG: "47645.91",
            MS: "52707.93",
            MT: "51439.83",
            PA: "54624.17",
            PB: "54402.48",
            PE: "53997.81",
            PI: "53195.84",
            PR: "50807.19",
            RJ: "47267.41",
            RN: "55198.09",
            RO: "56267.90",
            RR: "58474.70",
            RS: "53086.78",
            SC: "51951.42",
            SE: "52248.86",
            SP: "48727.46",
            TO: "51525.80",
        },
    },
    {
        startsAt: "2023-02",
        actName: "Ato da Mesa n. 270/2023",
        sourceUrl: "https://www2.camara.leg.br/legin/int/atomes/2009/atodamesa-43-21-maio-2009-588364-normaatualizada-cd-mesa.html",
        collectedAt: "2026-10-31",
        monthlyLimitByState: {
            AC: "50426.26",
            AL: "46737.90",
            AM: "49363.92",
            AP: "49168.58",
            BA: "44804.65",
            CE: "48245.57",
            DF: "36582.46",
            ES: "43217.71",
            GO: "41300.86",
            MA: "47945.49",
            MG: "41886.51",
            MS: "46336.64",
            MT: "45221.83",
            PA: "48021.25",
            PB: "47826.36",
            PE: "47470.60",
            PI: "46765.57",
            PR: "44665.66",
            RJ: "41553.77",
            RN: "48525.79",
            RO: "49466.29",
            RR: "51406.33",
            RS: "46669.70",
            SC: "45671.58",
            SE: "45933.06",
            SP: "42837.33",
            TO: "45297.41",
        },
    },
];

// the table in force in a month, or undefined before the oldest table
export function quotaLimitTableFor(year: number, month: number): QuotaLimitTable | undefined {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    return QUOTA_LIMIT_TABLES.find((table) => table.startsAt <= key);
}