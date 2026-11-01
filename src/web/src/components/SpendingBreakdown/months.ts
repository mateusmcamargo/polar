const MONTH_NAMES = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
] as const;

// month from 1 to 12, in lowercase as used inside sentences
export function monthName(month: number): string {
    return MONTH_NAMES[month - 1] ?? String(month);
}

export function capitalizedMonthName(month: number): string {
    const name = monthName(month);
    return name.charAt(0).toUpperCase() + name.slice(1);
}