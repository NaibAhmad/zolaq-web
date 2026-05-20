// Market Intelligence — price movement utility (Sprint 10J foundation).
//
// calculatePriceMovement is a PURE, DETERMINISTIC function over a set of
// PriceSnapshots. It implements the trailing-window logic in
// docs/sprint-10i/PRICE_MOVEMENT_ARCHITECTURE.md.
//
// TRUST RULE ENFORCEMENT: a movement is computed from snapshots of a SINGLE
// source category only (PriceSnapshot.source_type). DealerOfferData
// ("official_dealer") is NEVER blended with CatalogPrice ("catalog") — if the
// input mixes categories, the function refuses and returns insufficient_data
// rather than producing a misleading blended trend.
//
// LANGUAGE RULE: the output is a backward-looking observation (up / down /
// stable). It is never a price-rise forecast or guarantee.

import {
  MIN_MOVEMENT_SNAPSHOTS,
  MOVEMENT_EPSILON_PCT,
} from "./constants";
import type {
  DataConfidence,
  MovementDirection,
  PriceMovement,
  PriceSnapshot,
} from "./types";

// Worst-case precedence: a single weak/uncertain input drags the whole movement
// down. insufficient_data and beta_signal (demo present) dominate.
const CONFIDENCE_PRECEDENCE: DataConfidence[] = [
  "insufficient_data",
  "beta_signal",
  "low",
  "medium",
  "high",
];

function worstConfidence(levels: DataConfidence[]): DataConfidence {
  for (const level of CONFIDENCE_PRECEDENCE) {
    if (levels.includes(level)) return level;
  }
  return "insufficient_data";
}

function insufficient(
  trim_id: string,
  period_days: number,
  now: Date,
  confidence: DataConfidence = "insufficient_data",
): PriceMovement {
  return {
    trim_id,
    period_days,
    start_snapshot_id: null,
    end_snapshot_id: null,
    start_amount: null,
    end_amount: null,
    absolute_change: null,
    percentage_change: null,
    movement_direction: "insufficient_data",
    confidence_level: confidence,
    last_updated: now.toISOString(),
  };
}

function parseTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? NaN : t;
}

// Returns null when the data cannot support ANY movement statement at all
// (e.g. zero usable snapshots / no trim context). Returns a PriceMovement with
// movement_direction = "insufficient_data" when there is a trim context but not
// enough/clean data to state a direction.
export function calculatePriceMovement(
  snapshots: PriceSnapshot[],
  periodDays: number,
  now: Date = new Date(),
): PriceMovement | null {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return null;
  if (!Number.isFinite(periodDays) || periodDays <= 0) return null;

  const trim_id = snapshots[0].trim_id;

  // Guard: every snapshot must belong to the same trim. Mixing trims is a
  // caller error, not a market trend.
  if (snapshots.some((s) => s.trim_id !== trim_id)) {
    return insufficient(trim_id, periodDays, now);
  }

  // TRUST RULE: refuse to blend source categories. If more than one source_type
  // is present, do not compute a movement.
  const categories = new Set(snapshots.map((s) => s.source_type));
  if (categories.size > 1) {
    return insufficient(trim_id, periodDays, now);
  }

  // Keep only valid, in-window snapshots (trailing periodDays from `now`).
  const windowStart = now.getTime() - periodDays * 24 * 60 * 60 * 1000;
  const inWindow = snapshots
    .map((s) => ({ s, t: parseTime(s.captured_at) }))
    .filter(
      ({ s, t }) =>
        Number.isFinite(t) &&
        t >= windowStart &&
        t <= now.getTime() &&
        Number.isFinite(s.amount),
    )
    .sort((a, b) => a.t - b.t);

  if (inWindow.length < MIN_MOVEMENT_SNAPSHOTS) {
    return insufficient(trim_id, periodDays, now);
  }

  const startEntry = inWindow[0];
  const endEntry = inWindow[inWindow.length - 1];
  const start_amount = startEntry.s.amount;
  const end_amount = endEntry.s.amount;

  const absolute_change = end_amount - start_amount;
  const percentage_change =
    start_amount === 0 ? 0 : (absolute_change / start_amount) * 100;

  let movement_direction: MovementDirection;
  if (Math.abs(percentage_change) <= MOVEMENT_EPSILON_PCT) {
    movement_direction = "stable";
  } else if (percentage_change > 0) {
    movement_direction = "up";
  } else {
    movement_direction = "down";
  }

  const confidence_level = worstConfidence(
    inWindow.map(({ s }) => s.confidence_level),
  );

  return {
    trim_id,
    period_days: periodDays,
    start_snapshot_id: startEntry.s.snapshot_id,
    end_snapshot_id: endEntry.s.snapshot_id,
    start_amount,
    end_amount,
    absolute_change,
    percentage_change,
    movement_direction,
    confidence_level,
    last_updated: now.toISOString(),
  };
}
