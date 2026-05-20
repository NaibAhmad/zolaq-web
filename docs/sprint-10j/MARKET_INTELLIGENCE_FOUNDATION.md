# MARKET_INTELLIGENCE_FOUNDATION — Sprint 10J (P0.1)

**Status:** Data foundation only. Types + deterministic utilities + clearly
labelled demo data. **No public UI.** First implementation slice after the
Sprint 10I architecture (`docs/sprint-10i/`) merged. The 10I docs remain the
source of truth.

Zolaq is an automotive **decision** platform. Market Intelligence helps users
understand platform **interest**, **price movement**, and **confidence**. It must
never behave like a prediction market, investment, trading, or gambling product.

---

## What was implemented

- **Feature flag** `FEATURE_MARKET_INTELLIGENCE_BETA` in [lib/env.ts](../../lib/env.ts),
  read as `(process.env.NEXT_PUBLIC_FEATURE_MARKET_INTELLIGENCE_BETA ?? "false") === "true"`.
  Mirrored (default `false`) in [.env.example](../../.env.example). No public UI is wired
  to it in this sprint.
- **`lib/market-intelligence/` module:**
  - `types.ts` — all core types (snake_case fields, reusing `Currency` /
    `SourceType` / `VerificationStatus` / `PriceStatus` from `@/lib/cars/types`).
  - `constants.ts` — interest weights, normalization reference, band/trend
    thresholds, confidence thresholds, movement window/epsilon, beta label.
  - `interest-score.ts` — `calculateInterestScore(input, now?)`.
  - `price-movement.ts` — `calculatePriceMovement(snapshots, periodDays, now?)`.
  - `confidence.ts` — `deriveConfidenceLevel(input)`, `requiresDisclaimer(level)`.
  - `mock-data.ts` — demo inputs/snapshots, all `is_demo` / `beta_signal`.
  - `index.ts` — barrel re-exports.
- **Validation:** `scripts/market-intelligence-validate.ts` + `npm run mi:validate`
  (uses the existing `tsx` dependency; no test framework added).
- **Docs:** this file.

## What was NOT implemented (intentionally out of scope)

- No public UI, homepage/catalog/detail module, or route changes.
- No persistence, migration, or weekly aggregation job (deferred to 10J.2).
- No AI Assistant runtime, VIN Report Summary runtime, or VIN Voice.
- No Price Rise Signal UI, no saved-car price alerts.
- No `MarketSignal` generation pipeline (the type exists; nothing emits it yet).
- No AI / VIN Voice runtime flags wired — they stay documented in
  `docs/sprint-10i/FEATURE_FLAGS_AND_ROLLOUT_PLAN.md` only.
- No changes to dealer/admin flows, Q&A/community, or `wip/intelligence-trust-10i`.

---

## Data types (`lib/market-intelligence/types.ts`)

| Type | Purpose |
| --- | --- |
| `DataConfidence` | `high \| medium \| low \| beta_signal \| insufficient_data` |
| `PriceSnapshot` | one price point for a trim, from one source category |
| `MovementDirection` | `up \| down \| stable \| insufficient_data` |
| `PriceMovement` | derived movement over a 30/90-day trailing window |
| `InterestScoreInput` | raw 7-day signal counts for a trim |
| `ScoreBand` | `top \| high \| medium \| low \| none` (interest **level**) |
| `TrendLabel` | `rising \| steady \| cooling` (**momentum**, separate from band) |
| `InterestScoreResult` | output of `calculateInterestScore` |
| `InterestRankingSnapshot` / `InterestRankingItem` | frozen ordered ranking |
| `MarketSignal` / `MarketSignalType` | derived, confidence-labelled observation |
| `ConfidenceInput` | input for `deriveConfidenceLevel` |

### Locked trust rule — `DealerOfferData ≠ CatalogPrice ≠ MarketSignal`

Three distinct categories, never merged into one number/trend/authority:

- **CatalogPrice** — Zolaq reference price; a reference point, not a trend.
- **DealerOfferData** — concrete offer to a user via the lead flow; private to
  that lead, never aggregated into a public trend, never overridden by a signal.
- **MarketSignal** — derived, confidence-labelled observation; never replaces a
  real price or a real dealer offer.

`PriceSnapshot.source_type` carries the category. `calculatePriceMovement`
**refuses to blend categories** — a mixed input returns `insufficient_data`.

---

## Utility behavior

### `calculateInterestScore(input, now?)` → `InterestScoreResult`
Pure & deterministic (same input → same output; only `now` sets `last_updated`).

- `raw_score` = weighted sum (10I weights): price_req×8, testdrive×7,
  dealer_click×6, vin×5, save×4, compare×3, qa×2, pulse×2, view×1.
- `score` = `round(100 * raw_score / MAX_RAW_REFERENCE)`, clamped **0–100**.
- `band` derived from `score`: top ≥80, high 60–79, medium 35–59, low 1–34, none 0.
- `velocity_7d` = `(raw_this − raw_prev) / max(raw_prev, MIN_BASE)`; **0** when no
  previous window (never a fabricated spike).
- `trend_label` from `velocity_7d`: ≥ +10% → rising, ≤ −10% → cooling, else steady.
- `reasons[]` — plain, non-speculative (e.g. "official_price_requests are strong",
  "saved_count increased", "compare activity is rising").
- `confidence_level` via `deriveConfidenceLevel`. Negative/NaN counts are floored to 0.

### `calculatePriceMovement(snapshots, periodDays, now?)` → `PriceMovement | null`
- Returns `null` for empty input / invalid period (no trim context at all).
- Returns a movement with `insufficient_data` when: snapshots span >1 trim, span
  >1 source category (trust rule), or fewer than 2 valid in-window snapshots.
- Otherwise: filters to the trailing `periodDays` window, sorts by `captured_at`,
  uses earliest vs latest for `absolute_change` / `percentage_change`.
- `movement_direction`: `|pct| ≤ 0.5%` → stable, `> 0` → up, `< 0` → down.
- `confidence_level` = worst-case of the contributing snapshots' confidence.
- Supports 30 and 90 day windows. No price-rise forecast language.

### `deriveConfidenceLevel(input)` → `DataConfidence`
`is_demo` → `beta_signal`; `event_count < 20` → `insufficient_data`;
`< 60` → `low`; `< 150` → `medium`; else `high`.

---

## Feature flag behavior

- `NEXT_PUBLIC_FEATURE_MARKET_INTELLIGENCE_BETA` defaults `false`; safe when
  missing (the `?? "false"` fallback). Production stays dark.
- No public UI consumes it in Sprint 10J — it exists so a future internal/dev
  preview can opt in via `.env.local` and render a labelled "Zolaq beta siqnalı".

---

## Acceptance checklist

- [x] Branch from latest `origin/master` (`sprint-10j-market-intelligence-foundation`).
- [x] Only Market Intelligence foundation files + docs changed.
- [x] No public UI exposed; no route/dealer/admin changes.
- [x] Feature flag defaults `false`, safe when missing.
- [x] `PriceSnapshot`, `PriceMovement`, `InterestScore*` and `DataConfidence` types exist.
- [x] Interest score is deterministic and normalized 0–100.
- [x] Price movement handles 30/90-day logic safely; <2 valid snapshots → insufficient.
- [x] Sparse/demo data produces low / beta_signal / insufficient_data.
- [x] `DealerOfferData`, `CatalogPrice`, `MarketSignal` remain separate (no blending).
- [x] No speculative / gambling / trading / investment language.
- [x] `npm run mi:validate`, `tsc --noEmit`, `lint`, `build` pass.

## Recommended next step — Sprint 10J.2

Persistence + weekly aggregation: a table/repository for `InterestScore` and
`InterestRankingSnapshot`, a deterministic weekly job (Monday 00:00 Asia/Baku per
10I) that re-normalizes against the true per-snapshot max, and a `PriceSnapshot`
ingestion path derived from existing `PriceRecord` data (keeping categories
separate). UI stays gated and labelled until a QA pass.
