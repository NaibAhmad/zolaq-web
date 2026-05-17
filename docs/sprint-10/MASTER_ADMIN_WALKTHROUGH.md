# Master Admin Walkthrough — Sprint 10G

Companion to [MASTER_ADMIN_DATA_INVENTORY.md](MASTER_ADMIN_DATA_INVENTORY.md) and
[ADMIN_OPERATOR_SOP.md](ADMIN_OPERATOR_SOP.md). This document walks the founder
through every admin section, what can be entered, what fields are required,
what appears on the public side, and the common mistakes to avoid.

Scope: **local demo only**. Staging/Vercel/Supabase remain frozen (Phase A/C not
resumed). All routes below assume the dev server is running and the admin
session is authenticated via `/admin/login`.

---

## Catalog

### 1. `/admin/catalog/brands`
- **Add:** Car brand (marka).
- **Required:** `name`.
- **Optional:** `country`, `status` (active/inactive).
- **Public effect:** Powers brand chips on `/cars`, brand pages on dealer
  profiles, and brand selector on `/admin/catalog/models|generations|trims`.
- **Common mistakes:** Creating duplicate brand variants (e.g. "Toyota" and
  "TOYOTA"). The `slug` is derived from `name` — keep names canonical.

### 2. `/admin/catalog/models`
- **Add:** Model under a brand (e.g. Camry, Corolla).
- **Required:** `brand_id`, `name`.
- **Optional:** `body_type`, `status`.
- **Public effect:** Drives `model` filter on `/cars` and labels on
  `CarCard`/`CarDetail`.
- **Common mistakes:** Adding a model before its brand exists; spelling the
  model name differently from how it's referenced on trims (model is linked by
  `model_name`, not a model FK — typos break the join).

### 3. `/admin/catalog/generations`
- **Add:** Nəsil (generation, e.g. XV80 for Camry 2024–).
- **Required:** `brand_id`, `model_name`, `name`, `display_name`,
  `production_year_from`.
- **Optional:** `production_year_to`, `status`, `source`,
  `verification_status`.
- **Public effect:** Drives the **Nəsil** filter on `/cars` and the generation
  link on car detail pages.
- **Common mistakes:** Omitting `production_year_from` (the chip can't render
  without it); using a `model_name` that doesn't match the model's spelling.

### 4. `/admin/catalog/trims`
- **Add:** Komplektasiya (canonical trim row — this is the row the rest of the
  system pivots on).
- **Required:** `brand_id`, `model_name`, `year`, `display_name`,
  `energy_type`.
- **Optional:** `body_type`, `generation_id`, `power_hp`, `range_km`,
  `image_url`, `status`.
- **Edit page** (`/admin/catalog/trims/[trimId]`) also exposes the optional
  **Texniki xüsusiyyətlər** section (TrimSpec): engine, displacement, torque,
  transmission, drivetrain, seats, battery_kwh, fuel_consumption_l_100km,
  charging_ac_kw, charging_dc_kw, acceleration_0_100, ground_clearance,
  dimensions, warranty, source, verification_status.
- **Public effect:** Powers the catalog list, the **Komplektasiya** filter, the
  car detail spec card, and the trim picker on dealer offers and catalog
  prices.
- **Common mistakes:** Leaving `generation_id` blank for a trim that should
  belong to a generation (filter chips won't show it); forgetting
  `energy_type` (required); confusing `trim_id` with `generation_id` — they
  are **separate** fields and `trim_id` is the canonical reference.

### 5. `/admin/catalog/prices`
- **Add:** CatalogPrice — the **reference** market price for a trim,
  independent of any dealer.
- **Required:** `trim_id`, `amount`, `currency`.
- **Optional:** `status`, `source_type`, `source_name`,
  `verification_status`, `valid_until`.
- **Public effect:** Renders on `CarDetail`/`PriceCard` as the catalog price
  alongside dealer offers.
- **Common mistakes:** Treating catalog price as a dealer price — **do not**
  set a `dealer_id` here. Dealer-specific pricing belongs in
  `/admin/offers` (a `DealerOffer`). Catalog price and dealer offer are
  separate rows.

---

## Dealer

### 6. `/admin/dealers`
- **Add:** Dealer profile.
- **Required:** `legal_name`, `display_name`, `city`, `address`,
  `response_sla_hours`, `verification_status`.
- **Optional:** `represented_brands`, `services`, `status`, `source_name`,
  `logo_media_id`.
- **Public effect:** `/dealers` list, `/dealers/[slug]` profile, trust summary
  card, and verification badge.
- **Common mistakes:** Setting `verification_status` = verified without a
  paper trail; using `display_name` with marketing language (keep it the
  trading name).

### 7. `/admin/offers`
- **Add:** **Read-only** here. The page surfaces (a) pending submissions from
  the dealer panel and (b) all published `DealerOffer` rows for review.
  Dealers create new offers via `/dealer/offers/new`. Admins can create or
  publish on behalf of a dealer via the offer detail page.
- **Required for a DealerOffer:** `dealer_id`, `trim_id`, `amount`,
  `currency`, `stock_status`.
- **Optional:** `valid_from`, `valid_until`, `image_url`, `notes`,
  `signed_pdf_url`.
- **Public effect:** Drives the dealer offer cards on `/dealers/[slug]` and
  the price table on car detail pages.
- **Common mistakes:** Publishing a `DealerOffer` without a `trim_id` (this
  is rejected by the schema — the field is required); confusing `notes`
  for customer-facing copy (it's an internal field).

### 8. `/admin/media`
- **Add:** Image / file upload.
- **Required:** `file`, `owner_type`, `owner_id`, `alt_text`.
- **Optional:** `caption`.
- **Status workflow:** `uploaded` → `active` | `rejected` | `archived`.
- **Public effect:** Logos on dealer cards, hero images on news/encyclopedia,
  trim photos when wired via `image_url`.
- **Common mistakes:** Forgetting `alt_text` (a11y); uploading large images
  unoptimized; pointing `owner_type`/`owner_id` at an entity that doesn't
  exist yet.

---

## Content

### 9. `/admin/content/news`
- **Add:** News article.
- **Required:** `title`, `slug`.
- **Optional:** body, hero image, status (filled on the detail page).
- **Public effect:** `/news` list and `/news/[slug]` detail.
- **Common mistakes:** Using slugs with spaces or Azerbaijani characters
  (`ə`, `ı`) — keep slugs ASCII-lowercase.

### 10. `/admin/content/encyclopedia`
- **Add:** Encyclopedia entry.
- **Required:** `title`, `slug`.
- **Optional:** body, related model link, status.
- **Public effect:** `/encyclopedia` list and `/encyclopedia/[slug]` detail,
  plus the related-model badge on car detail.

### 11. `/admin/content/qa`
- **Add:** Q&A entry.
- **Required:** `question`, `answer`.
- **Optional:** category, status.
- **Public effect:** `/qa` list and search.
- **Common mistakes:** Question phrased as a statement; answer that's a single
  word — keep both useful for SEO.

### 12. `/admin/market-pulse`
- **Add:** Bazar Nəbzi topic (community poll/prediction).
- **Required:** Topic title, body, expiry date (set via
  `/admin/market-pulse/new`).
- **Public effect:** Topic feed under the Bazar Nəbzi section and home page
  module.
- **Common mistakes:** Setting expiry in the past; leaving demo topics
  unlabeled — tag demo rows in the body or notes.

---

## Commercial

### 13. `/admin/ads`
- **Add:** Ad placement requests. Create via `/admin/ads/new`.
- **Required:** Dealer, placement, period.
- **Public effect:** None until an invoice + payment land; admin-only view.

### 14. `/admin/invoices` → `/admin/invoices/new`
- **Required:** `ad_request_id`, `amount`, `due_at`.
- **Optional:** `currency` (defaults to AZN), `notes`.
- **Public effect:** None; dealer sees the invoice in their panel.

### 15. `/admin/payments`
- **Add:** **Read-only review.** Dealers upload proof; admin approves /
  rejects.
- **Public effect:** None; gates ad placement activation.
- **Common mistakes:** Approving without checking the proof file; approving
  for a dealer whose verification is pending.

### 16. `/admin/audit-log`
- **Add:** Nothing — read-only.
- **Shows:** Last 200 audit events (actor, action, entity, timestamp,
  optional `before`/`after`).
- **Use:** After every data-fill session, sanity-check that the new rows
  show up here.

---

## System

### 17. `/admin/roles`
- **Read-only.** Permission matrix sourced from
  [lib/auth/permissions.ts](../../lib/auth/permissions.ts). Use to confirm
  which role can do what before delegating data entry.

### 18. `/admin/users`
- **Read-only.** Lists current admin users. Full CRUD lands in a later
  sprint — do not block on it for the local demo.

### 19. `/admin/dashboard`
- **Read-only.** Shows pending submissions, under-review offers, pending
  dealers, draft content, recent audit events. Use it as the **start of every
  session** to spot work queues.

---

## Quick rules
- Always create FKs **before** the rows that reference them: brand → model →
  generation → trim → catalog price / dealer offer.
- `trim_id` is canonical. Dealer offers must carry one.
- `generation_id` and `trim_id` are **separate** — never confuse them.
- `CatalogPrice` and `DealerOffer` are **separate rows**. Catalog price = market
  reference. Dealer offer = a specific dealer's listing.
- Demo/staging rows should be tagged in `notes` or `source_name` so they can
  be audited later.
- Fill `source`, `verification_status`, and `last_updated` whenever possible.
