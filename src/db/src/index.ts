export { prisma } from "./client";
export { getChamberComposition, METRICS_START_DATE, type ChamberComposition, type ChamberSeat } from "./queries/chamber";
export { listDeputiesForSearch, type DeputySearchData, type DeputySearchEntry } from "./queries/deputies";
export {
    getDeputyProfile,
    getDeputyYear,
    type DeputyAnnualPage,
    type DeputyAttendance,
    type DeputyBenefits,
    type DeputyFrontRow,
    type DeputyOrganRow,
    type DeputyPartyPeriod,
    type DeputyProfile,
    type DeputyQuotaSpending,
    type DeputyVote,
    type DeputyVoteGroup,
    type DeputyVoteMetrics,
    type DeputyYear,
} from "./queries/deputyProfile";
export {
    getDeputySpending,
    type DeputyQuotaLimit,
    type DeputyReceipt,
    type DeputySpending,
    type DeputySpendingCategory,
    type DeputySpendingSupplier,
} from "./queries/deputySpending";