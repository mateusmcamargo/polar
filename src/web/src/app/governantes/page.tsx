import type { Metadata } from "next";
import { GALLERY_ACCESSED_ON, GALLERY_SOURCES, RULER_GALLERY, RULER_PAGES } from "@polar/db/rulers";
import { GlossaryHint } from "@/components/GlossaryHint/GlossaryHint";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { PageMap } from "@/components/PageMap/PageMap";
import { EditorialSources } from "@/components/EditorialSources/EditorialSources";
import { PageTransition } from "@/components/PageTransition/PageTransition";
import { ROLE_DISPLAY, RulerCard } from "@/components/RulerCard/RulerCard";
import { TRAIL_ICONS } from "@/components/SnakeTrail/trailIcons";
import { ERA_ICONS } from "./eraIcons";
import styles from "./page.module.scss";

export const metadata: Metadata = {
    title: "Governantes do Brasil",
    description:
        "Reis, imperadores, regentes, presidentes e primeiros-ministros que governaram o Brasil desde 1808, com retrato, período de governo e a história de cada um, com fontes oficiais.",
    alternates: { canonical: "/governantes" },
};

const PEOPLE_COUNT = RULER_GALLERY.reduce((total, era) => total + era.people.length, 0);
const FIRST_YEAR = 1808;
const PAGE_COUNT = Object.keys(RULER_PAGES).length;

// one node of the trail per era, in the order of the page: scrolling goes back in time
const CURRENT_YEAR = new Date().getFullYear();
const ERA_SECTIONS = RULER_GALLERY.map((era) => ({
    id: `era-${era.id}`,
    label: era.name,
    years: era.years,
    icon: ERA_ICONS[era.id] ?? "flag",
    startYear: era.startYear,
    endYear: era.endYear ?? CURRENT_YEAR,
}));
const LISTEN_TEXT = `Governantes do Brasil. ${PEOPLE_COUNT} pessoas e grupos governaram o país desde ${FIRST_YEAR}, quando a corte portuguesa chegou ao Rio de Janeiro: um rei, imperadores, regentes, presidentes, juntas militares e primeiros-ministros. A lista começa pela Nova República, a partir de 1985, e vai até a chegada da corte. Toque no retrato para ver a história de cada um.`;
const ACCESSED_ON_TEXT = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date(`${GALLERY_ACCESSED_ON}T12:00:00-03:00`));
// one entry per icon, in the order a reader meets them going down the page
const LEGEND = [ROLE_DISPLAY.president, ROLE_DISPLAY.primeMinister, ROLE_DISPLAY.emperor, ROLE_DISPLAY.regent, { label: "Grupo: regência ou junta", icon: ROLE_DISPLAY.junta.icon }];

export default function RulersPage() {
    return (
        <PageTransition>
            <PageMap sections={ERA_SECTIONS} />
            <main id="conteudo" className={styles.page}>
                <section className={styles.intro} aria-labelledby="rulers-title">
                    <p className={styles.kicker}>Galeria</p>
                    <h1 id="rulers-title" className={styles.title}>
                        Governantes do Brasil
                    </h1>
                    <p className={styles.lead}>
                        <GlossaryText
                            text={`Quem governou o país desde ${FIRST_YEAR}, quando a corte portuguesa chegou ao Rio de Janeiro: rei, imperadores, [[regencia|regentes]], presidentes, [[junta-militar|juntas militares]] e primeiros-ministros. Dos mais recentes para os mais antigos. Toque no retrato para ver a história de cada um.`}
                        />
                    </p>
                    <GlossaryHint />
                    <dl className={styles.counts}>
                        <div>
                            <dt>governantes</dt>
                            <dd>{PEOPLE_COUNT}</dd>
                        </div>
                        <div>
                            <dt>{PAGE_COUNT === 1 ? "com história completa" : "com histórias completas"}</dt>
                            <dd>{PAGE_COUNT}</dd>
                        </div>
                    </dl>
                    <ul className={styles.legend} aria-label="Cargos">
                        {LEGEND.map((item) => (
                            <li key={item.label}>
                                <item.icon aria-hidden="true" />
                                {item.label}
                            </li>
                        ))}
                    </ul>
                    <ListenButton text={LISTEN_TEXT} />
                </section>

                {RULER_GALLERY.map((era) => {
                    const headingId = `era-${era.people[0]?.slug ?? era.name}`;
                    // the title carries the icon of the era in the trail, so the reader finds it again by the same mark
                    const EraIcon = TRAIL_ICONS[ERA_ICONS[era.id] ?? "flag"];
                    return (
                        <section key={era.name} id={`era-${era.id}`} className={styles.era} aria-labelledby={headingId}>
                            <header className={styles.eraHeader}>
                                <h2 id={headingId} className={styles.eraName}>
                                    <EraIcon aria-hidden="true" />
                                    {era.name}
                                </h2>
                                <span className={styles.eraYears}>{era.years}</span>
                            </header>
                            <ol className={styles.wall}>
                                {era.people.map((entry) => (
                                    <li key={entry.slug} data-reveal="rise">
                                        <RulerCard entry={entry} hasPage={entry.slug in RULER_PAGES} />
                                    </li>
                                ))}
                            </ol>
                        </section>
                    );
                })}

                <footer className={styles.footer}>
                    <EditorialSources sources={GALLERY_SOURCES} />
                    <p className={styles.note}>Consultado em {ACCESSED_ON_TEXT}.</p>
                    <p className={styles.note}>
                        Retratos: Wikimedia Commons. Os da República, que inclui a <GlossaryText text="[[nova-republica|Nova República]]" />, são, na maioria, fotos oficiais da Presidência; os do Império e da corte são
                        pinturas e fotos antigas em domínio público. O autor e a licença de cada retrato estão na página da pessoa. Juntas militares e
                        regências de três pessoas aparecem porque governaram o país no lugar de um presidente ou de um imperador. De 1961 a 1963 o
                        país teve presidente e primeiro-ministro ao mesmo tempo, por isso os dois aparecem.
                    </p>
                </footer>
            </main>
        </PageTransition>
    );
}