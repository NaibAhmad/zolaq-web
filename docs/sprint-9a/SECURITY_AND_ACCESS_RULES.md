# Security and Access Rules — Sprint 9A

Invariants the schema, repository layer, and 9B implementation MUST preserve. Every rule cites the file that enforces it today (so 9B can verify the rule still holds after cutover).

---

## 1. Phone & PII boundary

### R1.1 — Raw phone is never persisted
- **Rule:** No column in any table stores the raw phone number. Only `phone_hash` (SHA-256 with `OTP_PHONE_HASH_SALT`, see [lib/auth/phone.ts](../../lib/auth/phone.ts) `phoneHash()`) lives on `User`, `Lead`, `OTPVerification`.
- **Enforced today by:** OTP request route never writes raw phone into any store; `lib/leads/store.ts` `CreateLeadInput` only accepts `phone_hash`.
- **9B verification:** schema review — every column named `phone_*` is of type `Citext` and stores hashes only. Repository write paths reject inputs that contain unhashed phone digits (regex check at the boundary).

### R1.2 — User ID derivation must remain stable
- **Rule:** `User.id` is `\`user_${phoneHash.slice(0,16)}\``. ([lib/auth/otp-store.ts](../../lib/auth/otp-store.ts) `deriveUserId()`).
- **Why:** existing sessions (httpOnly cookies issued before 9B) carry these IDs. Changing the derivation invalidates every active session.
- **9B verification:** seed loader sets `User.id` via `deriveUserId(phoneHash)`; no Prisma `@default(cuid())` on the `User` model.

### R1.3 — OTP code is never persisted in plaintext
- **Rule:** `OTPVerification.code_hash` stores SHA-256 of the OTP code (same salt). Today's in-memory store keeps the raw code in `OtpSession.code` — this is **only** acceptable in-memory. In the DB, hash before insert.
- **Enforced today by:** in-memory only; the raw code never leaves Node memory (sent via SMS provider then dropped on verification).
- **9B verification:** OTP repository `createOtpSession` hashes before `prisma.oTPVerification.create`. `markVerified` does not re-read the code.

### R1.4 — Banned PII keys on event payloads
- **Rule:** Any `Record<string, unknown>` written to `ActivityEvent.metadata`, `PointGrant.metadata`, `LeadEvent.metadata`, `DecisionHistoryEvent.metadata`, or `AuditLog.before/after` MUST NOT contain keys from [BANNED_PII_KEYS](../../lib/tracking/events.ts) — `phone`, `raw_phone`, `phone_number`, `email`, `full_name`, `name`, `first_name`, `last_name`.
- **Enforced today by:** `app/api/events/route.ts` returns 422 on banned keys for tracking events. Other metadata fields rely on caller discipline today.
- **9B verification:** every repository function that writes JSON metadata calls a shared `assertNoPii(metadata)` helper (one place to add a key — `lib/security/pii-guard.ts`). Lint rule `no-restricted-properties` forbids the banned keys inline anywhere under `lib/**/repository.ts`.

---

## 2. Server-only / client-safe boundary

### R2.1 — Server-only lib allowlist
- **Rule:** The full client-safe allowlist is in [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §5. Anything outside it (notably `lib/db/`, every `lib/*/repository.ts`, `lib/admin/*` except pure constants, `lib/auth/*` except `phone.ts`/`constants.ts`, `lib/*/store.ts`, `lib/*/seed.ts`, `lib/*/lookup.ts`) MUST NOT be imported from a client component or a client-boundary RSC.
- **Enforced today by:** convention only. Catalog admin store has a comment to this effect; everything else relies on review.
- **9B enforcement:** add ESLint rule in `eslint.config.mjs`:
  ```js
  {
    files: ["**/*.tsx", "components/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        "@/lib/db/*",
        "@/lib/*/repository",
        "@/lib/*/store",
        "@/lib/*/seed",
        "@/lib/*/lookup",
        "@/lib/admin/*",
        "@/lib/auth/{session,otp-store,admin-session,dealer-session}*",
      ]}],
    },
  }
  ```
- **Why:** importing Prisma client into a client component bundles `@prisma/client` (and its native deps) into the browser bundle. Build break > runtime break.

### R2.2 — Public catalog never depends on admin client-side store
- **Rule:** `app/(public)/**` pages may only read via `lib/cars/lookup.ts` (server-side delegate) or `lib/cars/client-lookup.ts` (seed-backed, client-safe). Never directly from `lib/admin/catalog-store.ts`.
- **Enforced today by:** [lib/cars/lookup.ts](../../lib/cars/lookup.ts) is the server delegate; [lib/cars/client-lookup.ts](../../lib/cars/client-lookup.ts) is the client-safe entry.
- **9B verification:** `git grep "@/lib/admin/catalog-store" app/\(public\)/` returns zero matches.

---

## 3. Dealer scoping

### R3.1 — Dealer users only see their own rows
- **Rule:** For `Lead`, `DealerOffer`, `Invoice`, `PaymentProof`, `AdRequest`, `DealerSubmission`: any dealer-authenticated read MUST filter `WHERE dealer_id = session.dealerId`. Any dealer-authenticated write MUST verify the target row's `dealer_id` matches the session before applying.
- **Enforced today by:** `getInvoiceForDealer`, `getPaymentProofForDealer`, `getAdRequestForDealer`, `getSubmissionForDealer` ([lib/invoices/store.ts](../../lib/invoices/store.ts), [lib/payments/store.ts](../../lib/payments/store.ts), [lib/ads/store.ts](../../lib/ads/store.ts), [lib/dealer/submissions/store.ts](../../lib/dealer/submissions/store.ts)) — they return `null` if `dealer_id` mismatches. For Leads, dealer access goes through `listLeadsForTrims(trim_ids)` where the trim allowlist is the dealer's own offers.
- **9B verification:** repository preserves the `*ForDealer` signature. Add an integration test: authenticate as Dealer A, attempt to fetch a Lead/Invoice/AdRequest belonging to Dealer B → must receive 404 (not 403), to avoid leaking existence.

### R3.2 — Repository never re-derives identity from cookies
- **Rule:** Repository functions accept an `actor: { actor_type, actor_id, role, dealer_id? }` argument; they MUST NOT read `cookies()` themselves. Identity derivation stays in `requireAdminSession()` / `requireDealerSession()` / `getSession()` middleware in route handlers.
- **Why:** keeps the repository testable, keeps cookie parsing in one place, prevents accidentally bypassing auth from a background job.
- **9B verification:** `git grep "cookies()" lib/*/repository.ts` returns zero matches.

---

## 4. Admin role enforcement

### R4.1 — Admin role checks stay in middleware
- **Rule:** `app/api/internal/**` and `app/admin/**` routes invoke `requireAdminSession()` ([lib/auth/admin-session.ts](../../lib/auth/admin-session.ts)) at the top of every handler. Role checks for specific actions (e.g., "content_manager may publish News") happen in the route handler, not in the repository.
- **Enforced today by:** middleware in `requireAdminSession()`; per-route role guard in handlers that need it.
- **9B note:** the `Role` + `AdminUserRole` join table introduced in the schema draft is forward-compatible; current single-role code path keeps working via `AdminUser.role` (a denormalized convenience column).

### R4.2 — Dealer panel is fully isolated from customer cookies
- **Rule:** Customer (`zlq_session`), admin (`zlq_admin_session`), and dealer (`zlq_dealer_session`) cookies are distinct ([lib/auth/constants.ts](../../lib/auth/constants.ts)). A request carrying only `zlq_session` MUST NOT pass `requireDealerSession()` or `requireAdminSession()`.
- **Enforced today by:** separate cookie names + separate decoders.
- **9B verification:** integration test — present each cookie alone and assert exactly one of the three session checks passes.

---

## 5. Sponsored content invariant

### R5.1 — Active ads MUST carry a visible label
- **Rule:** `AdRequest.status = 'active'` (or any public-visible status from `AD_PUBLIC_VISIBLE_STATUSES`) ⇒ `AdRequest.label IS NOT NULL`. The label is one of `Sponsorlu`, `Reklam`, `Premium`.
- **Enforced today by:** [lib/ads/store.ts](../../lib/ads/store.ts) `updateAdRequest()` throws `LABEL_REQUIRED` and `transitionAdStatus()` returns `{ok: false, error: 'label_required'}` when a public-visible target is attempted with `label = null`.
- **9B verification:** repository preserves both checks. Add a Postgres-level safety net:
  ```sql
  ALTER TABLE ad_request ADD CONSTRAINT ad_request_active_requires_label
    CHECK (status NOT IN ('approved','paid','active','paused') OR label IS NOT NULL);
  ```
  (Committed in a follow-up migration alongside `0002_partial_indexes`.)

### R5.2 — Every sponsored public surface must show the label
- **Rule:** Components that render `AdRequest` rows (homepage block, sponsored catalog card, content sponsorship banner, market-pulse sponsor strip, etc.) MUST render the label text visibly.
- **Enforced today by:** rendering convention; today's sponsored components include the label.
- **9B verification:** no schema change; visual review in QA gate.

---

## 6. Catalog/dealer-offer separation

### R6.1 — Official price and dealer offer are separate columns AND separate tables
- **Rule:** A `PriceRecord` is either a catalog price (no `dealer_id`) OR a dealer offer (has `dealer_id`, `offer_id`, `offer_status`). The two MUST NOT be merged into a single conceptual "price" in any DTO.
- **Enforced today by:** `lib/cars/types.ts` `PriceRecord` keeps dealer fields optional; readers branch on `dealer_id`.
- **9B enforcement:** schema-level — two tables (`CatalogPrice`, `DealerOffer`). The repository's `getPriceForTrim()` returns the existing union shape; consumers never see the two tables. See ADR in [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md).

### R6.2 — Public catalog only sees published offers
- **Rule:** Public reads of `DealerOffer` MUST filter `WHERE offer_status = 'published'`. Draft/submitted/under_review/needs_revision/rejected/expired/cancelled offers MUST NEVER appear on public surfaces.
- **Enforced today by:** [lib/cars/lookup.ts](../../lib/cars/lookup.ts) `searchTrims()` and `getOfferById()` apply the filter.
- **9B enforcement:** partial index `dealer_offer_published_idx WHERE offer_status = 'published'` (in migration 0002) is the hot read path. Repository's public-facing `listPublishedOffersForTrim()` includes the filter.

### R6.3 — `trim_id` is the canonical vehicle reference
- **Rule:** Every entity that points to "a car" FKs to `Trim.trim_id`. `generation_id` is connected to `Model` and `Trim` (via the composite `(brand_id, model_name)` link). Dealer offers MUST reference `trim_id`, not `generation_id` or `model_id`.
- **Enforced today by:** `lib/cars/types.ts` `Trim` is the canonical type; every downstream domain (`Lead.trim_id`, `Decision.primary_trim_id`, `SavedCar.trim_id`, etc.) FKs there.
- **9B enforcement:** all `DealerOffer.trim_id` FK to `Trim.trim_id` (RESTRICT). Schema rejects orphans.

---

## 7. Gamification isolation

### R7.1 — Gamification MUST NOT affect recommendation, verification, or official price
- **Rule:** No code outside `lib/gamification/**` may branch on a user's badges, point total, or activity.
- **Enforced today by:** convention — the comment at the top of [lib/gamification/badges.ts](../../lib/gamification/badges.ts) lists the forbidden surfaces (Zolaq Recommendation, `DealerVerificationStatus`, `PriceRecord.verified`, Decision Center step logic, Lead routing).
- **9B enforcement:** schema-level — there is **no FK** from `Lead`, `DealerOffer`, `Decision`, `CatalogPrice`, `Dealer`, or any verification/recommendation table into `UserBadge`, `PointGrant`, or `ActivityEvent`. The dependency arrow only points FROM gamification INTO the rest of the schema. Lint rule: `no-restricted-imports` prevents `lib/cars/repository.ts`, `lib/dealers/repository.ts`, `lib/leads/repository.ts`, `lib/decisions/repository.ts` from importing anything under `lib/gamification/`.

### R7.2 — Points have daily caps enforced in the repository
- **Rule:** `grantPoints(userId, action, ...)` MUST enforce `DAILY_CAPS[action]` ([lib/gamification/points.ts](../../lib/gamification/points.ts)) in the repository write path, not in the API handler.
- **Why:** future callers (background jobs, batch grants) bypass the API.
- **9B verification:** repository implementation uses the `(user_id, action, granted_at)` index to count today's grants in the same `tx()` as the insert.

### R7.3 — Point reversal is the only mutation on a granted point
- **Rule:** `PointGrant` rows are never deleted. Reversal sets `reversed_at` + `reverse_reason`. Aggregations (`userPointTotal`) filter `WHERE reversed_at IS NULL`.
- **Enforced today by:** `lib/gamification/points.ts` `reversePoints()` is the only mutator; `userPointTotal()` filters.
- **9B verification:** no DELETE on `point_grant`; repository function preserved.

---

## 8. Lead OTP gating

### R8.1 — Lead submission requires an OTP-verified session
- **Rule:** `POST /api/leads` requires a valid `zlq_session` cookie with `purpose='lead_submit'` and `verifiedAt` set. Repository's `createLead` requires `phone_hash` (the session attribute) — there is no path that accepts a raw phone.
- **Enforced today by:** route handler in `app/api/leads/route.ts` invokes `getSession()`; rejects unauthenticated.
- **9B verification:** unchanged. Repository signature is identical.

### R8.2 — Dealer state transitions can only be initiated by an internal operator
- **Rule:** `transitionLead({ to_state, actor })` for actor-types `internal_operator` requires admin auth at the route layer. The repository accepts the `actor` argument but does not enforce identity.
- **Enforced today by:** `app/api/internal/leads/[leadId]/state/route.ts` calls `requireAdminSession()`.
- **9B verification:** auth stays in the route handler; the repository's `actor` argument is passed through to audit.

---

## 9. Audit log integrity

### R9.1 — Mutations and their audit row commit together
- **Rule:** Every mutation that crosses the boundary (catalog create/update, lead transition, offer publish, invoice transition, payment review, vote cast, point grant, etc.) MUST write its `AuditLog` row inside the same `prisma.$transaction` as the data change. Audit rows MUST NOT be best-effort or fire-and-forget.
- **Enforced today by:** `writeAudit()` is called inline in every store mutation function, but on rollback the whole call returns — same effect as transactional today because the Map is synchronous.
- **9B enforcement:** see the `tx()` table in [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §3. Rollback test required in the QA gate ([SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) Phase 5 step 6).

### R9.2 — Audit `before/after` carries DTO shape, never raw Prisma rows
- **Rule:** Snapshot fields hold the repository's return shape (the `lib/<domain>/types.ts` shape), not the underlying Prisma row. This prevents leaking column renames into audit history.
- **9B enforcement:** repository helper `toAuditSnapshot(entity)` maps Prisma row → DTO before the `writeAudit` call.

---

## 10. Decision Center, Compare, & user-scoped reads

### R10.1 — `CompareSession` stays in `localStorage`
- **Rule:** Compare selection (trim IDs) is browser-only state. No server table.
- **Enforced today by:** [lib/compare/client-store.ts](../../lib/compare/client-store.ts).
- **9B verification:** no `CompareSession` model in schema; no API route accepts compare-session writes.

### R10.2 — Profile reads are user-scoped at the repository
- **Rule:** `listLeadsForUser`, `listDecisionsForUser`, `listSavedForUser`, `listViewedForUser`, `listHistoryForUser`, `listUserBadges`, `listUserPointGrants`, `listUserVotes`, `listProfileActivity` all filter `WHERE user_id = $1`. There is no path that returns another user's data.
- **Enforced today by:** each function in the respective store filters by `user_id`.
- **9B verification:** repository signatures preserved; integration test confirms cross-user reads return empty arrays.

---

## Summary table

| # | Invariant | File that enforces it today |
|---|---|---|
| R1.1 | No raw phone in DB | [lib/auth/phone.ts](../../lib/auth/phone.ts), [lib/leads/store.ts](../../lib/leads/store.ts) |
| R1.2 | Stable User.id derivation | [lib/auth/otp-store.ts](../../lib/auth/otp-store.ts) |
| R1.3 | OTP code never plaintext on disk | [lib/auth/otp-store.ts](../../lib/auth/otp-store.ts) |
| R1.4 | Banned PII keys on metadata | [lib/tracking/events.ts](../../lib/tracking/events.ts) |
| R2.1 | Server-only lib allowlist | convention; ESLint in 9B |
| R2.2 | Public catalog doesn't touch admin store | [lib/cars/lookup.ts](../../lib/cars/lookup.ts), [lib/cars/client-lookup.ts](../../lib/cars/client-lookup.ts) |
| R3.1 | Dealer scoping on reads + writes | `*ForDealer` functions across stores |
| R3.2 | Repository takes `actor`, never reads cookies | new in 9B |
| R4.1 | Admin role checks in middleware | [lib/auth/admin-session.ts](../../lib/auth/admin-session.ts) |
| R4.2 | Customer / admin / dealer cookies isolated | [lib/auth/constants.ts](../../lib/auth/constants.ts) |
| R5.1 | `active` ⇒ `label IS NOT NULL` | [lib/ads/store.ts](../../lib/ads/store.ts) + DB CHECK in 9B |
| R5.2 | Sponsored surfaces show label | rendering convention |
| R6.1 | Catalog price ≠ dealer offer | [lib/cars/types.ts](../../lib/cars/types.ts); two-table split in 9B |
| R6.2 | Public sees only published offers | [lib/cars/lookup.ts](../../lib/cars/lookup.ts) + partial index in 9B |
| R6.3 | `trim_id` canonical | every downstream FK |
| R7.1 | Gamification isolated from recommendation | [lib/gamification/badges.ts](../../lib/gamification/badges.ts) comment + schema-level absence of FKs in 9B |
| R7.2 | Daily caps in repository | [lib/gamification/points.ts](../../lib/gamification/points.ts) |
| R7.3 | Points reversed not deleted | [lib/gamification/points.ts](../../lib/gamification/points.ts) |
| R8.1 | Leads require OTP-verified session | `app/api/leads/route.ts` |
| R8.2 | Internal lead transitions require admin auth | `app/api/internal/leads/[leadId]/state/route.ts` |
| R9.1 | Mutation + audit in same `tx()` | new in 9B |
| R9.2 | Audit snapshot = DTO not Prisma row | new in 9B |
| R10.1 | Compare stays in localStorage | [lib/compare/client-store.ts](../../lib/compare/client-store.ts) |
| R10.2 | Profile reads user-scoped | `listXForUser()` across stores |

---

## 11. VIN Check (addendum — Sprint 9E, not in 9B–9D)

Full bodies (rule, why, enforcement, verification) live in [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md) §6.

| Rule | Summary |
|---|---|
| R11.1 | Verified user required for any VIN check route. |
| R11.2 | Server-side quota, read/write only inside the repository, in the same `$transaction` as the state transition. |
| R11.3 | Cache reuse for the same `(vin_hash, report_type)` does NOT consume quota. |
| R11.4 | Raw VIN never stored — only `vin_hash` (SHA-256 + `VIN_HASH_SALT`) and `vin_last4`. |
| R11.5 | `raw_provider_payload` is server-only; only `summary_dto_json` may cross the wire. |
| R11.6 | Failed provider call refunds quota / restores credit. |
| R11.7 | Three independent rate limits: per-user, per-IP, per-device. |
| R11.8 | `dealer_bulk` consumes dealer credits only — never `monthly_free`. |
| R11.9 | VIN signals MUST NOT mutate `CatalogPrice`, `DealerOffer.verification_status`, official-offer status, or recommendation score. **Strict one-way boundary.** |
| R11.10 | No trademarked partner names ("Free Carfax", "Carfax", "AutoCheck") in any public copy without a signed license. |

## 12. i18n (addendum — Sprint 9F, not in 9B–9D)

Full bodies live in [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md) §8.

| Rule | Summary |
|---|---|
| R12.1 | Slug uniqueness is per-locale (`@@unique([locale, slug])`), not global. |
| R12.2 | Admin edits to any `*Translation` table write `AuditLog` rows in the same `$transaction` (mirrors A1). |
| R12.3 | Banned-PII rule (R1.4) extends to translation audit payloads. |
| R12.4 | Public surface is read-only for translations — no public route writes to `*Translation`. |
| R12.5 | `UserLanguagePreference` writes go through the existing session boundary; no client-side mutation. |
| R12.6 | Untranslated locales are hidden from sitemap and hreflang by default; AZ-fallback-with-banner is per-entity opt-in. Never machine-publish. |
