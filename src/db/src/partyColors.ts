// official color of each party, keyed by the acronym published by the Câmara, see "Party colors" in DESIGN.md
// taken from the logo or the stylesheet of the official party website; parties missing here use the neutral badge
// PV: the website blocks automated access, the color was provided by the maintainer on 2026-10-28

export interface PartyColor {
    color: string;
    sourceUrl: string;
}

export const PARTY_COLORS_COLLECTED_AT = "2026-10-28";

export const PARTY_COLORS: Readonly<Record<string, PartyColor>> = {
    AVANTE: { color: "#D27901", sourceUrl: "https://avante70.org.br/wp-content/uploads/2023/07/avante-70-logo-principal-short.png" },
    CIDADANIA: { color: "#EC008C", sourceUrl: "https://rede23.org/wp-content/uploads/2025/12/logo-rede23.webp" },
    MDB: { color: "#386513", sourceUrl: "https://www.mdb.org.br/wp-content/uploads/2024/03/logo-mdb-1.png" },
    "MISSÃO": { color: "#FBBF2B", sourceUrl: "https://missao.org.br/" },
    NOVO: { color: "#FF6401", sourceUrl: "https://novo.org.br/wp-content/uploads/2024/03/logo-300x66.webp" },
    PCdoB: { color: "#EE1B22", sourceUrl: "https://pcdob.org.br/wp-content/uploads/2022/08/logo-pcdob-partido-comunista-do-brasil.jpg" },
    PDT: { color: "#0064AF", sourceUrl: "https://pdt.org.br/wp-content/uploads/2026/04/nova_logo_PDT.png" },
    PL: { color: "#005AAB", sourceUrl: "https://partidoliberal.org.br/wp-content/uploads/2023/04/cropped-logo_pl-192x192.png" },
    PODE: { color: "#602D91", sourceUrl: "https://podemos.org.br/" },
    PP: { color: "#49B6E6", sourceUrl: "https://progressistas.org.br/website2020/wp-content/uploads/2020/12/logo-progressistas-novo-slogan-02.png" },
    PRD: { color: "#1B3F7B", sourceUrl: "https://25prd.org.br/wp-content/uploads/2024/05/LOGO-PRD-Color.svg" },
    PSB: { color: "#ED3237", sourceUrl: "https://psb40.org.br/wp-content/uploads/2023/03/logo_psb-2.png" },
    PSD: { color: "#023F8C", sourceUrl: "https://psd.org.br/wp-content/uploads/2024/06/logotipo-partido-social-democratico-512x512-1-300x300.png" },
    PSDB: { color: "#004997", sourceUrl: "https://www.psdb.org.br/" },
    PSOL: { color: "#FFC200", sourceUrl: "https://psol50.org.br/" },
    PT: { color: "#E4172D", sourceUrl: "https://pt.org.br/wp-content/uploads/2024/06/logo-partido-dos-trabalhadores.png" },
    PV: { color: "#237E36", sourceUrl: "https://pv.org.br/" },
    REDE: { color: "#2DB0BE", sourceUrl: "https://redesustentabilidade.org.br/wp-content/uploads/2020/04/Ativo-1Header-SVG-Logo.svg" },
    REPUBLICANOS: { color: "#005DAC", sourceUrl: "https://republicanos10.org.br/img/logo-claro.webp" },
    SOLIDARIEDADE: { color: "#F37021", sourceUrl: "https://solidariedade.org.br/media/2024/02/logo.png" },
    "UNIÃO": { color: "#01A4E7", sourceUrl: "https://uniaobrasil.org.br/wp-content/uploads/2024/08/logo-rodape.png" },
};