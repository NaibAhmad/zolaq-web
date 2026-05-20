# INTEREST_SCORE_MODEL — Sprint 10I

**Status:** Data-model & formula proposal only. No table, no job, no UI in 10I.
Subsystem context in `MARKET_INTELLIGENCE_ARCHITECTURE.md`.

## Goal

Define the `InterestScore` entity, the input signals, the weighting formula, the
normalization, and the 7-day velocity term used by the Weekly Interest Ranking.

## Entities (proposed)

### `InterestScore`

One row per car/trim per weekly window.

| Field | Type | Notes |
| --- | --- | --- |
| `score_id` | id | primary key |
| `trim_id` | id | car/trim this score belongs to |
| `window_start` | date | inclusive, Monday 00:00 Asia/Baku |
| `window_end` | date | exclusive, next Monday |
| `raw_score` | number | weighted sum of signals (pre-normalization) |
| `normalized_score` | number | 0–100, scaled across the snapshot |
| `velocity_7d` | number | week-over-week growth term (see below) |
| `score_band` | enum | `top` \| `high` \| `medium` \| `low` \| `none` |
| `confidence_level` | enum | `high` \| `medium` \| `low` \| `beta_signal` \| `insufficient_data` |
| `event_count` | int | total qualifying events in window (drives confidence) |
| `is_demo` | bool | true when any input is seeded/demo |
| `computed_at` | timestamp | when this score was frozen |

### `InterestRankingSnapshot`

| Field | Type | Notes |
| --- | --- | --- |
| `snapshot_id` | id | primary key |
| `window_start` / `window_end` | date | matches the scores it ranks |
| `ranked_trim_ids` | id[] | ordered by `normalized_score` desc |
| `confidence_level` | enum | snapshot-level confidence (worst-case of entries shown) |
| `is_demo` | bool | true if the snapshot contains demo inputs |
| `frozen_at` | timestamp | publication time → "last updated" in UI |

## Input signals & proposed weights

Weights express *intent strength*, not popularity alone. Strong-intent lead
signals dominate passive views. These are **starting weights for beta tuning**,
not final.

| Signal | Symbol | Proposed weight |
| --- | --- | --- |
| Car detail views (de-duplicated) | `views` | 1 |
| Saved cars (add) | `saves` | 4 |
| Compare adds | `compares` | 3 |
| Q&A activity (model-linked) | `qa` | 2 |
| Bazar Nəbzi participation | `pulse` | 2 |
| Official price requests | `price_req` | 8 |
| Test drive clicks | `testdrive` | 7 |
| Dealer offer clicks | `dealer_click` | 6 |
| VIN interest (VIN check started) | `vin` | 5 |

### Raw score

```
raw_score =
    1 * views
  + 4 * saves
  + 3 * compares
  + 2 * qa
  + 2 * pulse
  + 8 * price_req
  + 7 * testdrive
  + 6 * dealer_click
  + 5 * vin
```

All counts are taken from the trailing 7-day window. Counts are de-duplicated per
session where applicable to resist refresh inflation.

### 7-day growth velocity

Captures momentum, separate from absolute volume:

```
velocity_7d = (raw_score_this_week - raw_score_prev_week)
              / max(raw_score_prev_week, MIN_BASE)
```

`MIN_BASE` (e.g. 10) prevents divide-by-near-zero from manufacturing huge
velocities on tiny baselines. `velocity_7d` is reported as a movement indicator
(e.g. "↑ artan maraq") but **never** rephrased as a price or sales prediction.

### Normalization

```
normalized_score = round( 100 * raw_score / max_raw_score_in_snapshot )
```

Scaled within the weekly snapshot so the top car ≈ 100. `score_band` is derived
from `normalized_score`:

| Band | normalized_score |
| --- | --- |
| `top` | ≥ 80 |
| `high` | 60–79 |
| `medium` | 35–59 |
| `low` | 1–34 |
| `none` | 0 |

## Confidence derivation

Confidence is driven by real event volume, with beta as the gate:

| Condition | confidence_level |
| --- | --- |
| `is_demo == true` (any seeded input) | `beta_signal` |
| `event_count < MIN_EVENTS` (e.g. 20) | `insufficient_data` |
| `MIN_EVENTS ≤ event_count < T_MED` | `low` |
| `T_MED ≤ event_count < T_HIGH` | `medium` |
| `event_count ≥ T_HIGH` | `high` |

Thresholds (`MIN_EVENTS`, `T_MED`, `T_HIGH`) are tuned during beta and recorded
here when chosen. See `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`.

## Rules

- **Label beta/demo signals clearly.** `is_demo == true` ⇒ `beta_signal` ⇒ UI
  shows a "beta" chip. Never present demo data as a hard fact.
- **No absolute market claims.** Output is "Zolaq aktivliyinə əsasən", scoped to
  the platform, never "the market".
- **Never "most bought".** No purchase data exists; selling/sales/best-seller
  language is forbidden until verified purchase data is integrated and a separate
  model is designed.
- **Velocity is momentum, not prophecy.** It must not be displayed as future
  price or guaranteed demand.

## Cross-references

- Subsystem & cadence → `MARKET_INTELLIGENCE_ARCHITECTURE.md`
- Confidence labels & disclaimer copy → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- Placement → `UX_PLACEMENT_RULES.md`

## Not in Sprint 10I

- No table/migration, no aggregation job, no API, no UI.
- Weights/thresholds are proposals to be validated in beta, not committed config.
