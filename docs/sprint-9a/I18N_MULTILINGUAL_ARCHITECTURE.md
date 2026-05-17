# i18n / Multilingual Architecture — Sprint 9A Addendum

**Status:** documentation-only platform-foundation addendum to Sprint 9A. Not part of Sprint 9B–9D (PASS, frozen).
**Scope:** freeze the i18n architecture (default `az`; supported `az`, `ru`, `en`) so future implementation does not require destructive schema or route reshuffles.
**Locked decisions:** Prisma + PostgreSQL (from 9A); file-based UI copy + DB-backed dynamic content + per-locale SEO metadata.
**Implementation sprint:** recommended Sprint 9F (after Sprint 9E VIN Check).

---

## 1. Why now

Zolaq targets three first-class audiences:

- **AZ** — primary market; current default in every UI surface today.
- **RU** — local automotive / dealer / service audience that natively reads Russian.
- **EN** — premium / global-grade platform quality and international reachability.

i18n is a **platform foundation** concern, not a late UI patch. Retrofitting locales after launch forces:

- Schema changes to every content table (or a join-table afterthought).
- Route restructuring (locale-prefix middleware vs. route groups) under live traffic.
- SEO regressions (broken canonicals, missing hreflang, duplicate-content penalties).
- Admin workflow churn (no tab structure, no missing-translation queue).

Freezing the architecture now lets Sprint 9B–9D ship AZ-only without painting us into a corner.

No runtime, no UI, no `lib/i18n/` directory, no `next-intl` / `i18next` / similar package install, no route changes are introduced by this addendum.

---

## 2. Locale matrix

| Locale | Code | Status | Native name | Direction |
|---|---|---|---|---|
| Azərbaycan | `az` | default | Azərbaycan dili | ltr |
| Русский | `ru` | supported | Русский | ltr |
| English | `en` | supported | English | ltr |

**Fallback chain:** `<locale> → az`. Any UI key or content row missing in the requested locale falls back to AZ — but per §5 the SEO surface for the missing locale is **suppressed**, not rendered with AZ content.

---

## 3. Translation layers (the three-layer model)

i18n in Zolaq splits cleanly into three layers. Each layer has a different storage model, a different ownership model, and a different reviewability profile.

### Layer 1 — UI copy (file-based)

**Storage:** JSON files committed to the repo.

**Planned layout** (not installed in 9A — Sprint 9F creates these):

```
lib/i18n/translations/
  common.az.json
  common.ru.json
  common.en.json
```

**Covers:**

- Buttons, menus, navigation labels.
- Filter labels, sort labels.
- Status labels mapping from `PriceStatus`, `OfferStatus`, `LeadState`, `DealerVerificationStatus`, `VinCheckStatus`, `VinRiskLevel`, `VinRiskFlag` enums to display strings.
- Error messages, validation messages.
- Lead / sorğu flow copy.
- OTP flow copy.
- Gamification copy (badge titles, point grants reasons).
- VIN check copy (advisory phrasing for risk flags — see [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md) R11.10 on trademark hygiene).

**Why file-based:** UI copy is code; it ships with the bundle, version-controlled, code-reviewed. Translators see the same diffs the engineers see. No round-trip to a DB on every page render.

### Layer 2 — Dynamic content (DB-backed)

**Storage:** `ContentTranslation` table keyed by `(content_id, locale)`.

**Covers:**

- News articles ([lib/content/types.ts](../../lib/content/types.ts) `News`).
- Encyclopedia entries (`Encyclopedia`).
- Q&A entries (`QA`).
- Bazar Nəbzi topic copy (`MarketPulseTopic` — optional, see §4).
- Community / owner-submitted content (future).
- VIN education landing pages (future).

**Why DB-backed:** content is admin-authored, frequently updated, and locale-scoped slugs need uniqueness enforcement at the database level. File-based would force a redeploy per article.

### Layer 3 — Automotive data (mixed)

Two sub-cases:

**3a. Untranslated names.** Brand and model names are typically left as-is across all three locales:

- `Toyota` → `Toyota` → `Toyota`
- `Camry` → `Camry` → `Camry`
- `BYD Han` → `BYD Han` → `BYD Han`
- `Hyundai Tucson` → `Hyundai Tucson` → `Hyundai Tucson`

**Display value === source value.** No translation row needed. Only edge cases (e.g., a brand with a meaningful Cyrillic transliteration) need an override — see §11 open question.

**3b. Spec labels translate.** Enum-driven spec labels live in `CarSpecTranslation`:

| Spec key | Spec value | AZ | RU | EN |
|---|---|---|---|---|
| `body_type` | `sedan` | Sedan | Седан | Sedan |
| `energy_type` | `HEV` | Hibrid | Гибрид | Hybrid |
| `metric` | `fuel_consumption` | Yanacaq sərfi | Расход топлива | Fuel consumption |
| `offer_source` | `official_dealer` | Rəsmi diler təklifi | Официальное предложение дилера | Official dealer offer |

The underlying enum values (the `as const` arrays in `lib/cars/types.ts`, `lib/dealers/types.ts`, etc.) **do not change**. Translations are a presentation-layer overlay.

---

## 4. Entities

Format mirrors entity descriptors in [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md). Every table has `created_at` and `updated_at` (`@db.Timestamptz(6)`) unless otherwise noted. All new IDs use `@default(cuid())` except where natural keys make sense.

### `Locale`
Closed set of supported locales.

| Field | Type | Notes |
|---|---|---|
| `locale_code` | `String @id` | natural key: `az`, `ru`, `en` |
| `name_native` | `String` | `Azərbaycan dili`, `Русский`, `English` |
| `name_english` | `String` | `Azerbaijani`, `Russian`, `English` |
| `is_default` | `Boolean` | exactly one row is `true` (= `az`) |
| `is_active` | `Boolean @default(true)` | toggles a locale off without dropping rows |
| `direction` | `String` | `ltr` for all three today |
| `created_at` / `updated_at` | | |

**Constraints:** `@@unique([is_default])` enforced via partial index (`WHERE is_default = true`).

### `TranslationKey`
Catalog of UI keys for admin tooling and missing-key audits. **The translated strings themselves stay in the JSON files** — this table just describes the key namespace.

| Field | Type | Notes |
|---|---|---|
| `key` | `String @id` | dotted path, e.g., `lead.cta.submit`, `vin.risk.flag.salvage_possible` |
| `namespace` | `String` | top-level segment for grouping |
| `description` | `String?` | context for translators |
| `surfaces` | `String[]` | list of UI surfaces using this key (e.g., `['car_detail', 'compare']`) |
| `created_at` / `updated_at` | | |

**Use:** admin tooling can show "missing in RU" by diffing this table against keys present in `common.ru.json`. Sync between JSON files and this table is a build-time check.

### `ContentTranslation`
Per-locale translation of dynamic content.

| Field | Type | Notes |
|---|---|---|
| `translation_id` | `String @id` | `ctrans_<cuid>` |
| `content_id` | `String` (FK → `Content.content_id`) | CASCADE on content delete |
| `locale` | `String` (FK → `Locale.locale_code`) | RESTRICT |
| `title` | `String` | |
| `slug` | `String` | locale-scoped |
| `summary` | `String?` | |
| `body` | `String` | full body (Markdown/HTML, matching existing content) |
| `meta_title` | `String?` | overrides `SeoMetadataTranslation` if set |
| `meta_description` | `String?` | overrides `SeoMetadataTranslation` if set |
| `status` | `String` | `draft` \| `review` \| `published` |
| `created_at` / `updated_at` | | |

**Constraints:** `@@unique([content_id, locale])`. `@@unique([locale, slug])` — slug uniqueness is per-locale, so `/ru/news/elektrikli-avtomobiller` and `/en/news/electric-cars` may both exist for the same `content_id`.

### `CarSpecTranslation`
Per-locale label for an enum-valued spec.

| Field | Type | Notes |
|---|---|---|
| `translation_id` | `String @id` | `cspec_<cuid>` |
| `spec_key` | `String` | e.g., `body_type`, `energy_type`, `transmission`, `metric` |
| `spec_value` | `String` | e.g., `sedan`, `HEV`, `automatic`, `fuel_consumption` |
| `locale` | `String` (FK → `Locale.locale_code`) | |
| `label` | `String` | the display string |
| `created_at` / `updated_at` | | |

**Constraints:** `@@unique([spec_key, spec_value, locale])`. The enum values themselves stay canonical in `lib/cars/types.ts` and the Prisma enum block — this table is a presentation overlay.

### `SeoMetadataTranslation`
Per-locale SEO metadata for static surfaces and route patterns.

| Field | Type | Notes |
|---|---|---|
| `translation_id` | `String @id` | `seo_<cuid>` |
| `surface_kind` | `String` | `page` \| `route_pattern` \| `content_type` |
| `surface_key` | `String` | e.g., `home`, `/cars`, `news` |
| `locale` | `String` (FK → `Locale.locale_code`) | |
| `meta_title` | `String` | |
| `meta_description` | `String` | |
| `og_title` | `String?` | |
| `og_description` | `String?` | |
| `canonical_path` | `String` | locale-scoped (e.g., `/ru/cars`, never bare `/cars`) |
| `created_at` / `updated_at` | | |

**Constraints:** `@@unique([surface_kind, surface_key, locale])`.

### `UserLanguagePreference`
1:1 with `User`.

| Field | Type | Notes |
|---|---|---|
| `user_id` | `String @id` (FK → `User.id`) | CASCADE on user delete |
| `locale` | `String` (FK → `Locale.locale_code`) | RESTRICT |
| `set_via` | `String` | `auto_detect` \| `manual_switch` \| `signup` |
| `updated_at` | `DateTime @updatedAt` | |

No `created_at` — `updated_at` serves both roles for this 1:1 row.

### `AdminTranslationWorkflow`
Drives the admin queue of missing / draft / stale translations.

| Field | Type | Notes |
|---|---|---|
| `workflow_id` | `String @id` | `tflow_<cuid>` |
| `entity_type` | `String` | `content` \| `car_spec` \| `seo` \| `ui_key` |
| `entity_ref` | `String` | the FK string into the relevant table (`content_id`, `spec_key:spec_value`, `surface_kind:surface_key`, `key`) |
| `locale` | `String` (FK → `Locale.locale_code`) | |
| `status` | `String` | `missing` \| `draft` \| `review` \| `published` \| `stale` |
| `assigned_admin_id` | `String?` (FK → `AdminUser.admin_id`) | nullable |
| `last_action_at` | `DateTime` | |
| `created_at` / `updated_at` | | |

**Constraints:** `@@unique([entity_type, entity_ref, locale])`. Rows are materialized by a job that scans `ContentTranslation`, `CarSpecTranslation`, `SeoMetadataTranslation`, and the UI-key JSON files against `Locale`.

### Optional future

- `CommunityTranslation` — for user-submitted community content.
- `MarketPulseTranslation` — for Bazar Nəbzi topic copy, if/when MP gains heavy editorial.
- `VinCheckCopyTranslation` — likely **not needed**: VIN advisory copy fits inside `common.<locale>.json` (Layer 1) and `SeoMetadataTranslation` (for VIN landing pages).

---

## 5. SEO / localized route strategy

### Route layout

- **Current routes remain AZ by default.** Sprint 9B–9D ship unchanged.
- **Future localized routes** add a locale prefix only for non-AZ locales:
  - `/cars` (AZ default), `/ru/cars`, `/en/cars`
  - `/news`, `/ru/news`, `/en/news`
  - `/encyclopedia/<slug>`, `/ru/encyclopedia/<slug>`, `/en/encyclopedia/<slug>`
  - `/qa`, `/ru/qa`, `/en/qa`
- AZ stays prefix-less to preserve existing inbound links, indexed URLs, and shared links (no permanent redirects).

**Implementation seam (for Sprint 9F):** locale resolution via middleware ([Next.js docs in `node_modules/next/dist/docs/`](../../node_modules/next/dist/docs/) — per AGENTS.md, read these before any code lands) sets a request locale from URL prefix → cookie → `UserLanguagePreference` → `Accept-Language` → `az`.

### `hreflang`

Every page emits:

```html
<link rel="alternate" hreflang="az" href="https://zolaq.az/..." />
<link rel="alternate" hreflang="ru" href="https://zolaq.az/ru/..." />
<link rel="alternate" hreflang="en" href="https://zolaq.az/en/..." />
<link rel="alternate" hreflang="x-default" href="https://zolaq.az/..." />
```

`x-default` always points to the AZ canonical. Locales without a `published` translation for the specific entity are **omitted** from the hreflang set (do not link to a missing or AZ-fallback page from RU/EN tags — Google will treat that as a configuration error).

### Canonical

Each locale has its own canonical:

- AZ page → `https://zolaq.az/<path>`
- RU page → `https://zolaq.az/ru/<path>`
- EN page → `https://zolaq.az/en/<path>`

**Never** canonical a localized URL back to AZ. That collapses RU/EN into AZ in the index and defeats i18n SEO entirely.

### Sitemap

One sitemap per locale:

```
/sitemap.xml          (AZ — current)
/sitemap-ru.xml
/sitemap-en.xml
/sitemap_index.xml    (indexes all three)
```

Each locale sitemap lists only URLs whose content is `published` for that locale.

### Meta title / description

Driven by `SeoMetadataTranslation` for static surfaces and `ContentTranslation.meta_title` / `meta_description` for dynamic content (with `ContentTranslation` overriding `SeoMetadataTranslation` when both exist for the same content_id+locale).

### Untranslated visibility rule

If a `content_id` has no `published` `ContentTranslation` for the requested locale, the admin chooses **per entity**:

- **Hide** (default): the locale variant returns 404, the locale is excluded from sitemap and hreflang. Preserves SEO hygiene.
- **AZ fallback with banner**: serve the AZ content with an explicit "Bu məzmun yalnız Azərbaycan dilində mövcuddur" / "Эта статья доступна только на азербайджанском" / "This article is only available in Azerbaijani" banner. Does **not** add the locale to hreflang.

Never serve machine-translated or empty pages on the public route — see §6.

---

## 6. Admin translation workflow

- **Editor UI:** every translatable entity (Content, CarSpec, SeoMetadata) gets a three-tab edit form: `AZ` · `RU` · `EN`.
- **Per-locale fields:** `title`, `slug`, `summary`, `body`, `meta_title`, `meta_description`.
- **AZ is the primary source.** AZ must be `published` before RU/EN tabs can leave `draft`.
- **RU/EN may stay `draft` until reviewed.** Drafts never appear on the public route; they appear in the admin preview and in `AdminTranslationWorkflow.status='draft'`.
- **No auto-publishing of machine-translated text.** A locale row may be machine-pre-filled, but flipping to `published` requires a human admin action and writes one `AuditLog` row (`action='content_translation_published'`).
- **Missing-translation queue:** the admin home dashboard surfaces `AdminTranslationWorkflow` rows where `status='missing'` or `status='stale'`. Stale = source AZ row updated after the locale row was last published.

---

## 7. Repository & schema impact (future Sprint 9F)

When Sprint 9F begins:

- **New repository domain:** `lib/i18n/repository.ts` following the seam pattern in [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §1. Functions: `getLocale()`, `listLocales()`, `getContentTranslation(content_id, locale)`, `upsertContentTranslation()`, `getCarSpecLabel(spec_key, spec_value, locale)`, `getSeoMetadata(surface_kind, surface_key, locale)`, `getUserLanguagePreference()`, `setUserLanguagePreference()`, `listMissingTranslations()`.
- **New schema tables:** `Locale`, `TranslationKey`, `ContentTranslation`, `CarSpecTranslation`, `SeoMetadataTranslation`, `UserLanguagePreference`, `AdminTranslationWorkflow`.
- **No modification to existing tables.** `Content`, `News`, `Encyclopedia`, `QA`, `Trim`, `Brand`, `Model`, `Dealer`, `User`, etc. are **not** altered. Their existing AZ fields remain the canonical AZ source. Translations are purely additive.
- **No new global enums.** Statuses inside i18n (`draft`/`review`/`published`/`stale`/`missing`/`auto_detect`/`manual_switch`/`signup`) live as `String` fields with TS unions in code, mirroring how `AuditAction` is handled.

---

## 8. Security & audit impact

- **Slug uniqueness is per-locale**, not global. `(locale, slug)` unique. Cross-locale slug collisions are allowed.
- **Admin edits to translations write `AuditLog` rows** with `entity_type ∈ { 'content_translation', 'car_spec_translation', 'seo_metadata_translation', 'translation_workflow' }` and `action ∈ { 'translation_drafted', 'translation_reviewed', 'translation_published', 'translation_unpublished' }` (added to the `AuditAction` set).
- **PII rules unchanged.** Translation rows MUST NOT contain user PII. The existing R1.4 banned-PII-keys rule applies to `AuditLog` payloads for translation events.
- **Public surface is read-only for translations.** Public routes never write to any `*Translation` table.
- **Locale selection writes to `UserLanguagePreference`** through the same `getSession()` boundary as other user-scoped writes; no client-side mutation of the row.

---

## 9. Open questions

1. **Locale-prefix routing strategy** — middleware redirect (single source of truth) vs. Next.js route group `app/[locale]/` (cleaner co-location, more code churn). Decision deferred to Sprint 9F.
2. **Brand-name override table** — do we need `BrandDisplayName(brand_id, locale, display_name)` for edge cases (`БМВ` vs `BMW`, `Хёндэ` vs `Hyundai`)? Probably yes for RU; not urgent for EN.
3. **Bazar Nəbzi translations in v1** — does community-poll copy need full RU/EN at launch, or is AZ-only acceptable for the v1 rollout?
4. **Translation memory / glossary** — do we maintain a TM table to enforce term consistency ("Yanacaq sərfi" always → "Расход топлива", never "Потребление топлива")?
5. **Locale switcher UX** — header dropdown vs. footer link vs. account-settings only? Affects whether `set_via='manual_switch'` is the dominant source.
6. **AZ-fallback banner copy** — exact translations subject to copywriter review.

---

## 10. Sprint recommendation

- **Sprint 9B–9D (in progress / PASS):** no i18n work. AZ-only is the correct ship state.
- **Sprint 9E:** VIN Check (see [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md)).
- **Sprint 9F:** i18n implementation following this addendum.
- **Sprint 9G+:** community translations (`CommunityTranslation`), translation memory, optional admin AI-assist on draft rows.

---

## 11. Output deliverables

1. **Files created/updated** — `docs/sprint-9a/I18N_MULTILINGUAL_ARCHITECTURE.md` (this file); `docs/sprint-9a/VIN_CHECK_ARCHITECTURE_ADDENDUM.md` (sibling); short cross-reference appends to `PRODUCTION_DATA_ARCHITECTURE.md`, `ENTITY_RELATIONSHIP_MAP.md`, `DATABASE_SCHEMA_DRAFT.md`, `ENUMS_AND_STATUS_CODES.md`, `REPOSITORY_LAYER_PLAN.md`, `SECURITY_AND_ACCESS_RULES.md`, `AUDIT_LOG_REQUIREMENTS.md`, `SPRINT_9B_IMPLEMENTATION_PLAN.md`.
2. **VIN Check architecture summary** — see [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md) §1–§3.
3. **VIN entities/enums** — see sibling doc §4, §5.
4. **VIN quota/cache/security rules** — see sibling doc §3, §6, §7.
5. **Future VIN user placement map** — see sibling doc §8.
6. **i18n architecture summary** — AZ default; RU/EN first-class; three-layer model (file-based UI, DB-backed content, mixed automotive); locale-prefix routing for non-AZ; per-locale hreflang/canonical/sitemap; admin workflow with AZ-primary, missing-queue, no auto-publish. §1–§3.
7. **i18n entities** — 7 tables (`Locale`, `TranslationKey`, `ContentTranslation`, `CarSpecTranslation`, `SeoMetadataTranslation`, `UserLanguagePreference`, `AdminTranslationWorkflow`); optional future (`CommunityTranslation`, `MarketPulseTranslation`, `VinCheckCopyTranslation`). §4.
8. **Translation layer strategy** — Layer 1 file-based UI copy (`lib/i18n/translations/common.<locale>.json`); Layer 2 DB-backed dynamic content (`ContentTranslation`); Layer 3 mixed automotive data (brand/model untranslated, specs via `CarSpecTranslation`). §3.
9. **SEO / localized route strategy** — AZ prefix-less default; `/ru/...`, `/en/...` for non-AZ; per-locale canonical (never collapse to AZ); hreflang only for `published` locales + `x-default` to AZ; per-locale sitemap indexed in `sitemap_index.xml`; per-locale meta from `SeoMetadataTranslation` / `ContentTranslation`; untranslated entities hide (default) or AZ-fallback-with-banner (per-entity opt-in). §5.
10. **Admin translation workflow** — three tabs `AZ / RU / EN` per entity; AZ primary source; RU/EN can stay `draft`; no auto-publish of machine translations; missing/stale queue via `AdminTranslationWorkflow`. §6.
11. **Repository / schema impact** — new `lib/i18n/` domain (Sprint 9F); 7 new tables; **no modification of existing tables**; no new Prisma enums. §7 (and sibling doc §10).
12. **Security / audit impact** — per-locale slug uniqueness; admin edits audited; PII rules unchanged; public surface read-only for translations. §8 (and sibling doc §6, §7).
13. **Sprint 9B / 9C recommendation** — **no i18n work in 9B / 9C / 9D**. Implement in Sprint 9F (after Sprint 9E VIN Check). §10.
14. **Open questions** — §9.
15. **Final decision: PASS.**
