# i18n Audit Results — Sprint 10I-E

2026-05-18 (10I-D baseline) → 2026-05-18 (10I-E close). Companion to
[`I18N_GOVERNANCE_AND_NO_HARDCODED_COPY.md`](./I18N_GOVERNANCE_AND_NO_HARDCODED_COPY.md).

## What was scanned

- `app/**/*.tsx` — every page, layout, and route handler that renders JSX.
- `components/**/*.tsx` — every reusable component.

The script that produces this report lives at
[`scripts/audit-i18n-hardcoded.mjs`](../../scripts/audit-i18n-hardcoded.mjs).
Run it with `npm run i18n:audit`. It walks the two trees above, parses each
`.tsx`, and flags string literals that look like visible AZ/RU/EN copy
based on:

- Presence of AZ-specific characters (`ə ş ç ğ ı ö ü`).
- Presence of Cyrillic characters.
- A capitalized English phrase of 2+ words.

It ignores literals that match an allowlist of proper nouns (brand, model,
dealer names — `BYD`, `Volvo`, `Hongqi`, `Deepal`, `Zolaq`, `WhatsApp`,
`Bakı`, etc.), technical units (`km`, `kW`, `kWh`, `AZN`, `HP`), phone
placeholders matching `+994\d+`, identifier-shaped values, hex colors,
template-literal URL/path fragments containing `${…}` placeholders, and
non-visible JSX attributes (`className`, `id`, `href`, `src`, `key`,
`role`, `type`, `name`, `data-*`).

Sprint 10I-D extended the script to also report **per-area buckets** (
`public`, `profile`, `dealer`, `admin`, `auth`, `leads`, `shared`).

Sprint 10I-E added **Wave-0 classification buckets** so the founder review
can see at a glance what blocks Wave 0 vs what's intentionally deferred:

| Bucket | Definition |
| --- | --- |
| **BLOCKING-public** | Public + profile + auth + leads surfaces a Wave-0 user reaches. Must be ≈ 0. |
| **BLOCKING-operator-chrome** | Dealer + admin page chrome (nav, titles, table headings, form labels, buttons, statuses). Should be ≈ 0 unless explicitly justified per governance §7. |
| **ALLOWED** | Proper nouns / units / placeholders. Should always be 0 (allowlist already excludes them — count is for transparency). |
| **DEFERRED** | Long-form editor bodies inside files listed in the script's `DEFERRED_BODY_FILES` set. Translated when the multilingual editor lands. |
| **OTHER** | Everything else — shared chrome, brand, etc. Low priority. |

The script supports `node scripts/audit-i18n-hardcoded.mjs --check=blocking`
which exits non-zero when either BLOCKING bucket is non-empty. Default exit
remains 0 (warning gate). Sprint 11 will wire the `--check=blocking` form
into CI.

## Sprint 10I-E candidate counts (after closure pass)

Snapshot taken at the end of the Sprint 10I-E close:

| Bucket | Candidates | Change vs 10I-D baseline |
| --- | ---: | ---: |
| BLOCKING-public | **0** | −225 (was 225 across public/profile/auth/leads) |
| BLOCKING-operator-chrome | 274 | −19 (was 293) |
| ALLOWED | 0 | unchanged |
| DEFERRED | 34 | newly classified |
| OTHER | 2 | −18 (was 20) |
| **TOTAL** | **310** | **−293 vs 10I-D (603)** |

Per-area (legacy view, kept for continuity):

| Area | 10I-D | 10I-E | Δ |
| --- | ---: | ---: | ---: |
| admin | 294 | 232 | −62 |
| dealer | 59 | 42 | −17 |
| leads | 64 | 0 (FPs filtered) | −64 |
| public | 96 | 0 | −96 |
| auth | 33 | 0 | −33 |
| profile | 32 | 0 | −32 |
| shared | 20 | 0 | −20 |

(The leads bucket dropped to zero because the previous 9 entries were
template-literal `/api/...` URLs that the audit now correctly classifies as
not-copy. Same for several CarDetail/TestDriveStatusView entries.)

### Sprint 10I-E founder-visible surfaces — closure summary

Public + profile + auth + leads are now **zero hardcoded AZ on the
rendered text path**:

- **CarDetail.tsx** — 47 → 0. ENERGY/STATUS/SOURCE/VERIFICATION enum tables
  collapsed into `TranslationKey` maps. Hero copy, back link, quick-actions,
  technical info, best-price hero, all spec labels, sponsored slot helper,
  empty/error states translate.
- **Compare detail internals** — `CompareTable.tsx` and
  `CompareRecommendation.tsx` rewritten as client components using `useT()`.
  `CompareSelectionBar.tsx` wired through. New `compare.*` keys:
  `noValue`, `priceLabel`, `requestOffer`, `sourcePrefix`, `minHint`,
  `readyHint`, `selectedCount`, `clear`, `compareCta`, `rec*` (6 keys).
- **Auth / OTP** — `OtpForm.tsx` (21 → 0), `PasswordSignInForm.tsx`,
  `app/auth/otp/*`. `auth.*` namespace expanded with ~30 keys covering
  phone/code labels, send/resend/verify states, lock reasons, error
  messages, and admin/dealer panel titles.
- **Lead detail / status surfaces** — `LeadDetailView.tsx` (27 → 0),
  `LeadStatusHero`, `LeadStatusCard`, `LeadNextActionCard`, `LeadTimeline`,
  `LeadOtpStep`, `TestDriveStatusView`, `WhatsappStatusView`. `lib/leads/cta.ts`
  refactored to return `TranslationKey`s rather than AZ strings;
  `SECONDARY_ACTION_LABELS` → `SECONDARY_ACTION_KEYS`. `leads.*` namespace
  now carries CTA labels/descriptions per `LeadState`, status hero
  descriptions, summary cards, and link labels.
- **Decisions detail** — `app/profile/decisions/page.tsx`,
  `[decisionId]/page.tsx`, `NewDecisionForm.tsx`. `profileDecisions.*`
  namespace expanded with workspace section titles, status/empty notes,
  form labels.
- **Profile residuals** — shared chrome (`LoadingState`, `ErrorState`,
  `NotFoundState`, `Modal`, `ThemeToggle`, `LanguageSelector`,
  `HomeSearchBlock`, `Header`, `MobileBottomNav`) wired through `useT()`
  with new keys in `common.*` and `nav.*`.

## Operator-chrome closure (Sprint 10I-E)

The plan goal was that dealer / admin nav, titles, buttons, forms, tables,
statuses must translate. Sprint 10I-E landed the **shared chrome surfaces**
that propagate across every operator page:

- `components/dealer/DealerSidebar.tsx` — already wired (10I-D).
- `components/admin/AdminSidebar.tsx` — already wired (10I-D).
- `components/admin/AdminTopbar.tsx` — role labels + sign-out (5 strings).
- `components/admin/ApprovalActions.tsx` — approve / revise / reject form
  triplet (6 strings).
- `components/admin/StatusBadge.tsx` — 16-state status pill used across
  every admin table and dealer table cell. New `adminStatus.*` namespace.
- `components/admin/PasswordSignInPlaceholder.tsx` — async server component
  using `getServerT()`.
- `components/dealer/DealerLoginPicker.tsx` — async server component using
  `getServerT()`.
- `app/admin/login/page.tsx` and `app/dealer/login/page.tsx` — panel title
  + dev-mock notice.

These propagate to every dealer/admin page that mounts the sidebar,
topbar, status badges, or approval actions — so navigation, role pills,
status cells, and the approval workflow read the user's selected locale
without per-page work.

### What's left in BLOCKING-operator-chrome (274)

The remaining 274 candidates are in the per-page body shells of dealer
and admin pages (the `app/dealer/(authed)/**/*.tsx` and
`app/admin/(authed)/**/*.tsx` trees). They are concentrated in:

| File | Count | Surface |
| --- | ---: | --- |
| `app/admin/(authed)/catalog/prices/page.tsx` | 28 | Catalog ops form chrome |
| `app/admin/(authed)/roles/page.tsx` | 27 | Role matrix display |
| `app/admin/(authed)/catalog/trims/[trimId]/page.tsx` | 20 | Trim detail form |
| `app/admin/(authed)/catalog/trims/page.tsx` | 13 | Trims index |
| `app/admin/(authed)/ads/[adRequestId]/page.tsx` | 10 | Ad review |
| `app/admin/(authed)/market-pulse/[topicId]/page.tsx` | 10 | Market-pulse editor chrome |
| `app/admin/(authed)/media/page.tsx` | 10 | Media review |
| `app/admin/(authed)/ads/new/page.tsx` | 9 | Ad request form |
| `app/dealer/(authed)/ad-requests/new/page.tsx` | 9 | Dealer ad-request form |
| `app/admin/(authed)/catalog/generations/page.tsx` | 8 | Generations index |
| (≈ 30 more files at 1–7 each) | ~130 | Various AZ-first operator screens |

**Operator-chrome status:** AZ-first per governance §7, but the
dictionary keys for these surfaces (`adminNav`, `adminDashboard`,
`adminCatalog`, `adminDealers`, `adminContent`, `adminCommercial`,
`adminAudit`, `adminRoles`, `dealerNav`, `dealerDashboard`, `dealerProfile`,
`dealerMedia`, `dealerSubmissions`, `dealerAds`, `dealerInvoices`,
`dealerPayments`) are present in all three locales. Wiring the remaining
page bodies through `useT()` / `getServerT()` is mechanical and tracked as
the Sprint 11 follow-up. The shared chrome wired this sprint already
ensures locale-switch on the operator panels is not "randomly half
translated" — the top bar, sidebar, status pills, and approval workflow
all read the user's locale; only the form labels inside individual page
bodies remain AZ.

## Intentionally untranslated

The following remain in source form on purpose. The audit script may still
report them — the allowlist is conservative — but they should not be moved
into the dictionary.

| Item | Why |
| --- | --- |
| Brand / model / generation / trim / dealer **names** | Proper nouns — they read the same in every locale. |
| Technical units (`km`, `kW`, `kWh`, `HP`, `AZN`) | Universally recognized; translating them would degrade clarity. |
| Phone placeholders matching `+994…` | Format guidance, not copy. |
| Author-written **content bodies** when EN/RU translation has not been authored | Long-form prose. For the 3 news / 5 encyclopedia / 5 Q&A items shipped in the demo seed, full EN/RU bodies *are* authored. The `TranslationNotice` fallback exists for items authored after 10I-D. |
| The single AZ string operators type into the admin market-pulse "new" form | Operators enter the source value; localization happens in the seed file and the helper layer. Tracked as a future follow-up to evolve the editor into a localized input. |
| Per-page operator chrome inside individual admin/dealer pages (BLOCKING-operator-chrome) | AZ-first per governance §7. Shared chrome translates; per-page bodies are Sprint 11 follow-up. The dictionary already carries every key needed (`admin*` + `dealer*` namespaces), so wiring is mechanical. |
| `Zolaq · 2026`, `Zolaq Admin`, `Zolaq Diler` | Brand string + system-name composition. Year is data, brand is a proper noun. |
| Q&A route slug `/qa` and internal state token `"suallar"` | Route identifiers, not visible copy. The visible label (`nav.qa`) is translated: AZ "Sorğu" / EN "Ask" / RU "Запросы". |
| `Q&A` literal used in some breadcrumbs | Standard cross-locale label for the section. Where a localized variant is desired, the `nav.qa` key is the canonical source. |

## Deferred content translations (DEFERRED bucket)

Files in the audit's `DEFERRED_BODY_FILES` set carry long-form editor body
text that requires the multilingual editor (not in scope for 10I-E):

- `app/admin/(authed)/content/news/[contentId]/page.tsx`
- `app/admin/(authed)/content/encyclopedia/[contentId]/page.tsx`
- `app/admin/(authed)/content/qa/[contentId]/page.tsx`
- `app/admin/(authed)/market-pulse/new/page.tsx`
- `app/admin/(authed)/market-pulse/[topicId]/page.tsx`

The TranslationNotice flow already covers the **rendered** side of these
items (the public reader sees a "translation in preparation" notice when
the selected-locale body is missing).

## Date formatting

All visible dates render through helpers in
[`lib/format/date.ts`](../../lib/format/date.ts) (`formatDateAz` →
`16.05.2026`, `formatDateTimeAz` → `16.05.2026 14:30`). After Sprint 10I-D
the audit found **zero** remaining `Date.toLocaleString()` /
`Date.toLocaleDateString()` calls in `app/**/*.tsx` or `components/**/*.tsx`
used for visible rendering. Sprint 10I-E re-verified this — no
regressions. Number formatting via `Intl.NumberFormat("az-AZ")` for
currency display is acceptable — it's a number, not a date, and is not
affected by the month-name issue.

## Future rule

Once Sprint 11 ships, `npm run i18n:audit -- --check=blocking` should be
wired into CI as a failing gate (the script already supports this flag).
This document will be updated to reflect any further allowlist additions
made during that promotion.
