# PRICE_MOVEMENT_ARCHITECTURE — Sprint 10I

**Status:** Architecture only. No table, no job, no UI in 10I. Signal-wording
rules are in `PRICE_RISE_SIGNAL_RULES.md`.

## Goal

Define how Zolaq records and presents **observed price movement** for a trim over
time, with the source and confidence always visible, and **without** ever
implying a future price guarantee.

## What this is NOT

- **Not a price prediction.** Movement describes *past observed* prices, not
  future ones.
- **Not a single blended "Zolaq price".** Dealer offers, catalog prices and
  market signals are kept structurally separate (see *Separation of concerns*).
- **Not a trading chart.** No speculative framing, no "buy/sell" cues.

## Separation of concerns (hard rule)

`DealerOfferData` ≠ `CatalogPrice` ≠ `MarketSignal`. These are three distinct
data types and must never be merged into one number or one trend line.

| Type | Meaning | Authority | Visible as |
| --- | --- | --- | --- |
| `CatalogPrice` | Zolaq catalog reference price for a trim | Zolaq editorial / dealer-published | the listed price |
| `DealerOfferData` | A concrete offer made to a user via the lead flow | the dealer | private to the lead, never aggregated into market trend |
| `MarketSignal` | Aggregated/observed price movement signal | derived, confidence-labelled | the movement indicator |

Rules:
- A `DealerOfferData` value **never** feeds a public `MarketSignal` trend.
- A `MarketSignal` **never** overrides or replaces a real dealer offer.
- A `CatalogPrice` is a reference point, not a market trend by itself.
- When displayed together, each is labelled with its own type and source.

## Entities (proposed)

### `PriceSnapshot`

One observed price reading for a trim from one source at one time.

| Field | Type | Notes |
| --- | --- | --- |
| `snapshot_id` | id | primary key |
| `trim_id` | id | trim this reading is for |
| `amount` | number | price value |
| `currency` | enum | e.g. `AZN`, `USD` |
| `source_type` | enum | see *source_type enum* |
| `source_name` | string | human-readable source label (shown in UI) |
| `verification_status` | enum | see *verification_status enum* |
| `captured_at` | timestamp | when the reading was observed |
| `price_status` | enum | see *price_status enum* |
| `confidence_level` | enum | `high` \| `medium` \| `low` \| `beta_signal` \| `insufficient_data` |

### `PriceMovement`

A derived view over `PriceSnapshot` rows for a trim across a window.

| Field | Type | Notes |
| --- | --- | --- |
| `movement_id` | id | primary key |
| `trim_id` | id | trim |
| `window` | enum | `30d` \| `90d` |
| `start_amount` | number | first qualifying snapshot in window |
| `end_amount` | number | last qualifying snapshot in window |
| `delta_amount` | number | end − start |
| `delta_pct` | number | percentage change |
| `direction` | enum | `up` \| `down` \| `flat` \| `unknown` |
| `snapshot_count` | int | qualifying snapshots (drives confidence) |
| `source_summary` | string | which sources contributed |
| `confidence_level` | enum | derived from snapshot count + verification |
| `computed_at` | timestamp | "last updated" for UI |

## Enums

### `source_type`
- `catalog` — Zolaq catalog reference price.
- `dealer_published` — price published by a dealer (not a private offer).
- `market_observed` — observed listing/market data point.
- `demo` — seeded/demo value (beta only).

> A private offer made through the lead flow is `DealerOfferData`, **not** a
> `PriceSnapshot.source_type`, and is never aggregated here.

### `verification_status`
- `verified` — source confirmed by Zolaq.
- `reported` — provided by a source but not independently confirmed.
- `unverified` — origin unconfirmed.
- `demo` — seeded for beta.

### `price_status`
- `active` — current reading still valid.
- `superseded` — replaced by a newer snapshot.
- `expired` — past validity window.
- `withdrawn` — source retracted it.

### `confidence_level`
Shared with the whole layer: `high | medium | low | beta_signal | insufficient_data`.
See `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`.

## 30-day and 90-day movement logic

- **Windows:** `30d` = trailing 30 days, `90d` = trailing 90 days from
  `computed_at`.
- **Eligible snapshots:** `price_status == active|superseded` and
  `verification_status != demo` for non-beta output. Demo snapshots only
  contribute when the module is in beta and the result is labelled `beta_signal`.
- **Endpoints:** `start_amount` = earliest eligible snapshot in window;
  `end_amount` = latest eligible snapshot.
- **Direction:** `up` if `delta_pct > +ε`, `down` if `< −ε`, else `flat`
  (`ε` is a small noise band, e.g. 0.5%); `unknown` if `snapshot_count < MIN`.
- **Confidence:** more verified snapshots from more sources ⇒ higher confidence;
  below `MIN` snapshots ⇒ `insufficient_data` and movement is **not** displayed.

## Rules

- **No fake or unverified trends.** A movement is only shown when it has enough
  eligible, source-attributed snapshots. Otherwise: `insufficient_data`.
- **Source must be visible.** Every displayed movement shows `source_summary`
  and per-point `source_name`.
- **Confidence must be visible.** Every displayed movement shows its
  `confidence_level` and `computed_at`.
- **Disclaimer required** wherever movement is shown (template in
  `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`): observed history, not a future
  price promise.
- **Wording** for any "rising" indication must follow
  `PRICE_RISE_SIGNAL_RULES.md`.

## Future placements (UI — not built in 10I)

See `UX_PLACEMENT_RULES.md`: car detail (movement chip/mini-trend), saved cars
(movement on saved trims), AI explanation (assistant explains the movement).

## Cross-references

- Rising-signal wording → `PRICE_RISE_SIGNAL_RULES.md`
- Confidence & disclaimers → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- AI explanation of movement → `AI_ASSISTANT_SCOPE.md`
- Placement → `UX_PLACEMENT_RULES.md`

## Not in Sprint 10I

- No `PriceSnapshot` / `PriceMovement` tables or migrations.
- No ingestion job, no provider integration, no API, no UI.
