# i18n Beta Scope (Sprint 10D)

Defines exactly which surfaces are wired to the new client-side i18n layer in
Sprint 10D and which stay AZ-only until a later sprint.

## Flag

`NEXT_PUBLIC_FEATURE_I18N_BETA=true` (in `.env.local` for local demo). Default
false everywhere — production is unaffected.

## Wired this sprint (translated)

| Surface | File | Keys |
| --- | --- | --- |
| Header nav (Maşınlar, Müqayisə, Dilerlər, Xəbərlər, Ensiklopediya, Q&A) | [components/layout/Header.tsx](../../components/layout/Header.tsx) | `nav.cars`, `nav.compare`, `nav.dealers`, `nav.news`, `nav.encyclopedia`, `nav.qa` |
| Header language selector | [components/i18n/LanguageSelector.tsx](../../components/i18n/LanguageSelector.tsx) | n/a (button labels are 2-letter codes) |
| Homepage Quick Search eyebrow + title | [components/home/HomeSearchBlock.tsx](../../components/home/HomeSearchBlock.tsx) | `home.quickSearchEyebrow`, `home.quickSearchTitle` |

Dictionaries: [lib/i18n/translations/common.{az,ru,en}.json](../../lib/i18n/translations).
Client lookup helper: [lib/i18n/client.tsx](../../lib/i18n/client.tsx) (`useT()`,
`useLocale()`, `<LocaleProvider>`). Server `t()` from `lib/i18n/t.ts` is
unchanged.

Persistence: selected locale is saved to `localStorage` under key `zolaq-locale`.

## NOT wired this sprint (still AZ literals)

These surfaces are intentionally left as Sprint 11 follow-up. The rule is
"only wire surfaces the founder will demo this week" — every other AZ string
in the app stays exactly as-is.

- `components/layout/MobileBottomNav.tsx` — bottom nav labels (`Ana`, `Maşın`, …)
- `components/layout/Footer.tsx`
- `components/home/HomeTrustStrip.tsx`, `HomeDecisionHelper`, `HomeCatalogTeaser`, `HomeContentTeaser`, `HomeMarketPulse`, `HomeDealerTeaser`, `HomeHero`
- All `/cars` catalog page filters and result chrome
- All `/compare`, `/dealers`, `/news`, `/encyclopedia`, `/qa` public pages
- All `/profile/*` pages (incl. `Nişanlarım`, `Qərar tarixçəsi`, `Bazar Nəbzi və nişan fəaliyyəti`)
- All `/dealer/*` and `/admin/*` panels
- All form labels in `components/leads/`, `components/decisions/`, `components/auth/OtpForm.tsx`
- Status / error / loading copy in `components/state/`
- VIN beta card and modal copy (Sprint 10D Section C uses inline AZ literals
  by design — switching VIN copy to dictionary keys is a Sprint 11 task)

## Forbidden in this sprint

- No `/ru` or `/en` route segments. No locale-prefixed routes.
- No middleware locale redirect. No `Accept-Language` parsing.
- No SEO `hreflang` tags.
- No translation of brand or model names.
- No new translation keys outside what's listed in the "Wired this sprint" table.

## How a future sprint extends this

1. Add new keys to `lib/i18n/translations/common.az.json` first (AZ is the
   source of truth and the type derives from it — adding to AZ unlocks the key
   in `TranslationKey`).
2. Add matching keys to `common.ru.json` and `common.en.json`. Missing keys in
   RU/EN fall back to AZ automatically.
3. In the target component:
   - If it's already inside a `LocaleProvider` (currently only routes under
     `app/(public)/layout.tsx` with the flag on), call `useT()` directly.
   - Otherwise, wrap the relevant subtree in `<LocaleProvider>` first.
4. Keep the static-fallback subcomponent pattern from
   [components/layout/Header.tsx](../../components/layout/Header.tsx) — when
   the flag is off, the file should render identically to today.

## Verification with the flag on

- `npm run dev` with `NEXT_PUBLIC_FEATURE_I18N_BETA=true` and reload `/`.
- Header shows AZ/RU/EN buttons after `Theme` toggle.
- Click `RU` → nav labels switch to Russian; Quick Search title/eyebrow switch.
- Reload page → selection persists (localStorage).
- Click `EN` → switches to English. Click `AZ` → returns to source labels.
- Switch to a page outside the wired surfaces (e.g. `/cars`) → only the Header
  is translated; the rest stays AZ. This is the documented current scope.
