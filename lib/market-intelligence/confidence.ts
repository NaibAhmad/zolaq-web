// Market Intelligence — confidence helper (Sprint 10J foundation).
//
// deriveConfidenceLevel maps evidence volume (and the demo gate) to a
// DataConfidence label, exactly per the table in
// docs/sprint-10i/INTEREST_SCORE_MODEL.md §Confidence derivation and
// DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md.

import { MIN_EVENTS, T_HIGH, T_MED } from "./constants";
import type { ConfidenceInput, DataConfidence } from "./types";

// Rules (in priority order):
//   is_demo == true                         → beta_signal  (never a hard fact)
//   event_count < MIN_EVENTS                → insufficient_data
//   MIN_EVENTS ≤ event_count < T_MED        → low
//   T_MED      ≤ event_count < T_HIGH       → medium
//   event_count ≥ T_HIGH                    → high
export function deriveConfidenceLevel(input: ConfidenceInput): DataConfidence {
  if (input.is_demo) return "beta_signal";

  const count = Number.isFinite(input.event_count)
    ? Math.max(0, Math.floor(input.event_count))
    : 0;

  if (count < MIN_EVENTS) return "insufficient_data";
  if (count < T_MED) return "low";
  if (count < T_HIGH) return "medium";
  return "high";
}

// True when a signal at this confidence must be shown with a caveat / beta chip,
// or withheld entirely (insufficient_data). Used to set
// MarketSignal.disclaimer_required.
export function requiresDisclaimer(level: DataConfidence): boolean {
  return level !== "high";
}
