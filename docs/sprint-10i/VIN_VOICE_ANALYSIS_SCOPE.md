# VIN_VOICE_ANALYSIS_SCOPE — Sprint 10I

**Status:** P1 **paid pilot** scope only. No implementation, no runtime, no
provider in 10I. Flag: `NEXT_PUBLIC_FEATURE_VIN_VOICE_BETA`.

## Goal

Define — at the scope level only — a future paid add-on that produces a
**generated audio narration of an already-approved VIN report summary**, and the
conditions that must be met before it can ever be released publicly.

## What this is NOT

- **Not in Sprint 10I.** Documentation only. No code, no provider, no UI.
- **Not a P0 feature.** It is a P1 paid pilot, dependent on the P0
  `VinReportSummary` shipping first.
- **Not a new analysis.** It narrates the *existing* server-produced summary; it
  does not generate new risk findings.

## What this IS (future)

A paid add-on that converts an **approved `VinReportSummary`** into audio:

- **Source:** generated audio strictly from the approved summary text
  (`VIN_REPORT_SUMMARY_ARCHITECTURE.md`). No new claims, no raw report.
- **Optional future free preview:** a ~30-second audio preview.
- **Full audio:** a paid add-on, later.

## Hard preconditions before any public release

All of the following must be designed, approved and in place **before** this goes
public — none are addressed in 10I:

1. **Legal** — terms for AI-generated audio, liability, accuracy disclaimer.
2. **Privacy** — handling of VIN-linked audio, retention, deletion, consent.
3. **Payment** — pricing, billing integration, invoice flow (cf.
   `docs/sprint-7j/PAYMENT_INVOICE_FLOW.md`).
4. **Support** — support path for paid users.
5. **Refund** — refund policy for a paid digital add-on.

Audio output inherits all wording rules: no speculative/trading/urgency language,
no invented findings, mandatory accuracy + "not a substitute for inspection"
disclaimer (`PRICE_RISE_SIGNAL_RULES.md`, `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`).

## Dependencies

- Requires P0 `VinReportSummary` (`VIN_REPORT_SUMMARY_ARCHITECTURE.md`).
- Requires the confidence/disclaimer rules
  (`DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`).
- Gated behind `NEXT_PUBLIC_FEATURE_VIN_VOICE_BETA` (default off, prod dark) —
  see `FEATURE_FLAGS_AND_ROLLOUT_PLAN.md`.

## Cross-references

- Source summary → `VIN_REPORT_SUMMARY_ARCHITECTURE.md`
- Disclaimer/confidence → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- Payment baseline → `docs/sprint-7j/PAYMENT_INVOICE_FLOW.md`
- Flag & rollout → `FEATURE_FLAGS_AND_ROLLOUT_PLAN.md`

## Not in Sprint 10I

- **No implementation of any kind.** No TTS/audio provider, no preview, no paid
  flow, no storage, no UI, no route. Scope documentation only.
