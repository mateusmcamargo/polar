// gross monthly salary of a federal deputy, the same for every deputy, as stated on each deputy page of the Câmara
// the camara-deputy-pages adapter fails when the page shows another value, so this file is updated by hand

export const DEPUTY_SALARY = {
    grossMonthlyValue: "46366.19",
    sourceUrl: "https://www.camara.leg.br/deputados/204534",
    collectedAt: "2026-10-28",
} as const;