// Market Intelligence — tuning constants (Sprint 10J foundation).
//
// All values mirror docs/sprint-10i/INTEREST_SCORE_MODEL.md and
// DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md. The 10I docs mark these as BETA
// STARTING values, not final committed config — they live here so a single edit
// re-tunes every utility deterministically.

import type { ScoreBand, MovementDirection } from "./types";

// Public-facing beta label (Azerbaijani). Any preview surface that ever renders a
// Market Intelligence signal must show this when confidence is beta_signal.
export const BETA_SIGNAL_LABEL = "Zolaq beta siqnalı";

// --- Interest score weights (INTEREST_SCORE_MODEL.md §Input signals) ---------
// Weights express intent strength: strong-intent lead signals dominate passive
// views. Field names match InterestScoreInput.
export const INTEREST_WEIGHTS = {
  official_price_requests: 8,
  test_drive_clicks: 7,
  dealer_offer_clicks: 6,
  vin_interest: 5,
  saved_count: 4,
  compare_adds: 3,
  qa_activity: 2,
  bazar_pulse_participation: 2,
  detail_views: 1,
} as const;

// Prevents divide-by-near-zero from manufacturing huge velocities on a tiny
// previous-week baseline (INTEREST_SCORE_MODEL.md §7-day growth velocity).
export const MIN_BASE = 10;

// Normalization reference. The 10I formula scales against the snapshot max
// (normalized = 100 * raw / max_raw_in_snapshot). When scoring a SINGLE input in
// isolation there is no snapshot max, so we clamp against this documented
// reference instead, keeping the single-input score bounded to 0–100. Snapshot
// ranking (later sprint) overrides this with the true per-snapshot max.
export const MAX_RAW_REFERENCE = 500;

// --- Score bands (INTEREST_SCORE_MODEL.md §Normalization) --------------------
// Derived from the normalized 0–100 score. Inclusive lower bounds.
export const SCORE_BAND_THRESHOLDS: ReadonlyArray<{
  band: ScoreBand;
  min: number;
}> = [
  { band: "top", min: 80 },
  { band: "high", min: 60 },
  { band: "medium", min: 35 },
  { band: "low", min: 1 },
  { band: "none", min: 0 },
];

// --- Trend (momentum) thresholds ---------------------------------------------
// Applied to velocity_7d. A small dead-band keeps tiny week-over-week noise from
// flipping the label. Momentum only — never a forecast.
export const TREND_RISING_THRESHOLD = 0.1; // +10% week-over-week → rising
export const TREND_COOLING_THRESHOLD = -0.1; // −10% week-over-week → cooling

// --- Confidence thresholds (DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md) ----------
// Driven by real event volume, with beta as the overriding gate.
export const MIN_EVENTS = 20; // below this → insufficient_data
export const T_MED = 60; // [MIN_EVENTS, T_MED) → low
export const T_HIGH = 150; // [T_MED, T_HIGH) → medium; ≥ T_HIGH → high

// --- Price movement (PRICE_MOVEMENT_ARCHITECTURE.md) -------------------------
// Supported trailing windows, in days.
export const SUPPORTED_MOVEMENT_PERIODS = [30, 90] as const;
export type MovementPeriodDays = (typeof SUPPORTED_MOVEMENT_PERIODS)[number];

// Direction dead-band: |percentage_change| ≤ ε% counts as "stable".
export const MOVEMENT_EPSILON_PCT = 0.5;

// Minimum snapshots (within window, same source category) for a usable movement.
export const MIN_MOVEMENT_SNAPSHOTS = 2;

// Re-exported for callers that switch on direction without importing types.
export const MOVEMENT_DIRECTIONS: readonly MovementDirection[] = [
  "up",
  "down",
  "stable",
  "insufficient_data",
];
