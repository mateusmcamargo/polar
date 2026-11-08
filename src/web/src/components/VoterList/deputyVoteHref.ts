const yearFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric" });

// The votes page of the deputy for the year of a vote, with the vote in focus. The year is always written, even for the
// newest year of the deputy, which the page accepts as long as it is one of the years with data.
export function deputyVoteHref(deputyId: number, voteId: string, occurredAt: Date): string {
    return `/deputados/${deputyId}/votacoes/${yearFormat.format(occurredAt)}?votacao=${voteId}`;
}