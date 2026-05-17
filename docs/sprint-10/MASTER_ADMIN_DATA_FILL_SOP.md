# Master Admin Data-Fill SOP — Sprint 10G

Step-by-step procedure for the founder to enter real data via the Master Admin
panel **locally**. Pair this SOP with
[MASTER_ADMIN_WALKTHROUGH.md](MASTER_ADMIN_WALKTHROUGH.md) (per-section
reference) and [ADMIN_OPERATOR_SOP.md](ADMIN_OPERATOR_SOP.md) (role/permission
context).

Scope: **local only**. Staging/Vercel/Supabase remain frozen. Do not run
Phase A/C, do not run real migrations.

---

## Invariants (always true)

- **`trim_id` is the canonical reference** across the catalog. Every dealer
  offer and every catalog price must resolve to a `trim_id`.
- **`generation_id` and `trim_id` are separate.** A generation is a model-year
  family; a trim is one specific komplektasiya. Never substitute one for the
  other.
- **A `DealerOffer` must reference a `trim_id`.** The schema rejects missing
  trim ids.
- **`CatalogPrice` and `DealerOffer` are separate rows.** Catalog price is the
  market reference for a trim; dealer offer is a specific dealer's listing.
- **Tag demo/staging rows** in `notes` or `source_name` (e.g. `DEMO`,
  `STAGING-SEED`) so production audit can filter them out.
- **Fill `source`, `verification_status`, and `last_updated`** whenever a real
  external source exists.

---

## Session start

1. Run `npm run dev`.
2. Open `/admin/login` and sign in (use the DEV mock role picker in local
   mode).
3. Open `/admin/dashboard` to see pending submissions / drafts. Start each
   data-fill session here.

---

## 1. Add brand

- **URL:** `/admin/catalog/brands`
- **Prerequisites:** none.
- **Required:** `name`.
- **Optional:** `country`, `status` (active/inactive).
- **Audit:** entry with `action=create`, `entity_type=brand`.
- **Common mistakes:** duplicate variants (`Toyota` vs `TOYOTA`); the slug is
  derived from name — keep names canonical.

## 2. Add model

- **URL:** `/admin/catalog/models`
- **Prerequisites:** brand exists (step 1).
- **Required:** `brand_id`, `name`.
- **Optional:** `body_type`, `status`.
- **Audit:** `action=create`, `entity_type=model`.
- **Common mistakes:** mis-spelling `name` — trims reference it as
  `model_name`; a typo here breaks the join.

## 3. Add generation (Nəsil)

- **URL:** `/admin/catalog/generations`
- **Prerequisites:** brand + model exist (steps 1–2).
- **Required:** `brand_id`, `model_name`, `name`, `display_name`,
  `production_year_from`.
- **Optional:** `production_year_to`, `status`, `source`,
  `verification_status`.
- **Audit:** `action=create`, `entity_type=generation`.
- **Common mistakes:** mismatched `model_name` (use the exact string from step
  2); omitting `production_year_from`.

## 4. Add trim (Komplektasiya)

- **URL:** `/admin/catalog/trims`
- **Prerequisites:** brand + model exist; generation if applicable.
- **Required:** `brand_id`, `model_name`, `year`, `display_name`,
  `energy_type`.
- **Optional:** `body_type`, `generation_id`, `power_hp`, `range_km`,
  `image_url`, `status`.
- **Audit:** `action=create`, `entity_type=trim`. The returned `trim_id` is
  what every downstream row will reference.
- **Common mistakes:** leaving `generation_id` blank when a generation
  exists; confusing `trim_id` with `generation_id`; missing
  `energy_type`.

## 5. Add advanced specs (TrimSpec)

- **URL:** `/admin/catalog/trims/[trimId]` → open the **Texniki
  xüsusiyyətlər** section.
- **Prerequisites:** trim exists (step 4).
- **All optional**, but fill what you can: `engine`,
  `engine_displacement_l`, `torque_nm`, `transmission`, `drivetrain`, `seats`,
  `battery_kwh`, `fuel_consumption_l_100km`, `charging_ac_kw`,
  `charging_dc_kw`, `acceleration_0_100`, `ground_clearance`, `dimensions`,
  `warranty`, `source`, `verification_status`.
- **Audit:** `action=update`, `entity_type=trim` (specs live on the trim).
- **Common mistakes:** mixing units (HP vs kW; L vs ml); leaving
  `verification_status` blank when there is a clear source.

## 6. Add catalog price

- **URL:** `/admin/catalog/prices`
- **Prerequisites:** trim exists (step 4).
- **Required:** `trim_id`, `amount`, `currency`.
- **Optional:** `status`, `source_type`, `source_name`,
  `verification_status`, `valid_until`.
- **Audit:** `action=create`, `entity_type=catalog_price`.
- **Common mistakes:** setting a `dealer_id` (catalog price has no dealer);
  treating this as a dealer listing (use step 8 instead).

## 7. Add dealer

- **URL:** `/admin/dealers`
- **Prerequisites:** none.
- **Required:** `legal_name`, `display_name`, `city`, `address`,
  `response_sla_hours`, `verification_status`.
- **Optional:** `represented_brands`, `services`, `status`, `source_name`,
  `logo_media_id`.
- **Audit:** `action=create`, `entity_type=dealer`.
- **Common mistakes:** marking `verified` without paperwork; using a
  marketing tagline as `display_name` — keep it the trading name.

## 8. Add dealer offer

- **URL:** Admin can publish/edit at `/admin/offers/[offerId]`. Dealers
  themselves create offers at `/dealer/offers/new`.
- **Prerequisites:** dealer (step 7) **and** trim (step 4).
- **Required:** `dealer_id`, **`trim_id`**, `amount`, `currency`,
  `stock_status` (available / order / coming_soon / not_available).
- **Optional:** `valid_from`, `valid_until`, `image_url`, `notes`,
  `signed_pdf_url`.
- **Audit:** `action=create`, `entity_type=dealer_offer`.
- **Common mistakes:** missing `trim_id` (schema rejects it); using `notes`
  for customer-facing copy (internal field).

## 9. Upload media

- **URL:** `/admin/media`
- **Prerequisites:** the owner entity (dealer/news/etc.) exists.
- **Required:** `file`, `owner_type`, `owner_id`, `alt_text`.
- **Optional:** `caption`.
- **Status workflow:** `uploaded` → `active` | `rejected` | `archived` — flip
  to `active` once reviewed.
- **Audit:** `action=create`, `entity_type=media_asset`.
- **Common mistakes:** skipping `alt_text` (a11y); uploading unoptimized
  images; owner pointer to a non-existent entity.

## 10. Add news article

- **URL:** `/admin/content/news` → opens edit page at
  `/admin/content/news/[contentId]`.
- **Required:** `title`, `slug`.
- **Optional:** body, hero image, status.
- **Audit:** `action=create`, `entity_type=content_news`.
- **Common mistakes:** non-ASCII slugs; missing hero image on a featured
  article.

## 11. Add encyclopedia entry

- **URL:** `/admin/content/encyclopedia` → `/admin/content/encyclopedia/[contentId]`.
- **Required:** `title`, `slug`.
- **Optional:** body, related model link, status.
- **Audit:** `action=create`, `entity_type=content_encyclopedia`.
- **Common mistakes:** duplicate slugs between encyclopedia and news.

## 12. Add Q&A

- **URL:** `/admin/content/qa`
- **Required:** `question`, `answer`.
- **Optional:** category, status.
- **Audit:** `action=create`, `entity_type=content_qa`.
- **Common mistakes:** question phrased as a statement; one-word answers.

## 13. Add Bazar Nəbzi topic

- **URL:** `/admin/market-pulse/new`
- **Required:** title, body, expiry date.
- **Optional:** category, related trim/model.
- **Audit:** `action=create`, `entity_type=market_pulse_topic`.
- **Common mistakes:** expiry in the past; demo topic not tagged.

## 14. Review audit log

- **URL:** `/admin/audit-log`
- **What to verify after each session:**
  - Every new row in steps 1–13 has a corresponding audit entry.
  - `actor_id` matches the admin user you logged in as.
  - `before`/`after` JSON is populated on updates.
- If an entry is missing, the data probably didn't save — re-open the entity
  edit page and resubmit.

---

## Session close

1. Open `/admin/dashboard` and confirm pending queues are empty (or
   intentional).
2. Open public mirrors of what you added:
   - new trim → `/cars` filter chip
   - new dealer offer → `/dealers/[slug]`
   - new content → `/news` | `/encyclopedia` | `/qa` | Bazar Nəbzi
3. Record any issues in
   [FOUNDER_LOCAL_QA_SHEET.md](FOUNDER_LOCAL_QA_SHEET.md).
