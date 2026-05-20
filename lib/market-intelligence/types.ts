// Market Intelligence — core data types (Sprint 10J foundation).
//
// Source of truth: docs/sprint-10i/ (architecture only). This module implements
// the data layer + deterministic utilities; it ships NO public UI in Sprint 10J.
//
// =====================================================================
// LOCKED TRUST RULE:  DealerOfferData ≠ CatalogPrice ≠ MarketSignal
// =====================================================================
// These are three DISTINCT data categories and must NEVER be merged into one
// number, one trend line, or one authority:
//   • CatalogPrice      — Zolaq catalog reference price for a trim. A reference
//                         point, NOT a market trend by itself.
//   • DealerOfferData   — a concrete offer made to a user via the lead flow.
//                         Private to that lead. NEVER aggregated into a public
//                         market trend, and NEVER overridden by a MarketSignal.
//   • MarketSignal      — a derived, confidence-labelled observation about
//                         platform activity / price movement. NEVER replaces a
//                         real price or a real dealer offer.
// `PriceSnapshot.source_type` carries the category; price-movement.ts refuses to
// blend categories. See docs/sprint-10i/PRICE_MOVEMENT_ARCHITECTURE.md.
//
// LANGUAGE RULE: nothing in this module may emit speculative / investment /
// gambling / trading language ("buy now", "guaranteed", "profit", "investment",
// "most bought", future-price/sales prophecy). Output is scoped to Zolaq
// platform activity, never "the market". See INTEREST_SCORE_MODEL.md §Rules.

import type {
  Currency,
  PriceStatus,
  SourceType,
  VerificationStatus,
} from "@/lib/cars/types";

// Shared confidence label used across every Market Intelligence output.
// Mirrors docs/sprint-10i/DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md exactly.
export type DataConfidence =
  | "high" // strong, verified, sufficient data
  | "medium" // reasonable but partial data
  | "low" // weak / sparse data
  | "beta_signal" // includes seeded / demo / internal inputs
  | "insufficient_data"; // below minimum threshold — not shown as fact

// A single observed price point for a trim, from ONE source category. Reuses the
// catalog enums so a snapshot can be derived from an existing PriceRecord without
// re-modelling currency/source/verification/status.
export type PriceSnapshot = {
  snapshot_id: string;
  trim_id: string;
  amount: number;
  currency: Currency;
  // source_type is the category boundary that keeps the trust rule enforceable:
  // "official_dealer" snapshots (DealerOfferData) are never blended with
  // "catalog" snapshots (CatalogPrice) in a single movement calculation.
  source_type: SourceType;
  source_name: string;
  verification_status: VerificationStatus;
  captured_at: string; // ISO-8601
  price_status: PriceStatus;
  confidence_level: DataConfidence;
};

// Direction of an observed price movement over a window. Momentum/observation
// only — never a forecast.
export type MovementDirection = "up" | "down" | "stable" | "insufficient_data";

// A derived price movement over a trailing window (30 or 90 days). Always built
// from snapshots of a SINGLE source category (see calculatePriceMovement).
export type PriceMovement = {
  trim_id: string;
  period_days: number;
  start_snapshot_id: string | null;
  end_snapshot_id: string | null;
  start_amount: number | null;
  end_amount: number | null;
  absolute_change: number | null;
  percentage_change: number | null;
  movement_direction: MovementDirection;
  confidence_level: DataConfidence;
  last_updated: string; // ISO-8601
};

// Raw signal counts for one trim over the trailing 7-day window. Counts are
// assumed already de-duplicated per session by the caller (per 10I model).
export type InterestScoreInput = {
  trim_id: string;
  detail_views: number;
  saved_count: number;
  compare_adds: number;
  qa_activity: number;
  bazar_pulse_participation: number;
  official_price_requests: number;
  test_drive_clicks: number;
  dealer_offer_clicks: number;
  vin_interest: number;
  // Previous window's RAW score, used for the velocity term. Omit for the first
  // window — velocity then resolves to 0 (steady), never a fabricated spike.
  previous_7d_raw_score?: number;
  // True when ANY input is seeded / demo / internal. Forces beta_signal.
  is_demo?: boolean;
};

// Volume band, derived purely from the normalized 0–100 score. Faithful to
// INTEREST_SCORE_MODEL.md — NOT a momentum label.
export type ScoreBand = "top" | "high" | "medium" | "low" | "none";

// Momentum label, derived purely from velocity_7d. Kept SEPARATE from ScoreBand
// so "rising/cooling" is never confused with the interest level itself.
export type TrendLabel = "rising" | "steady" | "cooling";

// Output of calculateInterestScore. Deterministic for a given input.
export type InterestScoreResult = {
  trim_id: string;
  score: number; // normalized 0–100
  raw_score: number; // weighted sum, pre-normalization
  band: ScoreBand;
  velocity_7d: number; // week-over-week growth term (momentum)
  trend_label: TrendLabel;
  confidence_level: DataConfidence;
  reasons: string[]; // plain, non-speculative explanations
  event_count: number; // total qualifying events (drives confidence)
  is_demo: boolean;
  last_updated: string; // ISO-8601
};

// One ranked entry inside an InterestRankingSnapshot.
export type InterestRankingItem = {
  trim_id: string;
  score: number; // normalized 0–100
  band: ScoreBand;
  trend_label: TrendLabel;
};

// A frozen, ordered ranking for a window. Snapshot confidence is the worst-case
// of the entries shown (per INTEREST_SCORE_MODEL.md).
export type InterestRankingSnapshot = {
  snapshot_id: string;
  period_start: string; // ISO-8601, inclusive
  period_end: string; // ISO-8601, exclusive
  items: InterestRankingItem[]; // ordered by score desc
  confidence_level: DataConfidence;
  generated_at: string; // ISO-8601 — "last updated" in UI
};

// Categories of derived market observation. NONE of these is a price or an offer.
export type MarketSignalType =
  | "interest_score"
  | "interest_trend"
  | "price_movement";

// A derived, confidence-labelled observation. `disclaimer_required` is set when
// the signal must be shown with a caveat (beta / low / insufficient data).
export type MarketSignal = {
  signal_id: string;
  trim_id: string;
  signal_type: MarketSignalType;
  confidence_level: DataConfidence;
  // Human-readable basis, e.g. "Zolaq platforma aktivliyi (son 7 gün)". Never an
  // external market claim and never a forecast.
  source_basis: string;
  last_updated: string; // ISO-8601
  disclaimer_required: boolean;
};

// Input shape for the standalone confidence helper.
export type ConfidenceInput = {
  event_count: number;
  is_demo?: boolean;
};
