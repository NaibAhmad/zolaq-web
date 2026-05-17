# Sprint 9G — SEO + Locale Routing Strategy (Planning Doc)

This is a **planning document**. No code changes from this doc landed in Sprint 9G. Implementation is targeted for Sprint 10+, after content translations exist and a language switcher is decided.

Reference: [docs/sprint-9a/I18N_MULTILINGUAL_ARCHITECTURE.md](../sprint-9a/I18N_MULTILINGUAL_ARCHITECTURE.md) §4–§6.

## Locale routing

- **AZ (default):** prefix-less. `/`, `/cars`, `/dealers/[id]`, etc. — current production URLs unchanged.
- **RU:** `/ru/...` prefix. e.g., `/ru/cars`, `/ru/dealers/[id]`.
- **EN:** `/en/...` prefix.

**Why prefix-less for AZ:** preserves existing inbound links and search rankings. Migrating AZ under `/az/...` would invalidate the entire current sitemap.

**Implementation sketch (deferred):**
- Next.js middleware at [middleware.ts](../../middleware.ts) (does not exist yet) detects locale from URL prefix.
- Unknown prefixes fall through to AZ to avoid 404 churn during rollout.
- Locale is passed down via a server-side context (App Router layout); no client cookie required for static prefixes.

## hreflang

Per Google guidance, every translated page emits:

```html
<link rel="alternate" hreflang="az" href="https://zolaq.az/cars/{slug}" />
<link rel="alternate" hreflang="ru" href="https://zolaq.az/ru/cars/{slug}" />
<link rel="alternate" hreflang="en" href="https://zolaq.az/en/cars/{slug}" />
<link rel="alternate" hreflang="x-default" href="https://zolaq.az/cars/{slug}" />
```

- `x-default` points to AZ.
- A locale variant is emitted **only if** that locale has a non-empty translation for the page (`ContentTranslation` row exists). Empty translations must not be linked — Google treats them as duplicate content.

## Canonical

Each locale page is self-canonical (`<link rel="canonical" href="<self>">`). Never canonicalize a translated page back to AZ — that would tell Google to drop the translation from the index.

## Locale sitemap

Three sitemap files served at `/sitemap-az.xml`, `/sitemap-ru.xml`, `/sitemap-en.xml`, indexed by `/sitemap.xml`.

- AZ sitemap: all pages (current behavior).
- RU sitemap: only pages with at least one RU `ContentTranslation`.
- EN sitemap: only pages with at least one EN `ContentTranslation`.

## Untranslated content rules

- Public list pages (`/ru/cars`, `/en/cars`) **must** show content if at least the AZ source is published; brand/model names render in their original Latin spelling (Toyota, Camry, etc.) without translation.
- Detail pages without a target-locale `ContentTranslation` row fall back to AZ body but keep target-locale `<html lang>` — never render an empty `<main>`.
- Editorial content (news, encyclopedia) with no translation is **excluded** from RU/EN sitemaps but still reachable via direct URL with a visible "Translation pending" banner.

## Admin SEO workflow (deferred)

- Per-locale `SeoMetadataTranslation` rows control `<title>`, `<meta name="description">`, OG tags.
- Missing translation → fall back to AZ metadata + add `<meta name="robots" content="noindex">` for that locale.

## Decisions locked

- Default locale: AZ.
- Locale order: AZ → RU → EN (display order in switcher, when added).
- Brand/model names: never translated.
- Specs values (e.g., "automatic"): translated via `CarSpecTranslation` keys, not free-text per spec.
- VIN, registration codes, money formats: never translated.

## What this sprint did not do

- No middleware.
- No sitemap routes.
- No hreflang tags.
- No `<html lang>` switching.
- No `ContentTranslation` model.

All deferred to Sprint 10+ when content is actually translated.
