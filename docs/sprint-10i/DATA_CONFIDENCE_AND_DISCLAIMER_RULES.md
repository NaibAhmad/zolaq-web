# DATA_CONFIDENCE_AND_DISCLAIMER_RULES — Sprint 10I

**Status:** Rules only. Applies to every module in the Intelligence & Trust Layer.

## Goal

Define the shared **confidence labels** and the **disclaimer requirements** that
every intelligence output must carry, so users always know the source, how
confident the signal is, when it was updated, and that it is not a guarantee.

## Confidence labels (shared enum)

`confidence_level ∈ { high, medium, low, beta_signal, insufficient_data }`

| Label | Meaning | UI treatment |
| --- | --- | --- |
| `high` | Strong, verified, sufficient data | shown normally |
| `medium` | Reasonable but partial data | shown with a soft caveat |
| `low` | Weak/sparse data | shown muted, explicit caveat |
| `beta_signal` | Includes seeded/demo or beta inputs | "beta" chip, never a hard fact |
| `insufficient_data` | Below minimum threshold | **not shown as a signal**; show "kifayət qədər məlumat yoxdur" |

Rules:
- Any module with seeded/demo inputs is `beta_signal` regardless of volume.
- `insufficient_data` never renders a fabricated value — it renders an empty/
  missing-data state.
- Confidence is derived per module (see `INTEREST_SCORE_MODEL.md`,
  `PRICE_MOVEMENT_ARCHITECTURE.md`, `VIN_REPORT_SUMMARY_ARCHITECTURE.md`).

## Mandatory metadata on every intelligence output

Every displayed signal/summary must include:

1. **Source basis** — where it came from (`source_name` / `source_summary` /
   `source_basis`).
2. **Confidence level** — one of the labels above.
3. **Last updated** — the relevant `computed_at` / `generated_at` / `frozen_at`.
4. **Disclaimer** — where needed (all speculative-adjacent and risk outputs).

## Disclaimer copy templates (AZ-safe, no speculative language)

> Wording stays descriptive and observed-tense; no future guarantees, no urgency,
> no profit framing. Inherits the banned list in `PRICE_RISE_SIGNAL_RULES.md`.

- **Interest ranking:**
  "Bu sıralama Zolaq-dakı aktivliyə əsaslanır və satış göstəricisi deyil. (Mənbə, etibarlılıq və son yenilənmə göstərilir.)"
- **Price movement:**
  "Göstərilən qiymət hərəkəti müşahidə olunan keçmiş məlumatlara əsaslanır və gələcək qiymətə zəmanət vermir. Mənbə və etibarlılıq səviyyəsi göstərilir."
- **Price rise signal:**
  "Bu, müşahidə olunan bazar siqnalıdır, proqnoz və ya alış tövsiyəsi deyil."
- **AI assistant:**
  "Bu izah Zolaq məlumatlarına əsaslanır. Rəsmi qiymət və təklif üçün diler təklifinə baxın. Bu, fiziki yoxlamanı əvəz etmir."
- **VIN report summary:**
  "Bu xülasə təqdim olunan hesabata əsaslanır, zəmanət deyil və avtomobilin fiziki yoxlanışını əvəz etmir."
- **Beta data:**
  "Beta məlumatı: nümunə/sınaq məqsədilədir, real bazar faktı kimi qəbul edilməməlidir."

## Security / privacy rules (layer-wide)

These apply to all modules and are re-checked in `SPRINT_10I_ACCEPTANCE_CHECKLIST.md`:

1. **No sensitive analytics payloads.** No raw phone/email/name/VIN in any
   tracking payload (PII rule from
   [lib/tracking/events.ts](../../lib/tracking/events.ts) `BANNED_PII_KEYS`).
2. **No raw VIN report exposed to client.** Summaries only
   (`VIN_REPORT_SUMMARY_ARCHITECTURE.md`).
3. **Server-side processing** for report summaries and AI context assembly.
4. **Audit-log foundation** for VIN report actions (cf.
   `docs/sprint-9a/AUDIT_LOG_REQUIREMENTS.md`).
5. **Deletion / privacy** for uploaded reports — retention window + user
   deletion path.
6. **No hallucinated source or price data.** Every value traces to a real
   source; the AI may not invent prices, offers, or sources.

## Cross-references

- Interest confidence → `INTEREST_SCORE_MODEL.md`
- Price confidence & separation → `PRICE_MOVEMENT_ARCHITECTURE.md`
- Wording ban → `PRICE_RISE_SIGNAL_RULES.md`
- AI guardrails → `AI_ASSISTANT_SCOPE.md`
- VIN summary → `VIN_REPORT_SUMMARY_ARCHITECTURE.md`

## Not in Sprint 10I

- No copy implemented in the product; templates are reference text for 10J. No
  i18n keys added in this sprint (governance in
  `docs/sprint-10/I18N_GOVERNANCE_AND_NO_HARDCODED_COPY.md` applies when built).
