# MARKET_INTELLIGENCE_ARCHITECTURE — Sprint 10I

**Status:** Architecture only. No UI, no routes, no scoring runtime in this sprint.
Concept and rules here; the data model and formula live in
`INTEREST_SCORE_MODEL.md`.

## Goal

Define the subsystem that produces **Weekly Interest Ranking** — an honest view
of which cars are getting attention on Zolaq this week. It converts activity
Zolaq already records into an `InterestScore` per car/trim, refreshed on a weekly
cadence, always labelled with a confidence level.

## What this is NOT

- **Not a "most bought" ranking.** Zolaq does not have verified purchase data, so
  the module never claims sales, "best-seller", or "most bought". See *Forbidden
  claims*.
- **Not a market-cap / price chart.** Interest ≠ price. Price lives in
  `PRICE_MOVEMENT_ARCHITECTURE.md`.
- **Not real-money or prediction-market.** Inherits the guardrails in
  `INTELLIGENCE_AND_TRUST_LAYER_OVERVIEW.md`.

## What this IS

A ranked list of cars/trims by `InterestScore`, computed weekly from on-platform
engagement, with each entry showing its rank, score band, and confidence label.
During beta the inputs may be partly seeded/demo, so the whole module is gated
behind `NEXT_PUBLIC_FEATURE_MARKET_INTELLIGENCE_BETA` and labelled `beta_signal`.

## Signal sources (inputs)

All sourced from existing platform activity. Detailed weights in
`INTEREST_SCORE_MODEL.md`.

| Signal | Origin (existing surface) | Notes |
| --- | --- | --- |
| Car detail views | car detail page | de-duplicated per session |
| Saved cars | saved/favourites | add events |
| Compare adds | compare flow | car added to a comparison |
| Q&A activity | `/qa` | questions/answers tied to a model |
| Bazar Nəbzi participation | market-pulse votes | participation, not outcome |
| Official price requests | lead flow | strong intent signal |
| Test drive clicks | lead flow | strong intent signal |
| Dealer offer clicks | lead flow | strong intent signal |
| VIN interest | VIN beta | VIN check started for a model |
| 7-day growth velocity | derived | week-over-week delta term |

Strong-intent signals (price request, test drive, dealer offer) are weighted
higher than passive signals (views). See the formula doc.

## Aggregation cadence

- **Primary cadence: weekly.** A scheduled job (future, not in 10I) aggregates
  the trailing 7-day window into one `InterestScore` per car/trim and freezes a
  ranking snapshot.
- **Velocity term:** computed from this week's window vs. the prior 7-day window.
- **Recompute boundary:** Monday 00:00 Asia/Baku (align with Bazar Nəbzi weekly
  band in `docs/sprint-7j/MARKET_PULSE_MODULE.md`).
- The displayed ranking always references the **frozen snapshot**, not a live
  per-request computation, so the "last updated" timestamp is meaningful.

## Entity relationships (proposed)

```
Car / Trim ──< InterestSignalEvent (raw, existing analytics)
                     │  (weekly aggregation job)
                     ▼
              InterestScore (per car/trim, per week)
                     │
                     ▼
           InterestRankingSnapshot (ordered list, frozen weekly)
```

- `InterestSignalEvent` — *not new*; these map onto events Zolaq already emits
  (see [lib/tracking/events.ts](../../lib/tracking/events.ts)). The subsystem
  *reads* aggregates, it does not introduce new PII.
- `InterestScore` and `InterestRankingSnapshot` — new entities defined in
  `INTEREST_SCORE_MODEL.md`.

## Privacy

- Aggregation operates on **counts**, never on raw user identifiers.
- No phone/email/name enters any interest payload (PII rule from
  [lib/tracking/events.ts](../../lib/tracking/events.ts) `BANNED_PII_KEYS`).
- Ranking output is a public aggregate (rank, score band, confidence), never a
  per-user activity trail.

## Confidence labelling

Every ranking and every entry carries a confidence label from
`DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`:

- `beta_signal` — default during beta (seeded/partial inputs).
- `low` / `medium` / `high` — when real volume crosses defined thresholds.
- `insufficient_data` — car/trim below the minimum event threshold; shown as
  "kifayət qədər məlumat yoxdur" rather than a fabricated rank.

## Allowed vs forbidden claims

**Allowed:** "Bu həftə ən çox baxılan / ən çox maraq görən modellər",
"Maraq sıralaması (beta)", "Zolaq-da bu həftəki aktivliyə əsasən".

**Forbidden:** "ən çox satılan / most bought" (no purchase data), "bazarın
nömrə 1-i", any absolute market-share or sales claim, any "indi al" urgency.

## Future placements (UI — not built in 10I)

Documented in `UX_PLACEMENT_RULES.md`:

- **Homepage** — a compact "Bu həftə maraq" strip (do not overload the homepage).
- **Car detail** — a small "bu həftə X-ci sıradadır (beta)" badge.
- **Saved cars** — interest movement on cars the user already saved.

## Cross-references

- Data model + formula → `INTEREST_SCORE_MODEL.md`
- Confidence labels → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- Placement → `UX_PLACEMENT_RULES.md`
- Flag + rollout → `FEATURE_FLAGS_AND_ROLLOUT_PLAN.md`

## Not in Sprint 10I

- No aggregation job, no ranking snapshot table, no API, no UI.
- No new tracking events (existing events are sufficient as inputs).
- No homepage strip / detail badge component.
