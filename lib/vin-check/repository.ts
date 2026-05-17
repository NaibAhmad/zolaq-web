import "server-only";

import type { VinCheckRequest, VinCheckResult, VinReportType } from "./types";

// Sprint 9H: repository seam for the future VIN Check feature. All functions
// are STUBS — Prisma models (VinCheckRequest, VinCheckResult, VinCheckCache,
// VinCheckQuota, VinCheckCredit, VinCheckProvider) are intentionally deferred
// per user decision. Signatures match the architecture frozen in
// docs/sprint-9a/VIN_CHECK_ARCHITECTURE_ADDENDUM.md so the deferred work is
// mechanical: implement the bodies, do not change the contracts.

export class VinCheckNotImplementedError extends Error {
  constructor(method: string) {
    super(`[vin-check] ${method} is not implemented. Sprint 9H+: add Prisma models and wire repository.`);
    this.name = "VinCheckNotImplementedError";
  }
}

export type CreateVinCheckRequestInput = {
  user_id: string;
  vin_hash: string;
  vin_last4: string;
  report_type: VinReportType;
};

export type RecordVinCheckResultInput = {
  request_id: string;
  result: Omit<VinCheckResult, "result_id" | "created_at">;
};

// Sprint 9H+: implement when VinCheck* Prisma models land.
export async function findRequest(requestId: string): Promise<VinCheckRequest | null> {
  void requestId;
  throw new VinCheckNotImplementedError("findRequest");
}

// Sprint 9H+: implement when VinCheck* Prisma models land.
export async function createRequest(input: CreateVinCheckRequestInput): Promise<VinCheckRequest> {
  void input;
  throw new VinCheckNotImplementedError("createRequest");
}

// Sprint 9H+: implement when VinCheck* Prisma models land. Cache lookup must
// short-circuit the flow at quota_checked → completed without incrementing
// the quota (R11.3).
export async function findResultByVinHash(
  vinHash: string,
  reportType: VinReportType,
): Promise<VinCheckResult | null> {
  void vinHash;
  void reportType;
  throw new VinCheckNotImplementedError("findResultByVinHash");
}

// Sprint 9H+: implement when VinCheck* Prisma models land. Must write the
// VinCheckResult and the matching AuditLog row in the same $transaction
// (AUDIT_LOG_REQUIREMENTS A1).
export async function recordResult(input: RecordVinCheckResultInput): Promise<VinCheckResult> {
  void input;
  throw new VinCheckNotImplementedError("recordResult");
}
