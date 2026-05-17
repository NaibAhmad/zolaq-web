# VIN Check / Vehicle History — Sprint 9A Addendum

**Status:** documentation-only addendum to Sprint 9A. Not part of Sprint 9B–9D (PASS, frozen).
**Scope:** freeze the data + security architecture for a future Zolaq VIN Check feature.
**Locked decisions:** the addendum follows Sprint 9A's architectural choices — Prisma + PostgreSQL, single canonical `AuditLog` table, R-numbered security rules, repository-seam pattern.
**Implementation sprint:** recommended Sprint 9E (after 9B–9D cutover).

---

## 1. Why now

Zolaq VIN Check is a future **Growth + Trust** layer aimed at users browsing US-imported cars. The feature is naturally adjacent to several existing surfaces (car detail, offer detail, profile, content), and its data shape — user-scoped quota, cache reuse, provider abstraction, raw-vs-public DTO split — is **not** something we can retrofit safely after the first UI ships.

We are freezing the architecture in 9A so that:

- The boundary between **raw provider data (server-only)** and **public summary DTO (client-safe)** is correct from day one.
- The boundary between **VIN check signals** and **dealer pricing / official offer verification / recommendation score** is **strict and one-way** — a VIN result must never alter a price or verification status.
- Server-side quota, cache reuse, abuse protection, and audit are designed as platform primitives, not bolted on after launch.
- The legal naming surface is locked: **never** "Free Carfax" or similar trademarked phrasing.

No runtime, no UI, no provider integration, no `lib/vin-check/` directory, no routes are introduced by this addendum.

---

## 2. Product purpose & naming

VIN Check is a **trust/risk signal** about a specific physical vehicle (typically a US-imported car identified by its VIN). It is **not** a dealer-pricing feature, **not** a recommendation feature, **not** part of the official-offer flow.

**Allowed names** (public-facing):

- Zolaq VIN Check
- Vehicle History Check
- Avtomobil tarixçəsi yoxlaması
- VIN üzrə risk yoxlaması

**Hard rule (R11.10):** Do **not** use "Free Carfax", "Carfax", "AutoCheck", or any other trademarked partner name in UI copy, marketing copy, SEO metadata, or admin tooling **unless** a licensed partnership is signed. Internal comments may reference providers; user-facing text may not.

---

## 3. Architectural pillars

The future VIN Check feature MUST be built on top of these primitives:

1. **Verified-user gate** — reuses the existing OTP/phone-verified `User`; no anonymous VIN checks.
2. **Server-side quota** — suggested launch limit: **2 basic checks / user / calendar month**, enforced via `VinCheckQuota` (not client-side counters).
3. **VIN validation** — 17-character ISO 3779 format check + checksum + region/year sanity before any provider call (rejects junk before consuming quota).
4. **Provider abstraction** — provider chosen via `VinCheckProvider` table (`priority`, `active`). The route handler never hard-codes a provider; the repository selects by policy.
5. **Cache reuse** — repeat lookups for the same `(vin_hash, report_type)` within the cache window serve from `VinCheckCache` and **do not consume quota**.
6. **Audit logging** — every status transition, every credit grant, every credit consumption writes a row to the canonical `AuditLog` table (same `$transaction` as the data write — see [AUDIT_LOG_REQUIREMENTS.md](AUDIT_LOG_REQUIREMENTS.md) A1).
7. **Abuse / rate-limit protection** — per-user, per-IP, per-device limits; suspicious patterns route requests to `blocked`.
8. **Raw provider data is server-only** — only `VinCheckResult.summary_dto_json` may cross the wire to a client.
9. **Public summary DTO** — small, fixed-shape, no provider names, no raw payload, no PII.
10. **Future paid full report** — `vin_report_type='full'` and `'promo_full'` reserved.
11. **Future dealer bulk** — `vin_report_type='dealer_bulk'` reserved; uses a separate credit pool, never the user `monthly_free` quota.

---

## 4. Entities

Format mirrors entity descriptors in [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md). All new IDs use `@default(cuid())`. Every table has `created_at` and `updated_at` (`@db.Timestamptz(6)`) unless otherwise noted.

### `VinCheckRequest`
The lifecycle anchor for a single VIN check attempt.

| Field | Type | Notes |
|---|---|---|
| `request_id` | `String @id` | `req_<cuid>` |
| `user_id` | `String` (FK → `User.id`) | RESTRICT — request retained on user delete only via tombstone policy (see §7) |
| `vin_hash` | `String` | **server-only**; SHA-256 with `VIN_HASH_SALT` env var |
| `vin_last4` | `String(4)` | display-only fragment for the UI history list |
| `report_type` | `VinReportType` enum | `basic` \| `full` \| `promo_full` \| `dealer_bulk` |
| `status` | `VinCheckStatus` enum | see §5 — state machine |
| `provider_id` | `String?` (FK → `VinCheckProvider.provider_id`) | nullable until `provider_pending`; **server-only** column |
| `cache_hit_id` | `String?` (FK → `VinCheckCache.cache_id`) | non-null when served from cache |
| `quota_source` | `QuotaSource` enum | `monthly_free` \| `bonus` \| `promo` \| `admin_grant` \| `paid` |
| `requested_at` | `DateTime` | first transition out of `draft` |
| `completed_at` | `DateTime?` | set on `completed` / `failed` / `blocked` / `expired` |
| `created_at` | `DateTime @default(now())` | |
| `updated_at` | `DateTime @updatedAt` | |

**Audit:** every status transition writes one `AuditLog` row in the same `$transaction`. **Server-only fields:** `vin_hash`, `provider_id`.

### `VinCheckResult`
One result per completed request. Holds both the server-only raw provider payload and the public-safe summary.

| Field | Type | Notes |
|---|---|---|
| `result_id` | `String @id` | `vres_<cuid>` |
| `request_id` | `String @unique` (FK → `VinCheckRequest.request_id`) | 1:1 |
| `risk_level` | `VinRiskLevel` enum | `unknown` \| `low` \| `medium` \| `high` \| `critical` |
| `summary_dto_json` | `Json` | **public-safe**; client-visible DTO (risk_level, flags, normalized fields) |
| `raw_provider_payload` | `Json` | **server-only**; never serialized by any public route |
| `flags` | `VinRiskFlag[]` | array of enum values; see §5 |
| `expires_at` | `DateTime` | aligns with `VinCheckCache.expires_at` |
| `created_at` | `DateTime @default(now())` | |

**Audit:** creation of a result writes one `AuditLog` row (`action='vin_check_completed'`).
**Server-only fields:** `raw_provider_payload`, `provider_id` (via join), provider names, internal cost.

### `VinCheckProvider`
Catalog of providers behind the abstraction.

| Field | Type | Notes |
|---|---|---|
| `provider_id` | `String @id` | `prov_<cuid>` |
| `name` | `String` | internal name; never in public copy |
| `kind` | `String` | `partner_api` \| `internal_heuristic` \| `manual_admin` |
| `base_url` | `String?` | env-overridable |
| `auth_kind` | `String` | `bearer` \| `hmac` \| `none` |
| `active` | `Boolean @default(true)` | |
| `priority` | `Int` | lower wins |
| `cost_per_basic` | `Decimal?` | accounting only |
| `cost_per_full` | `Decimal?` | accounting only |
| `created_at` / `updated_at` | | |

**Server-only.** No public route ever reads this table.

### `VinCheckQuota`
Per-user, per-calendar-month quota counter. One row per `(user_id, month_anchor)`.

| Field | Type | Notes |
|---|---|---|
| `quota_id` | `String @id` | `vquota_<cuid>` |
| `user_id` | `String` (FK → `User.id`) | CASCADE on user delete |
| `month_anchor` | `DateTime` | first-of-month UTC |
| `basic_used` | `Int @default(0)` | |
| `basic_limit` | `Int @default(2)` | launch default |
| `full_used` | `Int @default(0)` | |
| `full_limit` | `Int @default(0)` | full reports require credit, not free quota |
| `created_at` / `updated_at` | | |

**Constraints:** `@@unique([user_id, month_anchor])`. Incremented inside the same `$transaction` as the `VinCheckRequest` status transition to `quota_checked`. Cache hits **must not** increment.

### `VinCheckCredit`
Non-monthly credit pool — bonuses, promos, admin grants, paid credits, and dealer-bulk pool.

| Field | Type | Notes |
|---|---|---|
| `credit_id` | `String @id` | `vcred_<cuid>` |
| `user_id` | `String` (FK → `User.id`) | nullable for dealer-pool credits owned by a `Dealer` (see §7) |
| `dealer_id` | `String?` (FK → `Dealer.dealer_id`) | mutually exclusive with `user_id` |
| `report_type` | `VinReportType` enum | what this credit unlocks |
| `source` | `QuotaSource` enum | `bonus` \| `promo` \| `admin_grant` \| `paid` (never `monthly_free`) |
| `granted_by` | `String?` | `AdminUser.admin_id` when source = `admin_grant` |
| `consumed_at` | `DateTime?` | set on consumption |
| `consumed_by_request_id` | `String?` (FK → `VinCheckRequest.request_id`) | which request consumed this credit |
| `expires_at` | `DateTime` | |
| `note` | `String?` | admin context |
| `created_at` / `updated_at` | | |

**Audit:** grant writes `AuditLog` `action='vin_credit_granted'`; consume writes `action='vin_credit_consumed'`.

### `VinCheckCache`
Deduplicates lookups by `(vin_hash, report_type)`.

| Field | Type | Notes |
|---|---|---|
| `cache_id` | `String @id` | `vcache_<cuid>` |
| `vin_hash` | `String` | **server-only**; same hash as `VinCheckRequest.vin_hash` |
| `report_type` | `VinReportType` enum | |
| `result_id` | `String` (FK → `VinCheckResult.result_id`) | the canonical result row |
| `expires_at` | `DateTime` | TTL per `report_type` (see §11 open questions) |
| `hit_count` | `Int @default(0)` | bumped on every cache hit; **does not** affect quota |
| `created_at` / `updated_at` | | |

**Constraints:** `@@unique([vin_hash, report_type])`. Read path: any pre-flight that finds a fresh row serves the linked result and skips both provider call and quota increment.

### `VinCheckAuditLog`
**Not a separate table.** All VIN events route into the canonical `AuditLog` ([AUDIT_LOG_REQUIREMENTS.md](AUDIT_LOG_REQUIREMENTS.md)) with:

- `entity_type ∈ { 'vin_check_request', 'vin_check_result', 'vin_check_credit' }`
- `action` drawn from a fixed set added to `AuditAction`:
  - `vin_check_requested`
  - `vin_check_validated`
  - `vin_check_quota_checked`
  - `vin_check_cache_hit`
  - `vin_check_provider_dispatched`
  - `vin_check_completed`
  - `vin_check_failed`
  - `vin_check_blocked`
  - `vin_check_expired`
  - `vin_credit_granted`
  - `vin_credit_consumed`
  - `vin_credit_revoked`

`before`/`after` payloads MUST honor the existing PII rule R1.4 (no banned keys — VIN itself is sensitive and stored as hash; never put `vin_hash` or raw VIN in audit payloads).

### `VinCheckRiskFlag`
**Not a table.** Enum value membership on `VinCheckResult.flags[]` — see §5.

---

## 5. Enums

Format mirrors [ENUMS_AND_STATUS_CODES.md](ENUMS_AND_STATUS_CODES.md). All values to be added in code under `lib/vin-check/types.ts` when Sprint 9E begins.

### `VinCheckStatus` (8) — state machine
`draft` · `validated` · `quota_checked` · `provider_pending` · `completed` · `failed` · `blocked` · `expired`

**Transitions:**

| from | → to |
|---|---|
| `draft` | `validated`, `failed`, `blocked` |
| `validated` | `quota_checked`, `failed`, `blocked` |
| `quota_checked` | `provider_pending`, `completed` (cache hit), `failed`, `blocked` |
| `provider_pending` | `completed`, `failed`, `expired`, `blocked` |
| `completed` | `expired` |
| `failed`, `blocked`, `expired` | (terminal) |

- `draft` — row inserted, VIN not yet validated.
- `validated` — VIN format + checksum pass.
- `quota_checked` — quota debit (or credit consume) applied successfully.
- `provider_pending` — provider call in flight.
- `completed` — `VinCheckResult` row written; result is the canonical answer.
- `failed` — provider error / network / validation failure after quota was applied (must refund quota — see R11.6).
- `blocked` — rate-limit / abuse signal triggered.
- `expired` — past `VinCheckResult.expires_at`; a future request for the same VIN will create a fresh request and not reuse this row.

### `VinReportType` (4)
`basic` · `full` · `promo_full` · `dealer_bulk`

- `basic` — short trust/risk summary; debit from `monthly_free` quota by default.
- `full` — full report; requires `VinCheckCredit`.
- `promo_full` — full report unlocked by promotion; consumes a `promo` credit.
- `dealer_bulk` — dealer-side bulk lookup; consumes from dealer credit pool only.

### `VinRiskLevel` (5)
`unknown` · `low` · `medium` · `high` · `critical`

Drives the public summary's badge color. `unknown` is the safe default when provider returns insufficient data — pair with `data_unavailable` in `flags`.

### `VinRiskFlag` (8)
`salvage_possible` · `theft_record_possible` · `odometer_issue_possible` · `title_issue_possible` · `accident_record_possible` · `flood_damage_possible` · `auction_record_possible` · `data_unavailable`

**Naming intentionally uses `_possible`** to avoid making categorical claims about a specific vehicle that we cannot legally substantiate. UI copy must phrase flags as advisories, not verdicts.

### `QuotaSource` (5)
`monthly_free` · `bonus` · `promo` · `admin_grant` · `paid`

Records which pool funded a given request. `dealer_bulk` requests use `paid` or `admin_grant` only; never `monthly_free`.

---

## 6. Security & access rules

R-numbered, following [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md). To be inserted as a new §11 in that file when Sprint 9E begins.

### R11.1 — Verified user required
- **Rule:** every public VIN check route MUST require an authenticated, phone-verified user. Anonymous, OTP-pending, and admin-impersonation sessions are rejected.
- **Why:** the entire abuse / quota model assumes a stable `user_id`; anonymous quota cannot be enforced.
- **9E verification:** the public route calls `getSession()` and returns 401 on missing/invalid session; integration test for anonymous → 401.

### R11.2 — Server-side quota
- **Rule:** quota is read and incremented only inside the repository, in the same `$transaction` as the `VinCheckRequest` status transition. Clients never see `basic_used` / `basic_limit` except through a dedicated `/api/vin-check/quota` GET that derives from the same row.
- **Why:** client-side counters can be tampered with; in-memory counters lose state on restart.
- **9E verification:** `prisma.$transaction` wraps the read-modify-write; integration test attempts a 3rd `basic` check in the same month → 429.

### R11.3 — Cache reuse does not consume quota
- **Rule:** a fresh `VinCheckCache` row for the same `(vin_hash, report_type)` short-circuits the flow at `quota_checked → completed` without incrementing `VinCheckQuota.basic_used` or consuming a `VinCheckCredit`.
- **Why:** users repeatedly viewing the same VIN (e.g., bookmarking, sharing) should not exhaust their free quota.
- **9E verification:** integration test: same VIN twice → quota counter unchanged on second call.

### R11.4 — VIN is stored as hash
- **Rule:** raw VIN never lives in a column. `VinCheckRequest.vin_hash` is SHA-256 with the `VIN_HASH_SALT` env var. UI history rows display `vin_last4` only.
- **Why:** VIN is sensitive vehicle-identifier PII; pairs with vehicle ownership records.
- **9E verification:** schema review — no column named `vin` (other than `vin_hash` / `vin_last4`); repository write paths regex-reject inputs whose `vin_hash` field matches an unhashed 17-char VIN pattern.

### R11.5 — Raw provider response is server-only
- **Rule:** `VinCheckResult.raw_provider_payload` MUST NOT be returned by any public route, MUST NOT be embedded in any client component prop, MUST NOT be logged outside the dedicated server log sink. Only `summary_dto_json` may cross the wire to a client.
- **Why:** raw provider payloads contain provider attribution, internal cost, IDs, and sometimes secondary PII (owner records, geographic clues). They are subject to provider licensing terms.
- **9E verification:** the public DTO is built by a `toPublicVinResult(result)` helper that destructures only the allowed keys; ESLint rule forbids `raw_provider_payload` references outside `lib/vin-check/`.

### R11.6 — Failed provider call refunds quota
- **Rule:** if the request transitions `provider_pending → failed`, the same `$transaction` MUST decrement `VinCheckQuota.basic_used` (or restore the `VinCheckCredit.consumed_at` to `null`).
- **Why:** the user must not lose a check to provider-side failures outside their control.
- **9E verification:** integration test forces a provider failure and asserts `basic_used` is unchanged from pre-call value.

### R11.7 — Rate limits per user / IP / device
- **Rule:** the public route enforces three independent token-bucket limits before any DB write: per-user (e.g., 5/min), per-IP (e.g., 10/min), per-device cookie (e.g., 5/min). Exceeding any limit transitions the request to `blocked` and writes one `AuditLog` row.
- **Why:** quota alone does not protect against credential-stuffed accounts or provider-billing abuse.
- **9E verification:** load-test scenario exercising each limit; verify `blocked` status appears in the audit log.

### R11.8 — Dealer bulk does not touch user quota
- **Rule:** any `VinCheckRequest` with `report_type='dealer_bulk'` MUST have `user_id` pointing to a dealer-operator user AND consume from `VinCheckCredit` rows owned by `dealer_id`, never from `VinCheckQuota`.
- **Why:** the user free quota is a consumer-trust feature; conflating it with dealer ops breaks both billing and abuse models.
- **9E verification:** repository function rejects `dealer_bulk` requests that resolve to a `monthly_free` quota source; integration test.

### R11.9 — VIN signals are a strict one-way boundary
- **Rule:** no code path may use a `VinCheckResult` to mutate `CatalogPrice`, `DealerOffer.verification_status`, `DealerOffer.offer_status`, the official-offer status surface, or any field that contributes to the recommendation score in [lib/cars/recommendation](../../lib/cars/) (or its 9B-renamed equivalent).
- **Why:** VIN signals are about a physical vehicle's history; price/recommendation/verification are about market data and dealer trustworthiness. Mixing them creates legal exposure ("Zolaq says this dealer's offer is bad because of a salvage flag on one car") and breaks data lineage.
- **9E verification:** ESLint rule forbids cross-domain imports `lib/vin-check/* → lib/cars/repository.ts` for mutate paths; code review checklist item.

### R11.10 — No trademarked partner names in public copy
- **Rule:** UI copy, SEO metadata, route slugs, public API responses, and admin tooling MUST NOT include "Free Carfax", "Carfax", "AutoCheck", or any other partner trademark — unless a signed licensing agreement is in place.
- **Why:** unauthorized trademark use is a legal risk and dilutes the Zolaq brand.
- **9E verification:** lint rule scanning `app/**/*.tsx`, `components/**/*.tsx`, `lib/i18n/translations/*.json` for the forbidden strings.

---

## 7. Audit requirements

Mirrors the atomicity rule (A1) in [AUDIT_LOG_REQUIREMENTS.md](AUDIT_LOG_REQUIREMENTS.md): every mutation in the VIN domain writes its `AuditLog` row in the same `prisma.$transaction` as the data write. No fire-and-forget audit.

Audit rows are required for:

- Every `VinCheckRequest` status transition (one row per transition).
- Every `VinCheckResult` creation.
- Every `VinCheckCredit` grant, consume, and revoke.
- Every rate-limit `blocked` outcome.

`before` / `after` payloads MUST NOT contain `vin_hash`, raw VIN, or any banned PII key (R1.4). They may contain `vin_last4`, `report_type`, `status`, `quota_source`, and the request/result/credit IDs.

When a user is deleted (a future right-to-be-forgotten flow), `VinCheckRequest` and `VinCheckResult` rows for that user are anonymized (`user_id` → tombstone, `vin_hash` → null) but **not** physically deleted, so audit lineage remains intact.

---

## 8. Future UX placement (descriptive only)

No UI is built by this addendum. The architecture must support these placements:

- **Homepage** — small trust card under Quick Search, headline along the lines of "Tarixçəni yoxlayın" / "Avtomobilinizin tarixçəsini yoxlayın".
- **Car detail / offer detail** — a VIN history block near the price/source/trust panel; explicitly **adjacent to** not **inside** the price card, because price ≠ vehicle history.
- **Profile** — `/profile/vin-checks` ("Mənim VIN yoxlamalarım") listing the user's request history with `vin_last4`, date, status, risk badge.
- **Catalog cards** — small "VIN check" badge slot only; **no** VIN input directly on a card.
- **Content / Q&A / Bazar Nəbzi** — educational CTAs ("VIN nədir? Niyə vacibdir?") linking to a dedicated landing page.

---

## 9. Non-goals (binding)

- No UI now.
- No public route now.
- No provider integration now.
- No paid full report now.
- No "Free Carfax" wording — ever, without a license.
- No effect on pricing.
- No effect on recommendation score.
- No effect on official offer / dealer verification status.
- No change to Sprint 8H Search / Nəsil / Komplektasiya.
- No change to Lead / OTP.

---

## 10. Repository & schema impact (future Sprint 9E)

When Sprint 9E begins (after 9B–9D cutover):

- **New repository domain:** `lib/vin-check/repository.ts` following the seam pattern in [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §1. Functions: `validateVin()`, `createRequest()`, `transitionRequest()`, `getQuotaForUser()`, `consumeCredit()`, `lookupCache()`, `writeResult()`, `listRequestsForUser()`.
- **New schema tables:** `VinCheckRequest`, `VinCheckResult`, `VinCheckProvider`, `VinCheckQuota`, `VinCheckCredit`, `VinCheckCache`. All FKs as documented in §4.
- **New enums:** `VinCheckStatus`, `VinReportType`, `VinRiskLevel`, `VinRiskFlag`, `QuotaSource` — added to the Prisma block in [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md) at that time.
- **No impact on Sprint 9B–9D tables.** This addendum does not add columns to `User`, `Dealer`, `Trim`, `Lead`, `DealerOffer`, `CatalogPrice`, `Content`, or any existing table.
- **AuditLog table unchanged.** Only new `action` string values are introduced.

---

## 11. Open questions

1. **Provider candidates** — NMVTIS resellers vs. direct Carfax licensing vs. an internal heuristic baseline. Cost, data quality, and contract terms all open.
2. **Risk-flag legal review** — confirm `_possible` suffix is sufficient with legal counsel; consider whether some flags need additional disclaimer copy.
3. **Cache TTL per report type** — `basic` cache window (proposed 30 days), `full` cache window (proposed 7 days), `dealer_bulk` (proposed 24h)? Driven by how often the underlying provider data changes.
4. **Dealer-bulk session model** — does `dealer_bulk` require a dealer-operator user (sharing a session with the existing dealer console) or a new dealer-API key?
5. **Quota refund window** — should refunds (R11.6) be bounded by a window (e.g., 24h) to prevent retroactive abuse?
6. **VIN tombstone policy** — on user deletion, do we keep `vin_last4` for analytics, or null it entirely?

---

## 12. Output deliverables

1. **Files created/updated** — `docs/sprint-9a/VIN_CHECK_ARCHITECTURE_ADDENDUM.md` (this file); `docs/sprint-9a/I18N_MULTILINGUAL_ARCHITECTURE.md` (sibling addendum); short cross-reference appends to `PRODUCTION_DATA_ARCHITECTURE.md`, `ENTITY_RELATIONSHIP_MAP.md`, `DATABASE_SCHEMA_DRAFT.md`, `ENUMS_AND_STATUS_CODES.md`, `REPOSITORY_LAYER_PLAN.md`, `SECURITY_AND_ACCESS_RULES.md`, `AUDIT_LOG_REQUIREMENTS.md`, `SPRINT_9B_IMPLEMENTATION_PLAN.md`.
2. **VIN Check architecture summary** — verified-user-gated, server-side-quota'd, provider-abstracted, cache-reusing, audit-logged trust feature with strict server-only/public-DTO boundary and strict separation from pricing/recommendation/verification. §1–§3.
3. **VIN entities/enums** — 6 tables (`VinCheckRequest`, `VinCheckResult`, `VinCheckProvider`, `VinCheckQuota`, `VinCheckCredit`, `VinCheckCache`); 5 enums (`VinCheckStatus`, `VinReportType`, `VinRiskLevel`, `VinRiskFlag`, `QuotaSource`); 12 new `AuditAction` strings. §4, §5.
4. **VIN quota / cache / security rules** — §3 (pillars), §6 (R11.1–R11.10), §7 (audit).
5. **Future VIN user placement map** — homepage trust card, car/offer detail history block, profile list, catalog badge, content/Q&A/Bazar Nəbzi educational CTAs. §8.
6. **i18n architecture summary** — see [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md).
7. **i18n entities** — see sibling doc.
8. **Translation layer strategy** — see sibling doc.
9. **SEO / localized route strategy** — see sibling doc.
10. **Admin translation workflow** — see sibling doc.
11. **Repository / schema impact** — §10 plus sibling i18n doc §7.
12. **Security / audit impact** — §6, §7 plus sibling i18n doc §8.
13. **Sprint 9B / 9C recommendation** — VIN Check and i18n are **not** part of 9B–9D. Recommended sequence: Sprint 9E (VIN Check), Sprint 9F (i18n).
14. **Open questions** — §11.
15. **Final decision: PASS.**
