import type { ReactNode } from "react";
import styles from "./AmountMark.module.scss";

// an amount of money or a large number marked like a pen highlight on a printed page: off center and a little crooked, in
// the yellow of the stickers. The text stays dark on it in both themes
export function AmountMark({ children }: Readonly<{ children: ReactNode }>) {
    return <mark className={styles.mark}>{children}</mark>;
}

// money ("R$ 17.562,80", "R$ 5,8 trilhões") and large round amounts ("580 milhões de dólares"); other numbers stay as they are
const AMOUNT_PATTERN =
    /((?:R\$|US\$)\s?\d[\d.]*(?:,\d+)?(?:\s(?:milhões|milhão|mil|bilhões|bilhão|trilhões|trilhão))?|\d[\d.]*(?:,\d+)?\s(?:milhões|milhão|bilhões|bilhão|trilhões|trilhão)(?:\sde\s(?:reais|dólares))?)/gu;

// splits a plain text and marks its amounts
export function markAmounts(text: string): ReactNode[] {
    return text.split(AMOUNT_PATTERN).map((part, index) => (index % 2 === 1 ? <AmountMark key={index}>{part}</AmountMark> : part));
}