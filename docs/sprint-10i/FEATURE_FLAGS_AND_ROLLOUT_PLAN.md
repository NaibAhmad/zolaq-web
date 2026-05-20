# FEATURE_FLAGS_AND_ROLLOUT_PLAN — Sprint 10I

**Status:** Documentation only. **Flags are NOT added to `lib/env.ts` or
`.env.local` in 10I.** This is the spec for when 10J implements them.

## Goal

Document the three new client-readable feature flags for the Intelligence & Trust
Layer, their defaults, the existing pattern they follow, and a phased rollout
with kill-switch and fallback behavior.

## Pattern (existing — `lib/env.ts`)

Sprint 10D established the convention: `NEXT_PUBLIC_FEATURE_*`, parsed as
`(process.env.X ?? "false") === "true"`, default **false**, production stays
dark, local dev opts in via `.env.local`. See
[lib/env.ts](../../lib/env.ts) (e.g. `FEATURE_VIN_BETA`, `FEATURE_I18N_BETA`).

The three new flags will follow this exact pattern when added in 10J.

## The three flags

| Env var | Proposed `lib/env.ts` const | Default | Gates |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_FEATURE_MARKET_INTELLIGENCE_BETA` | `FEATURE_MARKET_INTELLIGENCE_BETA` | `false` | Interest ranking + price movement + price-rise signal surfaces |
| `NEXT_PUBLIC_FEATURE_AI_ASSISTANT_BETA` | `FEATURE_AI_ASSISTANT_BETA` | `false` | AI assistant surfaces |
| `NEXT_PUBLIC_FEATURE_VIN_VOICE_BETA` | `FEATURE_VIN_VOICE_BETA` | `false` | VIN voice paid-pilot surface (P1) |

Proposed addition to `lib/env.ts` (for 10J, **not** applied now):

```ts
export const FEATURE_MARKET_INTELLIGENCE_BETA =
  (process.env.NEXT_PUBLIC_FEATURE_MARKET_INTELLIGENCE_BETA ?? "false") === "true";

export const FEATURE_AI_ASSISTANT_BETA =
  (process.env.NEXT_PUBLIC_FEATURE_AI_ASSISTANT_BETA ?? "false") === "true";

export const FEATURE_VIN_VOICE_BETA =
  (process.env.NEXT_PUBLIC_FEATURE_VIN_VOICE_BETA ?? "false") === "true";
```

## Rollout order (locked)

All flags start dark in production. Every flag advances through the same locked
six-step rollout order; no flag skips a step:

| Step | Stage | Gate to advance |
| --- | --- | --- |
| **1** | Local internal beta | flag on locally only; per-module sanity check |
| **2** | Founder review | founder sign-off on behaviour and copy |
| **3** | Staging beta | confidence/source/disclaimer wired; QA on staging |
| **4** | Closed beta users | First-100 cohort; data labelled `beta_signal`; trust review |
| **5** | Public beta — only after QA | full QA pass per module |
| **6** | Gradual production rollout | staged enablement, monitored |

Per-flag ordering across the layer (which feature enters the rollout first):
market intelligence (read-only, lowest risk) → AI Assistant P0-lite (needs the
data foundation + source-binding/banned-wording guard) → VIN Voice (P1 paid
pilot, needs legal/privacy/payment/support/refund; highest bar). Each flag still
walks the full six-step order above.

## Kill-switch behavior

- Each flag is an independent kill-switch. Flipping it to `false` removes the
  surface entirely on next render — no partial state.
- Flags are independent: turning off AI does not affect market intelligence.
- Production default is `false`, so "doing nothing" is always the safe state.

## Fallback / dark states

- **Flag off:** the surface does not render. No placeholder that leaks the
  feature. (Mirrors how `FEATURE_VIN_BETA` gates `HomeVinBetaCard`.)
- **Flag on but data `insufficient_data`:** render the empty/missing-data state
  ("kifayət qədər məlumat yoxdur"), never a fabricated value.
- **Flag on but provider/runtime unavailable (AI/voice):** safe disabled "coming
  soon"/"hazırda əlçatan deyil" state, no error leakage (mirrors the
  `FEATURE_BETA_INVITE` + empty-URL disabled pattern in `lib/env.ts`).
- **Beta inputs present:** `beta_signal` chip always shown.

## Documentation touchpoints (for 10J)

When implemented, update: `lib/env.ts`, `docs/sprint-9i/ENVIRONMENT_VARIABLES.md`,
and `.env.local.example` (if present). **Not done in 10I.**

## Cross-references

- Confidence labels & fallback copy → `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- Placement of each gated surface → `UX_PLACEMENT_RULES.md`
- Module scopes → `MARKET_INTELLIGENCE_ARCHITECTURE.md`, `AI_ASSISTANT_SCOPE.md`,
  `VIN_VOICE_ANALYSIS_SCOPE.md`

## Not in Sprint 10I

- No edits to `lib/env.ts` or `.env.local`. No gated components. Flags are
  documented, not wired.
