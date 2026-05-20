# UX_PLACEMENT_RULES — Sprint 10I

**Status:** Placement rules only. No UI built in 10I. Defines where each module
*may* appear later, gated by its flag.

## Goal

Define where each Intelligence & Trust module may surface in the product, so that
when built (10J+) it supports the decision spine *Search → View → Compare → Ask →
Check risk → Decide* without overloading any one screen.

## Global rules

1. **Do not overload the homepage.** At most one compact intelligence strip; no
   speculative hero, no trading-style dashboard.
2. **Support the decision journey.** Every module placement maps to a step in the
   spine; if it doesn't, it doesn't belong.
3. **No separate confusing dashboard.** Intelligence is embedded in existing
   surfaces, not a parallel analytics console.
4. **Mobile-first.** Compact, tap-friendly; signals collapse gracefully on small
   screens.
5. **SEO-safe where relevant.** Public aggregate surfaces (e.g. interest ranking,
   catalog) must not harm SEO; gated/beta surfaces follow the staging noindex
   policy where applicable (`docs/sprint-10/STAGING_NOINDEX_POLICY.md`).
6. **Clear empty / loading / missing-data states.** Every placement defines all
   three; `insufficient_data` shows a missing-data state, never a fake value.
7. **Confidence + source + last-updated** are always present on the surface
   (`DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`).

## Placement matrix (future, flag-gated)

| Surface | Interest ranking | Price movement | Price-rise signal | AI assistant | VIN summary |
| --- | --- | --- | --- | --- | --- |
| **Homepage** | compact "Bu həftə maraq" strip | — | ✕ no speculative block | entry point only | — |
| **Catalog** | optional sort/badge (light) | — | — | — | — |
| **Car detail** | rank badge (beta) | movement chip / mini-trend | signal chip | "explain this" | link if VIN run |
| **Saved cars** | interest movement on saved | movement on saved trims | signal on saved | "explain my saved" | — |
| **Compare** | — | per-trim movement | — | compare explanation | — |
| **Q&A** | — | — | — | thread summarization | — |
| **Bazar Nəbzi** | participation feeds score (input) | — | — | — | — |
| **VIN result** | — | — | — | explain summary | summary + risk flags + disclaimer |
| **Profile** | (P1) own interest history | — | — | — | (P1) own VIN history |

Legend: ✕ = explicitly forbidden; — = not placed; text = allowed placement.

## Per-surface notes

- **Homepage** — single compact strip max; gated by
  `NEXT_PUBLIC_FEATURE_MARKET_INTELLIGENCE_BETA`. No price-rise hero (see
  `PRICE_RISE_SIGNAL_RULES.md`). Mirrors the restrained placement style of
  existing home cards (e.g. `HomeVinBetaCard`).
- **Car detail** — the densest intelligence surface, but each module is a small
  chip/section, not a takeover. Movement + signal sit near price; AI "explain"
  is a quiet affordance.
- **Saved cars** — best home for movement/signals since the user already opted
  into these cars.
- **Compare** — AI explains differences; price movement per trim is allowed,
  speculative signal is not duplicated here.
- **VIN result** — summary + risk flags + mandatory disclaimer; AI may explain;
  voice add-on (P1) appears only when `VIN_VOICE_BETA` + paid preconditions met.
- **Profile** — history views are P1, low priority, never the main surface.

## Anti-patterns (forbidden)

- A standalone "/intelligence" or "/market" dashboard route.
- A homepage "prices rising / hot deals" speculative hero.
- Trading-style charts with buy/sell cues.
- Any surface that shows a signal without source + confidence + last-updated.

## Cross-references

- Wording ban → `PRICE_RISE_SIGNAL_RULES.md`
- Confidence/disclaimer/empty states → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- Flags gating each surface → `FEATURE_FLAGS_AND_ROLLOUT_PLAN.md`
- Module scopes → `MARKET_INTELLIGENCE_ARCHITECTURE.md`, `PRICE_MOVEMENT_ARCHITECTURE.md`,
  `AI_ASSISTANT_SCOPE.md`, `VIN_REPORT_SUMMARY_ARCHITECTURE.md`

## Not in Sprint 10I

- No components, no route changes, no placement implemented. Rules only.
