import type { EnergySplitData } from "@polar/db/marcos";
import { GlossaryText } from "@/components/GlossaryText/GlossaryText";
import styles from "./EnergySplit.module.scss";

interface EnergySplitProps {
    data: EnergySplitData;
}

const integerFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const shareFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// the energy of a plant shared by two countries, drawn as two bars of the same length: what the treaty guarantees to each country (half
// and half) and what each market was given in one year. The dashed line is the half. Brazil is a solid bar and Paraguay a hatched
// one, so the two are told apart without color. Shares and the difference are calculated from the supplied numbers
export function EnergySplit({ data }: Readonly<EnergySplitProps>) {
    const { firstCountry, secondCountry } = data;
    const total = firstCountry.supplied + secondCountry.supplied;
    const firstShare = (firstCountry.supplied / total) * 100;
    const secondShare = (secondCountry.supplied / total) * 100;
    const half = total / 2;
    const difference = firstCountry.supplied - half;
    const summary = `Pelo tratado, ${firstCountry.name} e ${secondCountry.name} têm direito a 50% cada. Em ${data.year}, a energia colocada à disposição foi ${shareFormat.format(firstShare)}% para ${firstCountry.name} e ${shareFormat.format(secondShare)}% para ${secondCountry.name}.`;

    return (
        <figure className={styles.split} aria-label={summary}>
            <div className={styles.bars}>
                <p className={styles.barLabel}>O que o tratado garante a cada país</p>
                <div className={styles.bar}>
                    <span className={styles.first} style={{ flexGrow: 50 }}>
                        <span className={styles.chip}>{firstCountry.name} 50%</span>
                    </span>
                    <span className={styles.second} style={{ flexGrow: 50 }}>
                        <span className={styles.chip}>{secondCountry.name} 50%</span>
                    </span>
                </div>
                <p className={styles.barLabel}>Energia colocada à disposição de cada mercado em {data.year}</p>
                <div className={styles.bar}>
                    <span className={styles.first} style={{ flexGrow: firstShare }}>
                        <span className={styles.chip}>
                            {firstCountry.name} {shareFormat.format(firstShare)}%
                        </span>
                    </span>
                    <span className={styles.second} style={{ flexGrow: secondShare }}>
                        <span className={styles.chip}>
                            {secondCountry.name} {shareFormat.format(secondShare)}%
                        </span>
                    </span>
                </div>
            </div>
            <dl className={styles.numbers}>
                <div>
                    <dt>{firstCountry.name}</dt>
                    <dd>
                        {integerFormat.format(firstCountry.supplied)} {data.unit}
                    </dd>
                </div>
                <div>
                    <dt>{secondCountry.name}</dt>
                    <dd>
                        {integerFormat.format(secondCountry.supplied)} {data.unit}
                    </dd>
                </div>
                <div>
                    <dt>Metade do total</dt>
                    <dd>
                        {integerFormat.format(half)} {data.unit}
                    </dd>
                </div>
            </dl>
            <p className={styles.legend}>
                <span className={styles.legendMark} aria-hidden="true" />
                A linha tracejada marca a metade.
            </p>
            <p className={styles.reading}>
                O mercado de {firstCountry.name} recebeu cerca de <strong>{integerFormat.format(difference)} {data.unit}</strong> a mais que a metade, e o de{" "}
                {secondCountry.name}, a mesma quantidade a menos.
            </p>
            <p className={styles.note}>
                <GlossaryText text={data.note} />
            </p>
        </figure>
    );
}