// Sprint 10J: deterministic validation for the Market Intelligence foundation.
//
// The repo has no test framework, so this is a lightweight, dependency-free
// assertion script. It exercises the pure utilities in lib/market-intelligence/
// and exits non-zero on the first failed assertion.
//
// Usage:  npm run mi:validate   (→ tsx scripts/market-intelligence-validate.ts)
//
// Covers the Sprint 10J acceptance checks:
//   • interest score is normalized 0–100 and deterministic (stable across runs)
//   • sparse / demo input degrades confidence
//   • price movement detects up / down / stable
//   • insufficient snapshots return insufficient_data
//   • DealerOffer (official_dealer) and Catalog (catalog) snapshots are NOT
//     blended (trust rule)

import {
  calculateInterestScore,
  calculatePriceMovement,
  deriveConfidenceLevel,
  type InterestScoreInput,
  type PriceSnapshot,
} from "@/lib/market-intelligence";

let passed = 0;
const failures: string[] = [];

function assert(label: string, condition: boolean): void {
  if (condition) {
    passed += 1;
  } else {
    failures.push(label);
  }
}

// Fixed clock so timestamps don't affect determinism of value assertions.
const NOW = new Date("2026-05-20T12:00:00+04:00");

// Snapshot times relative to NOW.
const daysAgo = (n: number): string =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

function snap(
  id: string,
  amount: number,
  capturedAt: string,
  source_type: PriceSnapshot["source_type"] = "catalog",
): PriceSnapshot {
  return {
    snapshot_id: id,
    trim_id: "trim_test",
    amount,
    currency: "AZN",
    source_type,
    source_name: "test",
    verification_status: "verified",
    captured_at: capturedAt,
    price_status: source_type === "official_dealer" ? "dealer_official_offer" : "catalog_price",
    confidence_level: "medium",
  };
}

// --- 1. Interest score: normalization, bounds, determinism -------------------
const richInput: InterestScoreInput = {
  trim_id: "trim_test",
  detail_views: 300,
  saved_count: 40,
  compare_adds: 25,
  qa_activity: 10,
  bazar_pulse_participation: 15,
  official_price_requests: 12,
  test_drive_clicks: 8,
  dealer_offer_clicks: 10,
  vin_interest: 6,
  previous_7d_raw_score: 400,
};

const a = calculateInterestScore(richInput, NOW);
const b = calculateInterestScore(richInput, NOW);

assert("score is within 0–100", a.score >= 0 && a.score <= 100);
assert("score is an integer", Number.isInteger(a.score));
assert(
  "score is deterministic across calls",
  a.score === b.score && a.raw_score === b.raw_score && a.band === b.band,
);
assert(
  "raw_score matches manual weighted sum",
  // 300*1 + 40*4 + 25*3 + 10*2 + 15*2 + 12*8 + 8*7 + 10*6 + 6*5
  a.raw_score === 300 + 160 + 75 + 20 + 30 + 96 + 56 + 60 + 30,
);
assert("rich input has reasons", a.reasons.length > 0);

// Rising momentum (raw far above previous) → trend_label "rising".
assert("rising momentum → trend rising", a.trend_label === "rising");

// Cooling momentum.
const cooling = calculateInterestScore(
  { ...richInput, previous_7d_raw_score: 2000 },
  NOW,
);
assert("falling momentum → trend cooling", cooling.trend_label === "cooling");

// No previous window → steady, velocity 0.
const firstWindow = calculateInterestScore(
  { ...richInput, previous_7d_raw_score: undefined },
  NOW,
);
assert(
  "no previous window → velocity 0 / steady",
  firstWindow.velocity_7d === 0 && firstWindow.trend_label === "steady",
);

// Extreme input still clamps to ≤ 100.
const extreme = calculateInterestScore(
  {
    trim_id: "trim_test",
    detail_views: 100000,
    saved_count: 100000,
    compare_adds: 100000,
    qa_activity: 100000,
    bazar_pulse_participation: 100000,
    official_price_requests: 100000,
    test_drive_clicks: 100000,
    dealer_offer_clicks: 100000,
    vin_interest: 100000,
  },
  NOW,
);
assert("extreme input clamps to 100", extreme.score === 100);

// --- 2. Confidence degradation ----------------------------------------------
assert(
  "demo input → beta_signal",
  calculateInterestScore({ ...richInput, is_demo: true }, NOW)
    .confidence_level === "beta_signal",
);

const sparse = calculateInterestScore(
  {
    trim_id: "trim_test",
    detail_views: 5,
    saved_count: 1,
    compare_adds: 0,
    qa_activity: 0,
    bazar_pulse_participation: 0,
    official_price_requests: 0,
    test_drive_clicks: 0,
    dealer_offer_clicks: 0,
    vin_interest: 0,
  },
  NOW,
);
assert(
  "sparse input → insufficient_data confidence",
  sparse.confidence_level === "insufficient_data",
);
assert("rich input → high/medium confidence", a.confidence_level === "high");

assert(
  "deriveConfidenceLevel: 0 events → insufficient_data",
  deriveConfidenceLevel({ event_count: 0 }) === "insufficient_data",
);
assert(
  "deriveConfidenceLevel: demo gate overrides volume",
  deriveConfidenceLevel({ event_count: 10000, is_demo: true }) === "beta_signal",
);
assert(
  "deriveConfidenceLevel: 30 events → low",
  deriveConfidenceLevel({ event_count: 30 }) === "low",
);
assert(
  "deriveConfidenceLevel: 100 events → medium",
  deriveConfidenceLevel({ event_count: 100 }) === "medium",
);
assert(
  "deriveConfidenceLevel: 200 events → high",
  deriveConfidenceLevel({ event_count: 200 }) === "high",
);

// --- 3. Price movement: up / down / stable ----------------------------------
const up = calculatePriceMovement(
  [snap("s1", 80000, daysAgo(80)), snap("s2", 84000, daysAgo(5))],
  90,
  NOW,
);
assert("price movement up detected", up?.movement_direction === "up");
assert("price movement up absolute change", up?.absolute_change === 4000);

const down = calculatePriceMovement(
  [snap("s1", 84000, daysAgo(80)), snap("s2", 80000, daysAgo(5))],
  90,
  NOW,
);
assert("price movement down detected", down?.movement_direction === "down");

const stable = calculatePriceMovement(
  [snap("s1", 80000, daysAgo(80)), snap("s2", 80100, daysAgo(5))],
  90,
  NOW,
);
assert(
  "tiny change within epsilon → stable",
  stable?.movement_direction === "stable",
);

// 30-day window excludes an out-of-window early snapshot, leaving < 2 in window.
const windowed = calculatePriceMovement(
  [snap("s1", 80000, daysAgo(80)), snap("s2", 82000, daysAgo(5))],
  30,
  NOW,
);
assert(
  "30-day window drops out-of-window snapshot → insufficient_data",
  windowed?.movement_direction === "insufficient_data",
);

// --- 4. Insufficient snapshots ----------------------------------------------
assert(
  "single snapshot → insufficient_data",
  calculatePriceMovement([snap("s1", 80000, daysAgo(5))], 90, NOW)
    ?.movement_direction === "insufficient_data",
);
assert(
  "empty snapshots → null",
  calculatePriceMovement([], 90, NOW) === null,
);

// --- 5. Trust rule: categories are NOT blended ------------------------------
const blended = calculatePriceMovement(
  [
    snap("s1", 80000, daysAgo(40), "catalog"),
    snap("s2", 76000, daysAgo(5), "official_dealer"),
  ],
  90,
  NOW,
);
assert(
  "catalog + dealer mix is refused (not blended)",
  blended?.movement_direction === "insufficient_data" &&
    blended?.absolute_change === null,
);

// Same two amounts, but consistent category → valid movement, proving the
// refusal above is specifically the category guard, not the data.
const consistent = calculatePriceMovement(
  [
    snap("s1", 80000, daysAgo(40), "catalog"),
    snap("s2", 76000, daysAgo(5), "catalog"),
  ],
  90,
  NOW,
);
assert(
  "single-category snapshots compute a valid movement",
  consistent?.movement_direction === "down" &&
    consistent?.absolute_change === -4000,
);

// --- Report ------------------------------------------------------------------
if (failures.length > 0) {
  console.error(`\n❌ Market Intelligence validation FAILED (${failures.length}):`);
  for (const f of failures) console.error(`   • ${f}`);
  console.error(`\n   ${passed} passed, ${failures.length} failed.\n`);
  process.exit(1);
}

console.log(`\n✅ Market Intelligence validation PASSED — ${passed} assertions.\n`);
