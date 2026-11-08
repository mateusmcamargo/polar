// names of the proposition types published by the Câmara, shown as the explanation of each acronym
export const PROPOSITION_TYPE_NAMES: Readonly<Record<string, string>> = {
    INC: "Indicação",
    MPV: "Medida Provisória",
    MSC: "Mensagem",
    OBJ: "Objeto de deliberação",
    PDC: "Projeto de Decreto Legislativo",
    PDL: "Projeto de Decreto Legislativo",
    PEC: "Proposta de Emenda à Constituição",
    PFC: "Proposta de Fiscalização e Controle",
    PL: "Projeto de Lei",
    PLP: "Projeto de Lei Complementar",
    PLV: "Projeto de Lei de Conversão",
    PRC: "Projeto de Resolução da Câmara",
    PRO: "Proposta",
    REC: "Recurso",
    REL: "Relatório",
    REP: "Representação",
    REQ: "Requerimento",
    RIC: "Requerimento de Informação",
    SAP: "Solicitação",
    SOR: "Sessão",
    SUG: "Sugestão",
    TVR: "Ato de concessão de rádio e TV",
};

// page of the proposition on the site of the Câmara; the sourceUrl in the database is the JSON of the open data API
export function propositionPageUrl(propositionId: number): string {
    return `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${propositionId}`;
}