// timestamp columns hold UTC without zone, so arrays are sent as zone free UTC text
export function toUtcText(date: Date): string {
    return date.toISOString().replace("Z", "");
}