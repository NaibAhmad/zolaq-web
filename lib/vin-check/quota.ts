import "server-only";

import type { QuotaCheckResult, VinReportType } from "./types";

// Sprint 9H: server-side quota gate. STUB — returns disallowed until the
// VinCheckQuota / VinCheckCredit Prisma models exist. Per R11.2, quota is
// read and incremented only in the repository, inside the same $transaction
// as the VinCheckRequest status transition. Never client-side.

const MONTHLY_FREE_BASIC_LIMIT = 2;

export async function checkQuota(
  userId: string,
  reportType: VinReportType,
): Promise<QuotaCheckResult> {
  void userId;
  void reportType;
  return { allowed: false, reason: "NOT_IMPLEMENTED" };
}

export function monthlyFreeBasicLimit(): number {
  return MONTHLY_FREE_BASIC_LIMIT;
}
