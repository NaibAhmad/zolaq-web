# SPRINT_10I_ACCEPTANCE_CHECKLIST — Zolaq Intelligence & Trust Architecture

**Sprint:** 10I — Intelligence & Trust Layer (architecture/planning only)
**Branch:** `wip/intelligence-trust-10i` (not merged to `master`)
**Date:** 2026-05-20

## 1. Deliverables — files created under `docs/sprint-10i/`

- [x] `INTELLIGENCE_AND_TRUST_LAYER_OVERVIEW.md`
- [x] `MARKET_INTELLIGENCE_ARCHITECTURE.md`
- [x] `INTEREST_SCORE_MODEL.md`
- [x] `PRICE_MOVEMENT_ARCHITECTURE.md`
- [x] `PRICE_RISE_SIGNAL_RULES.md`
- [x] `AI_ASSISTANT_SCOPE.md`
- [x] `VIN_REPORT_SUMMARY_ARCHITECTURE.md`
- [x] `VIN_VOICE_ANALYSIS_SCOPE.md`
- [x] `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`
- [x] `FEATURE_FLAGS_AND_ROLLOUT_PLAN.md`
- [x] `UX_PLACEMENT_RULES.md`
- [x] `SPRINT_10I_ACCEPTANCE_CHECKLIST.md` (this doc)

## 2. Acceptance criteria

- [x] Architecture-first only — no implementation.
- [x] Docs created under `docs/sprint-10i/`.
- [x] No UI implementation.
- [x] No route changes.
- [x] No provider integration.
- [x] No speculative / gambling / trading language (forbidden list enforced in
      `PRICE_RISE_SIGNAL_RULES.md`; only quoted inside explicit "forbidden" lists).
- [x] `DealerOfferData`, `CatalogPrice`, `MarketSignal` remain separate
      (`PRICE_MOVEMENT_ARCHITECTURE.md` → *Separation of concerns*).
- [x] AI is source-bound (`AI_ASSISTANT_SCOPE.md`).
- [x] VIN Voice remains P1 paid pilot (`VIN_VOICE_ANALYSIS_SCOPE.md`).
- [x] Beta/demo data requires a confidence label
      (`DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`).
- [x] Feature flags documented (`FEATURE_FLAGS_AND_ROLLOUT_PLAN.md`).
- [x] Sprint 10J implementation path is clear (§7 below).

## 3. "What not to change" — confirmed not changed

- [x] No UI implemented.
- [x] No existing route edited.
- [x] No runtime provider integration added.
- [x] No backend voting added.
- [x] No AI runtime added.
- [x] No VIN voice runtime added.
- [x] `wip/intelligence-trust-10i` not merged into `master`.
- [x] No change to catalog, detail, compare, Q&A, Bazar Nəbzi, VIN beta, admin
      or dealer flows.
- [x] `lib/env.ts` and `.env.local` untouched (flags documented only).

## 4. Entity / data-model proposals (summary)

- `InterestScore`, `InterestRankingSnapshot` — `INTEREST_SCORE_MODEL.md`
- `PriceSnapshot` (fields: `snapshot_id`, `trim_id`, `amount`, `currency`,
  `source_type`, `source_name`, `verification_status`, `captured_at`,
  `price_status`, `confidence_level`), `PriceMovement` —
  `PRICE_MOVEMENT_ARCHITECTURE.md`
- `VinReportInput`, `VinReportSummary`, `VinRiskFlag`, `VinSummaryAuditLog` —
  `VIN_REPORT_SUMMARY_ARCHITECTURE.md`

## 5. Score formulas, status & enums (summary)

- **InterestScore** weighted formula + `velocity_7d` + normalization + bands —
  `INTEREST_SCORE_MODEL.md`.
- **Enums:** `source_type`, `verification_status`, `price_status`,
  `confidence_level` (`PRICE_MOVEMENT_ARCHITECTURE.md`,
  `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md`); `score_band`, risk `category` /
  `severity`, audit `action`.
- **Confidence:** `high | medium | low | beta_signal | insufficient_data`.

## 6. Security / privacy rules (consolidated)

- [x] No sensitive analytics payloads (no raw phone/email/name/VIN; PII rule from
      [lib/tracking/events.ts](../../lib/tracking/events.ts)).
- [x] No raw VIN report exposed to client — summaries only.
- [x] Server-side processing for report summaries and AI context.
- [x] Audit-log foundation for VIN report actions (cf.
      `docs/sprint-9a/AUDIT_LOG_REQUIREMENTS.md`).
- [x] Deletion / privacy for uploaded reports (retention + user deletion).
- [x] No hallucinated source or price data anywhere.

Full text in `DATA_CONFIDENCE_AND_DISCLAIMER_RULES.md` → *Security / privacy*.

## 7. Sprint 10J implementation recommendation

Recommended build order (each behind its flag, default off):

1. **Data foundations (P0):** `PriceSnapshot` storage + the three confidence
   enums; `InterestScore`/`InterestRankingSnapshot` aggregation from existing
   events. No UI yet.
2. **Market intelligence read surfaces (P0):** weekly ranking + price-movement
   chip on car detail / saved cars, behind
   `NEXT_PUBLIC_FEATURE_MARKET_INTELLIGENCE_BETA`. Confidence/source/last-updated
   wired; price-rise signal chip (no homepage block).
3. **VIN report summary (P0):** server-side ingestion + summary + risk flags +
   disclaimer + audit log; raw report never sent to client.
4. **AI assistant (P1):** source-bound context assembly + banned-wording guard,
   behind `NEXT_PUBLIC_FEATURE_AI_ASSISTANT_BETA`; explain compare/detail/price/
   VIN-summary; "data insufficient" fallback.
5. **VIN voice pilot (P1):** only after legal/privacy/payment/support/refund are
   in place, behind `NEXT_PUBLIC_FEATURE_VIN_VOICE_BETA`.

Each step ships with: confidence labelling, disclaimer copy (i18n governance per
`docs/sprint-10/I18N_GOVERNANCE_AND_NO_HARDCODED_COPY.md`), empty/loading/
missing-data states, and a QA pass.

## 8. Open questions

1. InterestScore weights/thresholds (`MIN_EVENTS`, `T_MED`, `T_HIGH`, `MIN_BASE`)
   — confirm starting values before beta tuning.
2. Price data sourcing — which `source_type`s are available at launch
   (catalog-only vs. dealer-published vs. market-observed)? Affects whether
   movement is ever above `beta_signal` initially.
3. VIN report input mode for P0 — user upload vs. structured report data vs.
   future provider; affects ingestion design.
4. AI provider, prompt ownership, and the post-generation guard implementation
   — defer to 10J, but decision needed before phase 2.
5. VIN voice — legal/payment/refund design owner and timeline (gates the whole
   pilot).
6. Retention windows for uploaded VIN reports and audit records — set concrete
   durations with legal.
7. SEO treatment of the public interest ranking — indexable or not.

## 9. Verification performed

- [x] All 12 docs present under `docs/sprint-10i/`.
- [x] Forbidden-string scan: speculative terms appear only inside explicit
      "forbidden wording" lists.
- [x] `git diff` shows changes confined to `docs/sprint-10i/` (no source/route/
      env edits).
- [x] Branch is `wip/intelligence-trust-10i`, not merged to `master`.

## 10. Final decision

**PASS** ✅

Sprint 10I delivers a complete, architecture-first specification of the
Intelligence & Trust Layer with separated price concepts, source-bound AI,
confidence labelling, documented feature flags, UX placement rules, security/
privacy rules, and a clear Sprint 10J implementation path — with no UI, no route
changes, no provider integration, and no speculative language.
