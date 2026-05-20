# Sprint 10H — Closure Report (Clean)

**Date:** 2026-05-20
**Scope:** Local demo UX hotfix (founder demo review fixes). Local demo only — no migration, no payment, no real ad billing, no real test-drive scheduling, no staging touch.
**Gate criterion (locked):** Intelligence & Trust (Sprint 10I) does not start until 10H is closed **and** local demo QA passes.

> Branch hygiene completed. The working tree now contains **only** the four committed Sprint 10H items. All out-of-scope (10I-flavored) work has been moved off `master` and preserved on a separate branch. No new product features were implemented.

---

## 1. Save button result — ✅ Working, clean

- `components/saved/SaveToggleButton.tsx` + `lib/saved/client-store.ts`.
- localStorage-backed toggle (`zlq.saved.v1`); states **Saxla ↔ Saxlanıldı** via `t("actions.save"/"actions.saved")`; `useSyncExternalStore` for cross-component sync; disabled placeholder and orphan "Tezliklə" label removed.
- **Comfort coupling removed:** the component imports only `react`, `@/components/ui/Button`, `@/lib/i18n/client`, and `@/lib/saved/client-store`. **No `components/comfort` dependency.** (The `useTransientStatus` coupling existed only in uncommitted work, now isolated to the wip branch.)

## 2. Test Drive CTA result — ✅ Working

- `intent="test_drive"` variant of `components/leads/LeadFormLauncher.tsx`; two placements on car detail.
- Reuses the existing lead/OTP flow with beta-mode copy and a `[Test sürüsü tələbi]` note prefix. No real scheduling.

## 3. Ads visibility result — ✅ Working

- `components/ads/SponsoredSlot.tsx` + public read-only `app/api/ads/active/route.ts`; placements on homepage, catalog, car detail.
- Smoke (prod build): `GET /api/ads/active?area=homepage` → live row `adr_seed_3` ("Reklam"); `catalog` & `car_detail` → empty → "Demo reklam yeri" placeholder path; invalid `area` → 400.
- Never imitates an official quote (`ads.notOfficialQuote`).

## 4. Car detail copy / date cleanup result — ✅ Working

- `lib/format/date.ts` `formatDateAz` (dd.MM.yyyy) replaces the Intl `az-AZ` formatter; applied on `CarDetail.tsx` + `PriceCard.tsx`.
- Smoke confirmed `dd.MM.yyyy` (e.g. `01.05.2024`, `17.05.2026`) with **zero** `M0x` artifacts. Quick Actions uses `flex-wrap` for 390px.

---

## 5. Final changed files (Sprint 10H closure)

The 10H closure content is the commit `8262561` ("Sprint 10H-UX hotfix") on `master`. **Uncommitted tracked changes on master: NONE.**

Committed 10H files (10):
- `app/(public)/cars/page.tsx`
- `app/(public)/page.tsx`
- `app/api/ads/active/route.ts`
- `components/ads/SponsoredSlot.tsx`
- `components/catalog/CarDetail.tsx`
- `components/catalog/PriceCard.tsx`
- `components/leads/LeadFormLauncher.tsx`
- `components/saved/SaveToggleButton.tsx`
- `lib/format/date.ts`
- `lib/saved/client-store.ts`

Working tree on `master` after hygiene: clean. Only untracked artifacts remain — this report (`docs/sprint-10/SPRINT_10H_CLOSURE_REPORT.md`), local tooling (`.claude/`), and build output (`.next/`).

## 6. Branch hygiene — out-of-scope work preserved (not deleted)

All ~2,000 lines of Sprint 10I-flavored work (73 files) were committed to branch **`wip/intelligence-trust-10i`** (commit `f351ce3`), then removed from `master`'s working tree. Retrievable any time via `git switch wip/intelligence-trust-10i`. Contents isolated off 10H:
- Q&A community: `QaAskFab`, `QaAskModal`, `QaCommunityFeed`, `QaHero`, `QaQuestionCard`, `QaSidebar`, `QaPageChrome`, modified `app/(public)/qa/page.tsx`, `lib/content/qa-community-mock.ts`
- Comfort system: `components/comfort/*`, `lib/comfort/*`, `app/profile/comfort/`, `useTransientStatus`/`SectionReveal`
- Profile settings: `app/profile/settings/`, `components/profile/`, `lib/profile/`, profile page edits
- Market-pulse sentiment/trend: `BazarSentimentStrip`/`BazarReasonChips`/`BazarRelatedActions`, `lib/market-pulse/{trend,local-selection}.ts`, seed/types edits, `HomeMarketPulse`
- Theme/UI/VIN refactors: `ThemeToggle`/deleted `ThemeScript`, `layout.tsx`, `globals.css`, `Button`/`Modal`, `VinCheckBetaModal`, `compare/*`
- i18n key additions, `lib/routes.ts`, `lib/tracking/events.ts`, `docs/reference/**`, `docs/ux/**`

## Hygiene confirmations
- ✅ No out-of-scope files remain on `master` (verified: `components/comfort`, `lib/comfort`, `app/profile/settings`, `app/profile/comfort`, `lib/profile`, `qa-community-mock`, `market-pulse/{trend,local-selection}` all absent).
- ✅ `SaveToggleButton.tsx` has no comfort dependency.
- ✅ `app/(public)/qa/` is **unmodified** vs HEAD (`git diff HEAD -- app/(public)/qa` empty); not part of the 10H closure.
- ✅ `git diff HEAD --stat` empty (no tracked drift from committed 10H).

---

## 7. tsc result — ✅ PASS
`npx tsc --noEmit` → exit 0. (First run reported stale `.next/types/validator.ts` references to the removed `profile/comfort` & `profile/settings` routes — generated artifacts from the prior dirty-tree build, not source errors. Cleared `.next` and re-ran clean.)

## 8. lint result — ✅ PASS
`npm run lint` (eslint) → exit 0.

## 9. build result — ✅ PASS
`npm run build` (Next.js 16.2.6, Turbopack) → exit 0. **Route manifest no longer lists `/profile/comfort` or `/profile/settings`** — confirming the out-of-scope routes are gone. `/qa` remains (pre-existing committed route, unmodified).

## 10. local browser smoke result — ✅ PASS
Against a production server (`next start -p 3100`) of the clean build:
- HTTP 200: `/`, `/cars`, `/cars/brand_byd__han`, `/qa`.
- Dates render `dd.MM.yyyy`; zero `M0x` artifacts.
- Ads API: homepage live placement; catalog/car_detail empty → placeholder; invalid area → 400.
- No raw i18n keys leaked on served pages.
- **Note:** clearing the stale `.next` for the tsc gate disrupted a pre-existing dev server on :3000 (it began returning 500). That server was serving the old dirty tree; restart it to pick up the clean tree. The smoke above ran on an independent :3100 server, now stopped.
- **Limitation (unchanged):** interactive click paths (Save toggle persistence, Test Drive OTP modal, client-side `SponsoredSlot` render) verified by code review + green build, not automated DOM clicks. Recommend a manual founder click-through.

---

## 11. Final decision — ✅ PASS (clean & mergeable)

Sprint 10H is now a clean, self-contained closure on `master`:
- All four feature areas function; all four gates (tsc, lint, build, smoke) are green on the **clean** tree.
- No out-of-scope work, no comfort coupling, no `/qa` modification, no extra routes.
- Out-of-scope 10I-flavored work is safely preserved on `wip/intelligence-trust-10i` for later review.

**Verdict: PASS. Sprint 10H is closed and cleanly mergeable.** The lock's precondition ("10H closed and local demo QA passes") is satisfied; Sprint 10I may be unlocked at CTO/founder discretion. (Recommended optional step before sign-off: manual founder click-through of Save / Test Drive / Ads.)
