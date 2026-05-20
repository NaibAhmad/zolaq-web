// Market Intelligence — interest score utility (Sprint 10J foundation).
//
// calculateInterestScore is a PURE, DETERMINISTIC function: same input → same
// output, no I/O, no clock reads beyond the explicit `now` argument. It
// implements the weighting, normalization and velocity defined in
// docs/sprint-10i/INTEREST_SCORE_MODEL.md.
//
// It outputs interest LEVEL (band, derived from the normalized score) and
// MOMENTUM (trend_label, derived from velocity_7d) as SEPARATE fields — momentum
// is never restated as a price/sales forecast.

import {
  INTEREST_WEIGHTS,
  MAX_RAW_REFERENCE,
  MIN_BASE,
  SCORE_BAND_THRESHOLDS,
  TREND_COOLING_THRESHOLD,
  TREND_RISING_THRESHOLD,
} from "./constants";
import { deriveConfidenceLevel } from "./confidence";
import type {
  InterestScoreInput,
  InterestScoreResult,
  ScoreBand,
  TrendLabel,
} from "./types";

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function safeCount(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function bandForScore(score: number): ScoreBand {
  // Thresholds are ordered high→low; first satisfied wins.
  for (const { band, min } of SCORE_BAND_THRESHOLDS) {
    if (score >= min) return band;
  }
  return "none";
}

function trendForVelocity(velocity: number): TrendLabel {
  if (velocity >= TREND_RISING_THRESHOLD) return "rising";
  if (velocity <= TREND_COOLING_THRESHOLD) return "cooling";
  return "steady";
}

// Build plain, non-speculative reasons from the signals that contribute most.
// Reasons describe observed platform activity only.
function buildReasons(
  input: InterestScoreInput,
  trend: TrendLabel,
): string[] {
  const reasons: string[] = [];

  if (safeCount(input.official_price_requests) > 0) {
    reasons.push("official_price_requests are strong");
  }
  if (safeCount(input.saved_count) > 0) {
    reasons.push("saved_count increased");
  }
  if (safeCount(input.compare_adds) > 0) {
    reasons.push("compare activity is rising");
  }
  if (safeCount(input.test_drive_clicks) > 0) {
    reasons.push("test_drive interest is present");
  }
  if (safeCount(input.vin_interest) > 0) {
    reasons.push("vin_interest is present");
  }
  if (trend === "rising") {
    reasons.push("7-day momentum is rising");
  } else if (trend === "cooling") {
    reasons.push("7-day momentum is cooling");
  }

  return reasons;
}

export function calculateInterestScore(
  input: InterestScoreInput,
  now: Date = new Date(),
): InterestScoreResult {
  const counts = {
    detail_views: safeCount(input.detail_views),
    saved_count: safeCount(input.saved_count),
    compare_adds: safeCount(input.compare_adds),
    qa_activity: safeCount(input.qa_activity),
    bazar_pulse_participation: safeCount(input.bazar_pulse_participation),
    official_price_requests: safeCount(input.official_price_requests),
    test_drive_clicks: safeCount(input.test_drive_clicks),
    dealer_offer_clicks: safeCount(input.dealer_offer_clicks),
    vin_interest: safeCount(input.vin_interest),
  };

  // raw_score = Σ weight × count
  let raw_score = 0;
  let event_count = 0;
  for (const key of Object.keys(counts) as (keyof typeof counts)[]) {
    raw_score += INTEREST_WEIGHTS[key] * counts[key];
    event_count += counts[key];
  }

  // Normalize against the documented single-input reference. Snapshot ranking
  // (a later sprint) re-normalizes against the true per-snapshot max instead.
  const score = clampScore((100 * raw_score) / MAX_RAW_REFERENCE);
  const band = bandForScore(score);

  // velocity_7d = (raw_this - raw_prev) / max(raw_prev, MIN_BASE).
  // No previous window → 0 (steady), never a fabricated spike.
  const hasPrev =
    typeof input.previous_7d_raw_score === "number" &&
    Number.isFinite(input.previous_7d_raw_score);
  const prev = hasPrev ? Math.max(0, input.previous_7d_raw_score as number) : null;
  const velocity_7d =
    prev === null ? 0 : (raw_score - prev) / Math.max(prev, MIN_BASE);

  const trend_label = trendForVelocity(velocity_7d);
  const confidence_level = deriveConfidenceLevel({
    event_count,
    is_demo: input.is_demo,
  });

  return {
    trim_id: input.trim_id,
    score,
    raw_score,
    band,
    velocity_7d,
    trend_label,
    confidence_level,
    reasons: buildReasons(input, trend_label),
    event_count,
    is_demo: Boolean(input.is_demo),
    last_updated: now.toISOString(),
  };
}
