// Sprint 9H: public surface of the VIN Check foundation. Import from
// "@/lib/vin-check"; never reach into ./repository or ./hash directly from
// outside this module — those paths may move when Prisma models land.

export {
  VIN_CHECK_STATUSES,
  VIN_REPORT_TYPES,
  VIN_RISK_LEVELS,
  VIN_RISK_FLAGS,
  QUOTA_SOURCES,
  type VinCheckStatus,
  type VinReportType,
  type VinRiskLevel,
  type VinRiskFlag,
  type QuotaSource,
  type VinCheckRequest,
  type VinCheckResult,
  type VinCheckSummaryDto,
  type VinCheckQuota,
  type QuotaCheckResult,
} from "./types";

export { isValidVin, normalizeVin, vinLast4 } from "./validation";
export { vinHash } from "./hash";
export {
  VinCheckNotImplementedError,
  findRequest,
  createRequest,
  findResultByVinHash,
  recordResult,
  type CreateVinCheckRequestInput,
  type RecordVinCheckResultInput,
} from "./repository";
export { checkQuota, monthlyFreeBasicLimit } from "./quota";
