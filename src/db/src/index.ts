export { prisma } from "./client";
export { getChamberComposition, METRICS_START_DATE, type ChamberComposition, type ChamberSeat } from "./queries/chamber";
export { listDeputiesForSearch, type DeputySearchData, type DeputySearchEntry } from "./queries/deputies";
export {
    getDeputyProfile,
    getDeputyYear,
    type CommitteeAbsenceBreakdown,
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
export {
    getDeputyMovement,
    getPartyMovement,
    getPeerComparison,
    MIN_COMMON_VOTES,
    MIN_COUNTED_VOTES,
    type DeputyMonthlyQuota,
    type DeputyMovement,
    type DeputyQuarterMetrics,
    type DeputyYearBenefits,
    type PartyAffinityPair,
    type PartyMovement,
    type PartyMovementParty,
    type PartyQuarter,
    type PeerComparison,
    type PeerPoint,
} from "./queries/partyMovement";
export { getPropositionDetail, type PropositionDetail } from "./queries/propositions";
export {
    getDeputyVotes,
    getVoteDetail,
    listPlenaryVoteGroups,
    NOT_VOTED,
    type DeputyYearVote,
    type DeputyYearVoteGroup,
    type DeputyYearVotes,
    type PlenaryVote,
    type PlenaryVoteGroup,
    type PlenaryVoteGroupList,
    type PropositionSummary,
    type VoteCounts,
    type VoteDetail,
    type VoteOrientationRow,
    type VoteSeat,
} from "./queries/votes";