# i18n Governance — No Hardcoded UI Copy

Sprint 10I-C, 2026-05-18. Author: i18n governance.
Sprint 10I-D update (same day): added `LocalizedText` content layer,
`TranslationNotice` fallback, and a calibrated stance on admin/dealer
operator panels.

## Why this document exists

Each sprint we add features and each sprint we keep finding visible Azerbaijani
strings that don't move with the language selector. Sprint 10I-C exists to
close the current backlog and codify the rule so it doesn't keep returning
before Wave 0 / First 100.

The rule is simple: **no visible user-facing copy in code**. Every string a
user sees has to come from `lib/i18n/translations/common.{az,en,ru}.json` or
from a localized helper for content-driven values.

## Locales

- `az` — default and source of truth.
- `en` — translation target.
- `ru` — translation target.

`az` is the canonical key set. The TypeScript type
[`TranslationKey`](../../lib/i18n/types.ts) is derived from `common.az.json`,
so adding/renaming a key in AZ updates compile-time checks at every call site.

`en` and `ru` must mirror the AZ key set exactly. The audit script
(`npm run i18n:audit`) and the type system together catch divergence.

## Rules

1. **AZ is the source of truth.** Add the AZ value first; translate to EN
   and RU before merging.
2. **Every visible UI label must have an `az`, `en`, and `ru` entry.** No
   partial entries — a key without all three locales is a bug.
3. **No hardcoded user-facing text in components or pages.** This includes
   public UI, profile, dealer panel, and admin/master panel.
4. **Brand, model, generation, trim, and dealer names are not translated.**
   They are proper nouns. Render them straight from data.
5. **Technical units are not translated.** `km`, `kW`, `kWh`, `HP`, `AZN`.
6. **Phone number placeholders are not translated.** `+994501234567` is
   format guidance, not copy.
7. **Admin / dealer operator panels remain AZ-first operationally.** The
   operator workforce is AZ-native; the language selector is a customer
   feature. Sprint 10I-D explicitly chose to keep admin/dealer/auth/leads
   panels rendering AZ until a dedicated translation sweep ships. Where the
   panels share components with public surfaces (status badges, label
   tables), those shared paths translate. The chrome of the panels — page
   titles, nav, table headings — already has dictionary keys (`adminNav.*`,
   `dealerNav.*`, etc.); use them when adding new admin/dealer surfaces.
   Sprint B1/B2 will close the remaining admin/dealer hardcoded strings.
8. **Dynamic / seeded content uses a localized helper.** When a value comes
   from data rather than the dictionary (e.g. Bazar Nəbzi questions, option
   labels, content-teaser categories, news/encyclopedia/QA seed entries),
   store it as `LocalizedText` — `string | {az, en, ru}` — and render
   through [`getLocalizedText`](../../lib/i18n/localized.ts). Plain strings
   pass through unchanged (used for proper nouns); objects look up the
   locale with AZ fallback.
8a. **Missing translations surface a calm notice, never a fake.** When
    `hasLocalizedText(value, locale)` is false for the active locale, render
    [`TranslationNotice`](../../components/i18n/TranslationNotice.tsx) (or
    its wrapper [`LocalizedContentBlock`](../../components/content/LocalizedContentBlock.tsx)).
    The notice button switches to a "translation in preparation" message
    locally — no network call, no auto-translation. Seed authors should
    add the EN/RU value rather than relying on this notice.
8b. **Lookup tables grow EN/RU siblings, not call-site refactors.** Existing
    `*_LABELS_AZ` tables (lead state, decision history event, dealer
    verification, encyclopedia category, etc.) stay as AZ source of truth.
    Add `*_LABELS_EN` / `*_LABELS_RU` siblings and a `xLabel(value, locale)`
    helper next to them. Update consumer call sites to pass the active
    locale through; the AZ table is the fallback in the helper, not a
    parallel render path.
9. **Missing keys fall back to AZ.** Both server `t()` and client `useT()`
   resolve to AZ when the target locale lacks a key. This is a safety net,
   not a feature — visible demo surfaces must not be allowed to fall back.
10. **New features add translation keys before acceptance.** If a PR adds
    visible copy, the dictionary diff is part of the same PR.
11. **PR self-check.** Before pushing: open the diff, search for raw AZ /
    RU / EN strings inside JSX, ensure each became a `t("section.key")` or
    a `getLocalizedText(value, locale)` call.

## Helpers and patterns

Client components — always available, falls back to AZ if `LocaleProvider`
isn't mounted:

```tsx
"use client";
import { useT } from "@/lib/i18n/client";

export function Example() {
  const t = useT();
  return <button>{t("actions.save")}</button>;
}
```

Server components — read locale from the `zolaq-locale` cookie:

```tsx
import { getServerT } from "@/lib/i18n/server";

export default async function Page() {
  const t = await getServerT();
  return <h1>{t("nav.cars")}</h1>;
}
```

Data-driven / seed content:

```ts
import { getLocalizedText } from "@/lib/i18n/localized";

const title = getLocalizedText(topic.question, locale);
```

Dates — always go through [`lib/format/date.ts`](../../lib/format/date.ts).
Never use `Date.toLocaleString()` / `Date.toLocaleDateString()` in visible
rendering. The native formatters can produce `2026 M05 16`-style output in
some Node/browser builds and break date display for users.

```ts
import { formatDateAz, formatDateTimeAz } from "@/lib/format/date";

formatDateAz(value);       // 16.05.2026
formatDateTimeAz(value);   // 16.05.2026 14:30
```

## Dictionary structure

Two-level keys: `section.leaf`. New conceptual groups become new top-level
sections (e.g. `homeHero.title`, `adminCatalog.brandName`) rather than
introducing a third level. The type system depends on this shape.

Standard groups in use after Sprint 10I-C:

- Generic chrome: `nav`, `buttons`, `actions`, `filters`, `status`, `common`,
  `forms`, `errors`, `dates`.
- Auth & gamification: `auth`, `gamification`, `vinCheck`, `vinBeta`,
  `betaInvite`.
- Public surfaces: `home`, `homeHero`, `homeTrust`, `homeDecision`,
  `homeSelectedCars`, `homeMarketPulse`, `homeContent`, `quickSearch`,
  `catalogFilters`, `catalogCard`, `carDetail`, `price`, `ads`, `bazar`, `qa`,
  `content`, `compare`, `vin`, `decisions`, `dealerTrust`, `leadsTimeline`,
  `leads`, `search`, `footer`, `bazar`.
- Profile: `profile`, `profileLeads`, `profileHistory`, `profileBadges`,
  `profileSaved`, `profileViewed`, `profileDecisions`.
- Dealer panel: `dealerNav`, `dealerDashboard`, `dealerProfile`,
  `dealerOffers`, `dealerMedia`, `dealerSubmissions`, `dealerLeads`,
  `dealerTestDrives`, `dealerAds`, `dealerInvoices`, `dealerPayments`.
- Admin panel: `adminNav`, `adminDashboard`, `adminCatalog`, `adminDealers`,
  `adminContent`, `adminCommercial`, `adminAudit`, `adminRoles`, `adminUsers`,
  `adminLeads`.

Sprint 10I-D added groups (mirrored across `az`/`en`/`ru`):

- `translationNotice` — the "translation in preparation" fallback copy.
- `homeDecisionHelper`, `homeDealerTeaser`, `homeContentTeaser`,
  `homeCatalogTeaser` — full home block translations.
- `carsList`, `compareHero`, `dealersHero`, `dealerCard`,
  `dealerVerification`, `newsHero`, `contentCard`, `encyclopediaHero`,
  `encyclopediaCategories` — public surfaces previously rendered with raw
  AZ literals.
- `profileHistoryExtra`, `profileBadgesExtra`, `profileSavedExtra`,
  `profileViewedExtra` — extension keys for the profile pages.
- `decisionEvents`, `decisionStatus`, `readinessFactors`, `nextBestAction`,
  `leadStates`, `leadStateDescriptions`, `leadSourceSurfaces`, `activity`,
  `badgesCatalog`, `pointActions`, `qaDetail` — formerly AZ-only lookup
  tables and gamification copy.

## Out of scope (intentional)

- Public `/ru` and `/en` routes — not added; the single canonical route set
  serves all three locales.
- SEO `hreflang` / `canonical` annotations — deferred.
- Author-written content bodies (news article body, encyclopedia article
  body) — surrounding chrome is translated; the prose itself stays as the
  source language and is documented in
  [`I18N_AUDIT_RESULTS.md`](./I18N_AUDIT_RESULTS.md).
- Auto-translation of live user-generated content — never.
- The single AZ string operators type into the admin market-pulse "new"
  topic form — operators enter the source value; localization happens in
  the seed file and the helper layer.

## Future plan

Sprint 11+: promote `npm run i18n:audit` from warning to failing CI gate
once the new feature pipeline has a few sprints of clean signal.
