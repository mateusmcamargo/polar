// texts and numbers shared by the party charts of /deputados

// "2025-04-01" -> "2º trimestre de 2025", for sentences, buttons and tables
export function quarterName(quarter: string): string {
    const [year = "", month = "1"] = quarter.split("-");
    return `${Math.ceil(Number(month) / 3)}º trimestre de ${year}`;
}

// "2025-04-01" -> "2º tri 2025", only where a chart axis has no room for the full name
export function quarterLabel(quarter: string): string {
    const [year = "", month = "1"] = quarter.split("-");
    return `${Math.ceil(Number(month) / 3)}º tri ${year}`;
}

// "78%"
export function percentLabel(rate: number): string {
    return `${Math.round(rate * 100)}%`;
}

// two decimals, so the server and the browser write the same coordinates
export function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

// "78 em cada 100"
export function perHundredLabel(rate: number): string {
    return `${Math.round(rate * 100)} em cada 100`;
}