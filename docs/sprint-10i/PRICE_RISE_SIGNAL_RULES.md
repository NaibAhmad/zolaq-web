# PRICE_RISE_SIGNAL_RULES — Sprint 10I

**Status:** Wording & placement rules only. No UI in 10I. Data model in
`PRICE_MOVEMENT_ARCHITECTURE.md`.
**Priority:** **P1 feature** (architecture documented in 10I; not a P0
deliverable). Saved-car price alerts that build on this signal are also P1.

## Goal

Define the **Price Rise Signal** as a *market signal*, not a prediction promise,
and lock down the language so it can never read as speculative, trading or
"buy-now" advice.

## Definition

A Price Rise Signal is a derived indicator that an upward `PriceMovement` and/or
rising `InterestScore` velocity has been *observed* for a trim. It informs the
user that interest/observed prices are trending up. It says nothing certain about
the future and carries no urgency to buy.

It is computed from existing data only:
- `PriceMovement.direction == up` over a window (`PRICE_MOVEMENT_ARCHITECTURE.md`), and/or
- positive `InterestScore.velocity_7d` (`INTEREST_SCORE_MODEL.md`),
- always with a `confidence_level` and a visible source.

## What this is NOT

- **Not a prediction.** It does not state the price *will* rise.
- **Not investment/trading advice.** No profit, gain, or opportunity framing.
- **Not urgency marketing.** No "buy now", no countdown, no scarcity pressure.
- **Not a guarantee.** Confidence is always shown; low/insufficient data hides it.

## Allowed wording (AZ)

- **Qiymət artımı siqnalı** — "price rise signal"
- **Bazar siqnalı** — "market signal"
- **Artım ehtimalı müşahidə olunur** — "an upward tendency is observed"

Supporting phrasing must stay descriptive and past/observed-tense, e.g.
"Son 30 gündə müşahidə olunan qiymət hərəkəti yuxarı yönlüdür (mənbə + etibarlılıq göstərilir)".

## Forbidden wording (banned in UI, copy, AI output, metadata)

- **qiymət qalxacaq** — "the price will go up" (future guarantee)
- **indi al** — "buy now" (urgency)
- **qazanc fürsəti** — "profit opportunity"
- **zəmanətli artım** — "guaranteed rise"
- **investisiya fürsəti** — "investment opportunity"

Also banned by extension: any "bet/odds/stake/payout/win" terms (per
`docs/sprint-7j/MARKET_PULSE_MODULE.md`), "satılır qaçır", "son şans", or any
phrase implying certainty of future price or financial return.

> The AI assistant inherits this banned list and must refuse to generate any of
> it (`AI_ASSISTANT_SCOPE.md`).

## Mandatory accompaniments

Every Price Rise Signal display must include:
1. **Source** — which `PriceSnapshot`/`InterestScore` basis produced it.
2. **Confidence label** — `high | medium | low | beta_signal | insufficient_data`.
3. **Last updated** — `computed_at`.
4. **Disclaimer** — observed signal, not a future-price promise (template in
   `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`).

A signal with `low` confidence is shown muted; `insufficient_data` is **not**
shown at all. `beta_signal` always carries a "beta" chip.

## Initial placement (UI — not built in 10I)

- **Car detail** — a small signal chip next to price movement.
- **Saved cars** — signal on trims the user already saved.
- **AI explanation** — the assistant can explain the signal in plain language,
  within the wording rules.

**Do not** create a large speculative homepage block, a "hot deals / prices
rising" hero, or any standalone trading-style screen.

## Cross-references

- Movement data & windows → `PRICE_MOVEMENT_ARCHITECTURE.md`
- Velocity term → `INTEREST_SCORE_MODEL.md`
- Confidence & disclaimer copy → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- AI wording enforcement → `AI_ASSISTANT_SCOPE.md`
- Placement → `UX_PLACEMENT_RULES.md`

## Not in Sprint 10I

- No signal computation, no chip component, no homepage block, no AI runtime.
