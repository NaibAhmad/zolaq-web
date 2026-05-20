# INTELLIGENCE_AND_TRUST_LAYER_OVERVIEW — Sprint 10I

**Status:** Architecture / planning only. No UI, no routes, no runtime in this sprint.
**Branch:** `wip/intelligence-trust-10i` (do **not** merge into `master`).

## Goal

Define the **Zolaq Intelligence & Trust Layer** — the family of modules that help
a buyer *understand* a car decision rather than gamble on it. The layer turns the
raw activity and data Zolaq already collects (views, saves, compares, Q&A, Bazar
Nəbzi participation, price requests, dealer-offer clicks, VIN interest) into
**transparent, source-attributed, confidence-labelled signals** that support a
purchase decision.

Five purposes:

1. **Market interest visibility** — show which cars are getting attention this
   week, with honest labels. See `MARKET_INTELLIGENCE_ARCHITECTURE.md` and
   `INTEREST_SCORE_MODEL.md`.
2. **Price movement understanding** — let users see how a trim's observed prices
   moved over 30/90 days, with the source and confidence always visible. See
   `PRICE_MOVEMENT_ARCHITECTURE.md`.
3. **Source / confidence transparency** — every intelligence output states where
   it came from, how confident it is, and when it was last updated. See
   `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`.
4. **AI-assisted decision support** — a source-bound assistant that explains
   comparisons, trims, Q&A and price movement using *only* Zolaq data. See
   `AI_ASSISTANT_SCOPE.md`.
5. **VIN / report risk explanation** — a plain-language summary of a VIN report's
   risk flags, processed server-side. See `VIN_REPORT_SUMMARY_ARCHITECTURE.md`
   and (P1 paid pilot) `VIN_VOICE_ANALYSIS_SCOPE.md`.

## Core UX spine

The layer must always serve this single decision journey. Nothing in 10I+ should
add a parallel "dashboard" that competes with it:

```
Search → View → Compare → Ask → Check risk → Decide
```

- **Search** — catalog / homepage discovery (interest signals may surface here).
- **View** — car detail (interest signal, price movement, price-rise signal).
- **Compare** — compare view (AI explanation of differences).
- **Ask** — Q&A + AI assistant (summaries, next best action).
- **Check risk** — VIN result + report summary (risk flags, disclaimer).
- **Decide** — official price request / dealer offer / test drive (the existing
  lead flow, untouched).

Intelligence modules are *inputs to a decision*, never the product itself.

## What this is NOT

Zolaq is an **automotive decision platform**, not a speculative product. The same
language guardrails as `docs/sprint-7j/MARKET_PULSE_MODULE.md` apply to every
module in this layer:

- **Not betting / gambling.** No wager, stake, odds, payout.
- **Not trading / investing.** No "buy now to profit", no "investment
  opportunity", no guaranteed-return language.
- **Not a price oracle.** Price movement is *observed history*, not a promise of
  future price.
- **Not a prediction guarantee.** A price-rise signal is a *market signal*, never
  "the price will go up". See `PRICE_RISE_SIGNAL_RULES.md`.
- **Not an open chatbot.** The AI assistant is bound to Zolaq sources and refuses
  to invent prices, offers or sources. See `AI_ASSISTANT_SCOPE.md`.
- **Not a replacement for a dealer offer or physical inspection.** Every relevant
  output says so.

## Module map (the 11 sibling docs)

| Module | Doc | Phase |
| --- | --- | --- |
| Layer overview (this doc) | `INTELLIGENCE_AND_TRUST_LAYER_OVERVIEW.md` | — |
| Market interest subsystem | `MARKET_INTELLIGENCE_ARCHITECTURE.md` | P0 arch |
| InterestScore data model | `INTEREST_SCORE_MODEL.md` | P0 arch |
| Price movement subsystem | `PRICE_MOVEMENT_ARCHITECTURE.md` | P0 arch |
| Price-rise signal rules | `PRICE_RISE_SIGNAL_RULES.md` | P0 arch |
| AI assistant scope | `AI_ASSISTANT_SCOPE.md` | P0/P1 arch |
| VIN report text summary | `VIN_REPORT_SUMMARY_ARCHITECTURE.md` | P0 arch |
| VIN voice analysis | `VIN_VOICE_ANALYSIS_SCOPE.md` | P1 paid pilot |
| Confidence & disclaimer | `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md` | P0 arch |
| Feature flags & rollout | `FEATURE_FLAGS_AND_ROLLOUT_PLAN.md` | P0 arch |
| UX placement rules | `UX_PLACEMENT_RULES.md` | P0 arch |
| Acceptance checklist | `SPRINT_10I_ACCEPTANCE_CHECKLIST.md` | gate |

## Feature flags (documented only — see `FEATURE_FLAGS_AND_ROLLOUT_PLAN.md`)

Three new client-readable flags, following the existing `lib/env.ts` pattern
(`NEXT_PUBLIC_FEATURE_*`, default `false`, production dark, opt-in via
`.env.local`). **Not added to code in 10I.**

- `NEXT_PUBLIC_FEATURE_MARKET_INTELLIGENCE_BETA`
- `NEXT_PUBLIC_FEATURE_AI_ASSISTANT_BETA`
- `NEXT_PUBLIC_FEATURE_VIN_VOICE_BETA`

## Trust principles (apply everywhere)

1. **Source visible** — every signal states its source basis.
2. **Confidence visible** — every signal carries a confidence label
   (`high | medium | low | beta_signal | insufficient_data`).
3. **Freshness visible** — every signal shows when it was last updated.
4. **Disclaimer where needed** — speculative-adjacent outputs carry a disclaimer.
5. **Separation of price concepts** — `DealerOfferData` ≠ `CatalogPrice` ≠
   `MarketSignal`. Never blended into one number. See
   `PRICE_MOVEMENT_ARCHITECTURE.md`.
6. **Beta/demo honesty** — any non-real or seeded data is labelled `beta_signal`
   and never presented as a hard market fact.

## Not in Sprint 10I

- No UI components for any module.
- No new or modified routes.
- No backend runtime (no scoring jobs, no AI runtime, no VIN-voice runtime, no
  voting backend).
- No provider integrations (LLM, TTS, market-data, VIN-report providers).
- No changes to existing catalog, detail, compare, Q&A, Bazar Nəbzi, VIN beta,
  admin or dealer flows.
- No merge into `master`.

Implementation sequencing for the next sprint is in
`SPRINT_10I_ACCEPTANCE_CHECKLIST.md` → *Sprint 10J recommendation*.
