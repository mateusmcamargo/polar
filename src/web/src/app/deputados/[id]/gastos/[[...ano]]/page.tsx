import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { DeputyProfile, DeputySpending } from "@polar/db";
import { DEPUTY_SALARY } from "@polar/db/deputy-salary";
import { BRAZILIAN_STATES, inState, ofState } from "@/components/DeputySearch/brazilianStates";
import { Explanation } from "@/components/Explanation/Explanation";
import { ListenButton } from "@/components/ListenButton/ListenButton";
import { BenefitList, QuotaSummary } from "@/components/MoneySummary/MoneySummary";
import { EXPENSE_TYPE_LABELS } from "@/components/MoneySummary/expenseTypeLabels";
import { PartyBadge } from "@/components/PartyBadge/PartyBadge";
import { QuotaLimit } from "@/components/QuotaLimit/QuotaLimit";
import { ReceiptList } from "@/components/ReceiptList/ReceiptList";
import { RECEIPTS_SECTION_ID } from "@/components/ReceiptList/receiptFilters";
import { SourceNote } from "@/components/SourceNote/SourceNote";
import { CategoryList, MonthlyTotals } from "@/components/SpendingBreakdown/SpendingBreakdown";
import { SupplierList } from "@/components/SupplierList/SupplierList";
import { YearSelector } from "@/components/YearSelector/YearSelector";
import { loadDeputySpending, loadDeputyYear, resolveProfileYear, type ResolvedProfile } from "../../deputyProfileData";
import styles from "./page.module.scss";

// every ingestion runs at most once a day, and runs mark the pages stale through /api/revalidate
export const revalidate = 86400;

// rendered on the first visit and then kept, like the profile, see ARCHITECTURE.md
export function generateStaticParams(): { id: string; ano?: string[] }[] {
    return [];
}

const QUOTA_URL = "https://www.camara.leg.br/transparencia/gastos-parlamentares";

interface SpendingPageProps {
    params: Promise<{ id: string; ano?: string[] }>;
}

async function resolveSpendingPage(params: SpendingPageProps["params"]): Promise<ResolvedProfile | null> {
    const { id, ano } = await params;
    return resolveProfileYear(id, ano);
}

function spendingPath(profile: DeputyProfile, year: number | null): string {
    return year && year !== profile.years[0] ? `/deputados/${profile.id}/gastos/${year}` : `/deputados/${profile.id}/gastos`;
}

function profilePath(profile: DeputyProfile, year: number | null): string {
    return year && year !== profile.years[0] ? `/deputados/${profile.id}/${year}` : `/deputados/${profile.id}`;
}

// the limit tables hold the collection day as yyyy-mm-dd
function collectionDate(day: string): Date {
    return new Date(`${day}T12:00:00-03:00`);
}

function listenText(profile: DeputyProfile, year: number | null, spending: DeputySpending | null): string {
    if (!year || !spending) {
        return `${profile.politicalName}. Nenhum gasto da cota parlamentar registrado.`;
    }
    const parts = [
        `${profile.politicalName}. Em ${year}, gastou ${Math.round(spending.quota.total / 1000)} mil reais da cota parlamentar.`,
        `A média dos deputados ${ofState(profile.stateCode)} foi ${Math.round(spending.quota.stateAverage / 1000)} mil reais.`,
    ];
    if (spending.limit && spending.limit.total > 0) {
        parts.push(`Isso é ${Math.round((spending.quota.total / spending.limit.total) * 100)}% do limite.`);
    }
    const largest = spending.categories[0];
    if (largest) {
        parts.push(
            `O maior gasto foi com ${(EXPENSE_TYPE_LABELS[largest.expenseTypeCode] ?? largest.description).toLowerCase()}: ${Math.round(largest.total / 1000)} mil reais.`,
        );
    }
    return parts.join(" ");
}

export async function generateMetadata({ params }: SpendingPageProps): Promise<Metadata> {
    const resolved = await resolveSpendingPage(params);
    if (!resolved) {
        return { title: "Página não encontrada" };
    }
    const { profile, year } = resolved;
    const party = profile.party ? `${profile.party.acronym}, ` : "";
    return {
        title: `Gastos de ${profile.politicalName}${year && year !== profile.years[0] ? ` em ${year}` : ""}`,
        description: `Pra onde foi o dinheiro: cota parlamentar e benefícios de ${profile.politicalName} (${party}${profile.stateCode}), com cada nota publicada pela Câmara dos Deputados.`,
        alternates: { canonical: spendingPath(profile, year) },
    };
}

export default async function DeputySpendingPage({ params }: SpendingPageProps) {
    const resolved = await resolveSpendingPage(params);
    if (!resolved) {
        notFound();
    }
    const { profile, year } = resolved;
    const [spending, yearData] = year
        ? await Promise.all([loadDeputySpending(profile.id, profile.stateCode, year), loadDeputyYear(profile.id, profile.stateCode, year)])
        : [null, null];
    const annualPage = yearData?.annualPage ?? null;
    const receiptCategories = (spending?.categories ?? [])
        .map((category) => ({
            expenseTypeCode: category.expenseTypeCode,
            label: EXPENSE_TYPE_LABELS[category.expenseTypeCode] ?? category.description,
        }))
        .sort((first, second) => first.label.localeCompare(second.label, "pt-BR"));

    return (
        <main id="conteudo" className={styles.page}>
            <nav className={styles.crumb} aria-label="Você está em">
                <Link href="/deputados">Deputados</Link> <span aria-hidden="true">›</span>{" "}
                <Link href={profilePath(profile, year)}>{profile.politicalName}</Link> <span aria-hidden="true">›</span> Gastos
            </nav>

            <section className={styles.intro} aria-labelledby="spending-title">
                <div className={styles.identity}>
                    {profile.photoUrl ? (
                        <Image className={styles.photo} src={profile.photoUrl} alt="" width={64} height={80} priority />
                    ) : (
                        <span className={styles.photo} aria-hidden="true" />
                    )}
                    <div className={styles.names}>
                        <p className={styles.kicker}>Pra onde foi o dinheiro?</p>
                        <h1 id="spending-title" className={styles.name}>
                            Gastos de {profile.politicalName}
                        </h1>
                        <div className={styles.tags}>
                            <PartyBadge acronym={profile.party?.acronym ?? null} />
                            <span className={styles.tag}>{BRAZILIAN_STATES[profile.stateCode]?.name ?? profile.stateCode}</span>
                        </div>
                    </div>
                </div>
                <p className={styles.lead}>
                    Como o dinheiro público foi usado no mandato: a cota parlamentar, com cada nota apresentada à Câmara, e os
                    benefícios do cargo.
                </p>
                <div className={styles.actions}>
                    {year && profile.years.length > 1 && (
                        <YearSelector basePath={`/deputados/${profile.id}/gastos`} years={profile.years} selectedYear={year} />
                    )}
                    <ListenButton text={listenText(profile, year, spending)} />
                </div>
            </section>

            {spending && year ? (
                <>
                    <section className={styles.block} aria-labelledby="summary-title">
                        <h2 id="summary-title" className={styles.blockLabel}>
                            Cota parlamentar em {year}
                        </h2>
                        <p className={styles.text}>
                            A cota parlamentar paga despesas do mandato, como combustível, passagens e divulgação. As médias consideram
                            todos os deputados com algum gasto no ano, inclusive suplentes que ficaram poucos meses no cargo.
                        </p>
                        <QuotaSummary
                            deputyName={profile.politicalName}
                            statePhrase={ofState(profile.stateCode)}
                            quota={spending.quota}
                            showsTopCategories={false}
                        />
                        {spending.limit && (
                            <QuotaLimit total={spending.quota.total} limit={spending.limit} inStatePhrase={inState(profile.stateCode)} />
                        )}
                        <SourceNote
                            sourceName="Câmara dos Deputados, cota parlamentar (CEAP)"
                            sourceUrl={QUOTA_URL}
                            collectedAt={spending.quota.collectedAt}
                        />
                        {spending.limit?.acts.map((act) => (
                            <SourceNote
                                key={act.actName}
                                sourceName={`Limite da cota: Câmara dos Deputados, ${act.actName}`}
                                sourceUrl={act.sourceUrl}
                                collectedAt={collectionDate(act.collectedAt)}
                            />
                        ))}
                    </section>

                    <section className={styles.block} aria-labelledby="categories-title">
                        <h2 id="categories-title" className={styles.title}>
                            Em que gastou
                        </h2>
                        <p className={styles.text}>Cada tipo de gasto, do maior para o menor, com a parte do total.</p>
                        <CategoryList categories={spending.categories} total={spending.quota.total} flights={spending.flights} />
                        <h3 className={styles.subtitle}>Mês a mês</h3>
                        <MonthlyTotals monthlyTotals={spending.monthlyTotals} />
                        <SourceNote
                            sourceName="Câmara dos Deputados, cota parlamentar (CEAP)"
                            sourceUrl={QUOTA_URL}
                            collectedAt={spending.quota.collectedAt}
                        />
                    </section>

                    <section className={styles.block} aria-labelledby="suppliers-title">
                        <h2 id="suppliers-title" className={styles.title}>
                            Quem recebeu
                        </h2>
                        <p className={styles.text}>
                            Empresas e pessoas que receberam dinheiro da cota, de quem recebeu mais para quem recebeu menos. Empresas
                            aparecem com o CNPJ completo. Para proteger as pessoas, mostramos só uma parte do CPF.
                        </p>
                        <SupplierList suppliers={spending.suppliers} total={spending.quota.total} />
                        <SourceNote
                            sourceName="Câmara dos Deputados, cota parlamentar (CEAP)"
                            sourceUrl={QUOTA_URL}
                            collectedAt={spending.quota.collectedAt}
                        />
                    </section>

                    <section id={RECEIPTS_SECTION_ID} className={styles.block} aria-labelledby="receipts-title" tabIndex={-1}>
                        <h2 id="receipts-title" className={styles.title}>
                            Todas as notas
                        </h2>
                        <p className={styles.text}>
                            Cada gasto apresentado à Câmara, do mais novo para o mais antigo. Use os filtros para achar um tipo de gasto,
                            um mês ou um fornecedor.
                        </p>
                        <ReceiptList receipts={spending.receipts} suppliers={spending.suppliers} categories={receiptCategories} />
                        <SourceNote
                            sourceName="Câmara dos Deputados, cota parlamentar (CEAP)"
                            sourceUrl={QUOTA_URL}
                            collectedAt={spending.quota.collectedAt}
                        />
                    </section>
                </>
            ) : (
                <p className={styles.empty}>Nenhum gasto da cota parlamentar registrado {year ? `em ${year}` : "até agora"}.</p>
            )}

            {annualPage && year && (
                <section className={styles.block} aria-labelledby="benefits-title">
                    <h2 id="benefits-title" className={styles.title}>
                        Benefícios do cargo em {year}
                    </h2>
                    <p className={styles.text}>
                        Além da cota, o cargo dá direito a salário, moradia em Brasília, uma verba para pagar a equipe do gabinete e viagens
                        em missão oficial.
                    </p>
                    <BenefitList benefits={annualPage.benefits} />
                    <Explanation subject="benefícios do cargo">
                        <p>
                            <strong>Salário:</strong> o valor bruto, antes dos descontos. É o mesmo para todos os deputados.
                        </p>
                        <p>
                            <strong>Apartamento funcional:</strong> imóvel da Câmara em Brasília, emprestado ao deputado durante o mandato.
                        </p>
                        <p>
                            <strong>Auxílio-moradia:</strong> dinheiro para pagar moradia em Brasília, para quem não usa apartamento
                            funcional.
                        </p>
                        <p>
                            <strong>Verba de gabinete:</strong> dinheiro para pagar o salário das pessoas que trabalham para o deputado. O
                            percentual mostra quanto da verba do ano foi usado.
                        </p>
                        <p>
                            <strong>Missão oficial:</strong> viagem para representar a Câmara, por exemplo ao exterior.
                        </p>
                        <p>
                            <strong>Passaporte diplomático:</strong> documento especial de viagem a que os deputados têm direito.
                        </p>
                    </Explanation>
                    <SourceNote
                        sourceName={`Câmara dos Deputados, página do perfil (${year})`}
                        sourceUrl={annualPage.sourceUrl}
                        collectedAt={annualPage.collectedAt}
                    />
                    <SourceNote
                        sourceName="Salário: Câmara dos Deputados, página do perfil"
                        sourceUrl={DEPUTY_SALARY.sourceUrl}
                        collectedAt={collectionDate(DEPUTY_SALARY.collectedAt)}
                    />
                </section>
            )}

            <Link className={styles.back} href={profilePath(profile, year)}>
                Voltar ao perfil de {profile.politicalName}
            </Link>
        </main>
    );
}