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

## Rollout phases

Each flag rolls out independently; all start dark in production.

| Phase | Audience | Flags on (env) | Gate |
| --- | --- | --- | --- |
| **0 — Internal** | founder/team, local & staging | per-flag, local only | docs PASS (this sprint) |
| **1 — Closed beta** | First-100 cohort, staging/limited prod | `MARKET_INTELLIGENCE_BETA` first | data labelled `beta_signal`; confidence rules enforced |
| **2 — AI beta** | subset of closed beta | `AI_ASSISTANT_BETA` | source-binding + banned-wording guard verified |
| **3 — VIN voice pilot** | opt-in paid pilot | `VIN_VOICE_BETA` | legal/privacy/payment/support/refund all in place |
| **4 — Wider** | general | per-flag promotion | per-module QA + trust review |

Ordering rationale: market intelligence (read-only, lowest risk) → AI (needs
guard verification) → VIN voice (needs legal/payment, highest bar).

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
