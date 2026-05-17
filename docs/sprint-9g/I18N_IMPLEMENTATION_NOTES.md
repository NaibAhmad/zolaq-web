# Sprint 9G — i18n Foundation Implementation Notes

Status: **PASS** (foundation only; no UI wiring, no route changes).

Source of truth for the long-term i18n design: [docs/sprint-9a/I18N_MULTILINGUAL_ARCHITECTURE.md](../sprint-9a/I18N_MULTILINGUAL_ARCHITECTURE.md). This document records only what landed this sprint and what is intentionally deferred.

## What landed

| File | Purpose |
|------|---------|
| [lib/i18n/locales.ts](../../lib/i18n/locales.ts) | `LOCALES = ["az","ru","en"]`, `DEFAULT_LOCALE = "az"`, `isLocale()` type guard. |
| [lib/i18n/types.ts](../../lib/i18n/types.ts) | `Locale`, `TranslationDictionary` (derived from `common.az.json`), `TranslationKey` (typed `section.key` paths), `TranslationParams`. |
| [lib/i18n/t.ts](../../lib/i18n/t.ts) | Server-only `t(key, locale?, params?)`. Looks up in target locale, falls back to AZ, then to the raw key. `{name}` placeholder interpolation. |
| [lib/i18n/translations/common.az.json](../../lib/i18n/translations/common.az.json) | Source-of-truth dictionary. |
| [lib/i18n/translations/common.ru.json](../../lib/i18n/translations/common.ru.json) | RU translations of every AZ key. |
| [lib/i18n/translations/common.en.json](../../lib/i18n/translations/common.en.json) | EN translations of every AZ key. |
| [lib/i18n/index.ts](../../lib/i18n/index.ts) | Public surface: only this path should be imported from. |

### Dictionary sections (initial)

- `nav.*` — top-level navigation labels (home, cars, compare, dealers, news, encyclopedia, qa, profile, login).
- `buttons.*` — generic action buttons (search, save, cancel, submit, retry, loadMore, viewAll, viewDetails).
- `filters.*` — catalog filter labels (brand, model, generation, trim, year range, price range, energy/body type, availability, dealerVerified, sort).
- `status.*` — UI state labels (loading, empty, error, success, comingSoon).
- `auth.*` — OTP / sign-in messages (signIn, signOut, phoneRequired, codeSent, codeInvalid, codeExpired, tooManyAttempts, sessionExpired).
- `vinCheck.*` — planned keys for Sprint 9H+ (title, comingSoon, verifiedRequired, quotaExceeded).
- `gamification.*` — planned keys (pointsEarned, badgeUnlocked, levelUp).
- `price.*` — price card labels (official, market, sponsored, contactForPrice).

### Type-safety guarantee

`TranslationKey` is derived from the literal shape of `common.az.json`. Adding a key to AZ unlocks it in all `t()` calls; removing a key from AZ becomes a compile error at every call site. RU and EN dictionaries are typed against the same shape — if a key is missing in RU/EN, `t()` falls back to AZ at runtime; the gap will not break the build, but the TS shape check catches structural drift.

## What is intentionally deferred

Per user decision and per brief (*"Do NOT fully localize the app now"*, *"Do NOT add language switcher UI unless very low-risk"*):

1. **No component wiring.** No component imports `t()` this sprint. The entire app continues to use hardcoded AZ strings. This guarantees zero regression in Sprint 8H search, Lead/OTP flow, admin/dealer panels.
2. **No `<html lang>` change.** [app/layout.tsx](../../app/layout.tsx) keeps `lang="az"`.
3. **No locale-prefixed routes.** No `/ru/cars`, `/en/cars`. Routing strategy frozen in [docs/sprint-9g/SEO_LOCALE_STRATEGY.md](./SEO_LOCALE_STRATEGY.md); implementation Sprint 10+.
4. **No language switcher UI.**
5. **No DB translation models.** `Locale`, `ContentTranslation`, `SeoMetadataTranslation`, `UserLanguagePreference`, `AdminTranslationWorkflow` remain unimplemented (architecture frozen in sprint-9a doc). Adding them now would force a Prisma migration the project cannot run without a real DB.
6. **No content migration.** Brand/model/trim names stay un-translated; catalog content is AZ-only as it is today.
7. **No translation admin workflow.** AZ-only edit form remains the only path.

## Why foundation-only is safe

- All new files are unimported by any existing component. `tsc --noEmit` will type-check them but they cannot break anything that compiles today.
- No Prisma schema changes → no migration needed → DB-availability fallback unaffected.
- No env vars required for i18n this sprint.

## How to use (when wiring starts)

```ts
import { t, DEFAULT_LOCALE } from "@/lib/i18n";

const label = t("nav.cars", DEFAULT_LOCALE);
const withParam = t("auth.codeSent", "ru", { phone: "+99450..." }); // future
```

Imports are server-only (`t.ts` declares `import "server-only"`). For client components, the standard pattern will be: resolve `t()` on the server, pass the resolved string down as a prop. This avoids shipping dictionaries to the client.

## Verification

- `npm run lint` — passes (see [docs/sprint-9j/FINAL_SPRINT_9_QA.md](../sprint-9j/FINAL_SPRINT_9_QA.md)).
- `npx tsc --noEmit` — passes; `TranslationKey` derivation type-checks against `common.az.json`.
- Grep `from "@/lib/i18n"` outside `lib/i18n/` — should return zero hits this sprint.

## Open TODOs (not for this sprint)

- Wire `t()` into stable header/nav once locale-routing strategy lands.
- Add `Locale` / `ContentTranslation` / `SeoMetadataTranslation` / `UserLanguagePreference` Prisma models.
- Implement locale-prefix middleware per [SEO_LOCALE_STRATEGY.md](./SEO_LOCALE_STRATEGY.md).
- Migrate inline copy in [components/](../../components/) to `t()` calls (incremental, low-risk components first).
- Build admin translation workflow (three-tab edit form per architecture doc §7).
