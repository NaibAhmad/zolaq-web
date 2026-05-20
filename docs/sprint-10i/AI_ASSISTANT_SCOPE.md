# AI_ASSISTANT_SCOPE — Sprint 10I

**Status:** Scope & guardrails only. No AI runtime, no provider integration, no
UI in 10I. Flag: `NEXT_PUBLIC_FEATURE_AI_ASSISTANT_BETA`.

## Goal

Define the Zolaq AI Assistant as a **source-bound decision helper** — an
assistant that explains Zolaq data to support a car decision — explicitly **not**
an open-ended chatbot.

## What this is NOT

- **Not an open chatbot.** It does not answer arbitrary off-platform questions.
- **Not a price source.** It never invents or estimates prices.
- **Not a dealer.** It never invents or promises a dealer offer.
- **Not a source of truth on its own.** It cites Zolaq data; it does not assert
  facts Zolaq does not hold.
- **Not a replacement** for an official dealer offer or a physical inspection.

## What this IS

A bounded assistant that, given Zolaq's own data (catalog, comparisons, Q&A,
price movement, VIN report summary), explains and summarizes to help the user
move along the decision spine *Search → View → Compare → Ask → Check risk →
Decide*.

## Supported use cases

### P0
- **Car selection help** — narrow choices from catalog data and stated needs.
- **Compare explanation** — explain differences between trims already in a
  comparison (no invented specs).
- **Trim / package explanation** — explain what a trim/package includes from
  catalog data.
- **Q&A summarization** — summarize existing `/qa` threads tied to a model.

### P1
- **Price movement explanation** — explain an observed `PriceMovement` /
  Price Rise Signal in plain language, within `PRICE_RISE_SIGNAL_RULES.md`
  wording.
- **VIN report explanation** — explain a server-produced VIN report summary
  (`VIN_REPORT_SUMMARY_ARCHITECTURE.md`); never the raw report.
- **Next best action** — suggest the next decision step (compare, request
  official price, book test drive, run VIN check) — suggestions, never promises.

## Hard rules

1. **Source-bound.** Every answer is grounded in Zolaq data passed to it. If the
   data isn't present, it must not improvise.
2. **No invented prices.** It never produces a price not present in Zolaq data.
3. **No invented dealer offers.** It never fabricates or commits an offer.
4. **No invented sources.** It never cites a source it wasn't given.
5. **Says when data is insufficient.** Default safe response: "Bu barədə kifayət
   qədər məlumat yoxdur" + the safe next action — never a guess.
6. **Does not replace an official dealer offer.** It points users to the real
   lead flow for binding numbers.
7. **Does not replace physical inspection.** For condition/risk it defers to VIN
   summary + in-person inspection, with disclaimer.
8. **Honors banned wording.** Inherits the forbidden list from
   `PRICE_RISE_SIGNAL_RULES.md` and the betting-term ban from
   `docs/sprint-7j/MARKET_PULSE_MODULE.md`. No speculative/trading/urgency
   language.
9. **Confidence-aware.** When explaining a signal, it surfaces the
   `confidence_level` and "last updated", and degrades gracefully on low/
   insufficient data.
10. **No PII leakage.** It is not given raw phone/email/name and does not echo
    any (PII rule from [lib/tracking/events.ts](../../lib/tracking/events.ts)).

## Integration points (read-only, future)

The assistant connects to existing surfaces — it does not change their flows:

- **Compare** — explains a user's comparison.
- **Detail** — explains a trim and its price movement.
- **Lead** — routes "next best action" to the existing official-price / test-drive
  flow; never substitutes it.
- **VIN** — explains the server-side report summary.
- **Q&A** — summarizes existing threads.

## Architecture shape (proposed, for 10J)

```
User question + bounded Zolaq context (catalog/compare/qa/price/vin-summary)
        │  (server-side, context assembled from Zolaq data only)
        ▼
   AI Assistant (source-bound prompt + refusal rules + banned-wording filter)
        │
        ▼
   Answer (+ cited Zolaq sources + confidence + safe next action)
```

- Context assembly and the provider call run **server-side**.
- A post-generation guard rejects any output containing banned wording or
  unsourced price/offer claims.
- Provider choice, prompts and runtime are **out of scope for 10I**.

## Cross-references

- Wording ban → `PRICE_RISE_SIGNAL_RULES.md`
- Price explanation source → `PRICE_MOVEMENT_ARCHITECTURE.md`
- VIN explanation source → `VIN_REPORT_SUMMARY_ARCHITECTURE.md`
- Confidence labels → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- Placement → `UX_PLACEMENT_RULES.md`
- Flag & rollout → `FEATURE_FLAGS_AND_ROLLOUT_PLAN.md`

## Not in Sprint 10I

- No provider integration, no prompts in code, no assistant UI, no API route.
- No runtime of any kind.
