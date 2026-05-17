// Sprint 9H: VIN Check foundation — types only. Mirrors the enums and entity
// shapes frozen in docs/sprint-9a/VIN_CHECK_ARCHITECTURE_ADDENDUM.md §4–§5.
// String-literal unions are used instead of Prisma enums because the Prisma
// models are intentionally deferred until the feature actually ships.

export const VIN_CHECK_STATUSES = [
  "draft",
  "validated",
  "quota_checked",
  "provider_pending",
  "completed",
  "failed",
  "blocked",
  "expired",
] as const;
export type VinCheckStatus = (typeof VIN_CHECK_STATUSES)[number];

export const VIN_REPORT_TYPES = ["basic", "full", "promo_full", "dealer_bulk"] as const;
export type VinReportType = (typeof VIN_REPORT_TYPES)[number];

export const VIN_RISK_LEVELS = ["unknown", "low", "medium", "high", "critical"] as const;
export type VinRiskLevel = (typeof VIN_RISK_LEVELS)[number];

export const VIN_RISK_FLAGS = [
  "salvage_possible",
  "theft_record_possible",
  "odometer_issue_possible",
  "title_issue_possible",
  "accident_record_possible",
  "flood_damage_possible",
  "auction_record_possible",
  "data_unavailable",
] as const;
export type VinRiskFlag = (typeof VIN_RISK_FLAGS)[number];

export const QUOTA_SOURCES = ["monthly_free", "bonus", "promo", "admin_grant", "paid"] as const;
export type QuotaSource = (typeof QUOTA_SOURCES)[number];

// VinCheckRequest — lifecycle anchor for a single VIN check attempt. Server
// side only; raw VIN is never persisted. See addendum §4.
export type VinCheckRequest = {
  request_id: string;
  user_id: string;
  vin_hash: string;
  vin_last4: string;
  report_type: VinReportType;
  status: VinCheckStatus;
  provider_id: string | null;
  cache_hit_id: string | null;
  quota_source: QuotaSource;
  requested_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

// VinCheckResult — server-side result row. The raw provider payload never
// leaves the server; only summary_dto is safe to ship to clients.
export type VinCheckResult = {
  result_id: string;
  request_id: string;
  risk_level: VinRiskLevel;
  summary_dto: VinCheckSummaryDto;
  raw_provider_payload: unknown;
  flags: VinRiskFlag[];
  expires_at: Date;
  created_at: Date;
};

// VinCheckSummaryDto — the public-safe shape that may cross the wire to a
// client. No provider names, no raw payload, no PII. Addendum §3 #8/#9.
export type VinCheckSummaryDto = {
  risk_level: VinRiskLevel;
  flags: VinRiskFlag[];
  vin_last4: string;
  generated_at: string;
  expires_at: string;
};

// VinCheckQuota — per-user, per-calendar-month counter. Addendum §4.
export type VinCheckQuota = {
  quota_id: string;
  user_id: string;
  month_anchor: string;
  basic_used: number;
  basic_limit: number;
  created_at: Date;
  updated_at: Date;
};

export type QuotaCheckResult =
  | { allowed: true; source: QuotaSource; remaining: number }
  | { allowed: false; reason: string };
