# Repository Layer Plan — Sprint 9A

## The seam

```
 app/api/**/route.ts        ← unchanged
        │
        ▼
 lib/<domain>/store.ts      ← shim that re-exports from repository.ts (transitional)
        │
        ▼
 lib/<domain>/repository.ts ← NEW in 9B — same function signatures as today's store
        │
        ▼
 lib/db/prisma.ts           ← singleton, HMR-guarded
        │
        ▼
 Prisma → PostgreSQL
```

**Single rule:** every `lib/<domain>/repository.ts` exports the **exact same function names and signatures** that today's `lib/<domain>/store.ts` (or `lib/admin/<domain>-store.ts`) exports. API routes never change their import shape — Sprint 9B's cleanup PR only flips the import path from `@/lib/<domain>/store` to `@/lib/<domain>/repository`, then deletes the shim.

This document enumerates every store function in the codebase today, the Prisma model + method that backs it in 9B, and any non-trivial transformation the repository must perform at the boundary.

---

## 1. `lib/db/` — new in 9B

Two files only.

### `lib/db/prisma.ts`
Singleton client with the standard Next.js dev-HMR guard:

```ts
// Server-only. Never import from a client component.
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { __zlq_prisma?: PrismaClient };
export const prisma: PrismaClient =
  g.__zlq_prisma ??
  (g.__zlq_prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  }));
```

### `lib/db/index.ts`
Re-exports `prisma`, the generated enum types, and a transaction helper `tx<T>(fn): Promise<T>` that wraps `prisma.$transaction`. Repository functions that mutate two or more tables (lead transition + LeadEvent + AuditLog) compose through `tx()`.

---

## 2. Per-domain function inventory

Format per row: **store function** · current file:line range · repository file in 9B · Prisma backing · notes.

### 2.1 `lib/cars/repository.ts` (backed by catalog-store, lookup, client-lookup)

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `listBrands()` | [lib/admin/catalog-store.ts](../../lib/admin/catalog-store.ts) | `prisma.brand.findMany()` | |
| `getBrand(brandId)` | same | `prisma.brand.findUnique({ where: { brand_id } })` | |
| `createBrand({...})` | same | `prisma.brand.create({ data })` + `writeAudit("brand.create")` in `tx()` | |
| `updateBrand(brandId, patch)` | same | `prisma.brand.update` + audit `before/after` snapshot in `tx()` | |
| `listModels({brand_id?})` | same | `prisma.model.findMany({ where })` | |
| `getModel(modelId)`, `createModel`, `updateModel` | same | `prisma.model.{findUnique,create,update}` + audit | |
| `listTrims({brand_id?, energy_type?})` | same | `prisma.trim.findMany({ where, include: { spec: true } })` | Repository flattens `spec.*` back onto the `Trim` shape today's callers expect. |
| `getTrim`, `createTrim`, `updateTrim` | same | `prisma.trim.{findUnique,create,update}` + audit. `createTrim` also writes `TrimSpec` row in same `tx()`. | |
| `listPrices({trim_id?, dealer_id?, offers_only?, catalog_only?})` | same | `union(catalog_price, dealer_offer)` — `offers_only` → only `dealer_offer`; `catalog_only` → only `catalog_price`; default unions both. Repository assembles into the existing `PriceRecord` union shape. | **ADR — `PriceRecord` split** (see [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md)). Callers see no change. |
| `getPrice(priceId)` | same | Look up in both tables; first hit wins. | |
| `getOfferById(offerId)` | same | `prisma.dealerOffer.findUnique({ where: { offer_id } })` then map. | |
| `createPrice(input)` | same | If `input.dealer_id` → `prisma.dealerOffer.create`; else → `prisma.catalogPrice.create`. + audit (`price.create` or `offer.create`). | |
| `updatePrice(priceId, patch)` | same | Branch on which table holds the row. + audit. | |
| `updateOfferById(offerId, patch)` | same | `prisma.dealerOffer.update({ where: { offer_id } })` + audit. | |

**Client-safe surface** — `lib/cars/client-lookup.ts` stays seed-backed (no Prisma import). The repository file is server-only.

### 2.2 `lib/dealers/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `listDealers()` | [lib/admin/dealer-store.ts](../../lib/admin/dealer-store.ts) | `prisma.dealer.findMany()` | |
| `getDealer(dealerId)` | same | `prisma.dealer.findUnique` | |
| `createDealer({...})` | same | `prisma.dealer.create` + audit `dealer.create` in `tx()` | |
| `updateDealer(dealerId, patch)` | same | `prisma.dealer.update` + audit `dealer.update`; if `verification_status` changed, also writes a `DealerVerificationHistory` row + audit `dealer.verify` — all in one `tx()`. | |
| `listPublishedOffersForDealer(dealerId)` | [lib/dealers/lookup.ts](../../lib/dealers/lookup.ts) | `prisma.dealerOffer.findMany({ where: { dealer_id, offer_status: 'published' } })` | Uses the partial index. |

### 2.3 `lib/dealer/submissions/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `createSubmission`, `listSubmissions`, `getSubmission`, `getSubmissionForDealer` | [lib/dealer/submissions/store.ts](../../lib/dealer/submissions/store.ts) | `prisma.dealerSubmission.{create,findMany,findUnique}` + audit | |
| `transitionSubmission` | same | `prisma.dealerSubmission.update` + audit. | |
| `applyApprovedSubmission` | same | One `tx()`: write to `Dealer` / `CatalogPrice` / `DealerOffer` based on `kind`, then update submission to `published`, then emit two audit rows (`offer.publish`/`dealer.update` AND `submission.approve`). | The cross-domain write is the most important `tx()` in the whole repo — must not split. |

### 2.4 `lib/leads/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `createLead({...})` | [lib/leads/store.ts](../../lib/leads/store.ts) | `tx()`: `prisma.lead.create` + `prisma.leadEvent.create({ type: 'lead_submitted', actor: 'user' })`. | Side effect: `onOfficialOfferReceived` hook stays out of repository — only called from `transitionLead`. |
| `listLeadsForUser(userId)` | same | `prisma.lead.findMany({ where: { user_id }, orderBy: { created_at: 'desc' } })` | |
| `listAllLeads()` | same | `prisma.lead.findMany({ orderBy: { created_at: 'desc' } })` | Admin-only path; repository asserts caller passed `actor.actor_type === 'admin'`. |
| `listLeadsForTrims(trimIds)` | same | `prisma.lead.findMany({ where: { trim_id: { in: trimIds } } })` | Dealer scoping — see [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md). |
| `getLeadById(leadId)`, `getLeadForUser(leadId, userId)` | same | `findUnique` with `where: { user_id }` for the user-scoped variant. | |
| `getTimelineForLead(leadId)` | same | `prisma.leadEvent.findMany({ where: { lead_id }, orderBy: { created_at: 'asc' } })` | |
| `transitionLead({lead_id, to_state, actor, metadata?})` | same | `tx()`: validate via `LEAD_ALLOWED_TRANSITIONS` (stays in code, not DB), update `Lead`, insert `LeadEvent`, write `AuditLog`. Side-effect `onOfficialOfferReceived(user_id)` runs **after** the `tx()` commits. | Hottest transactional path — get the boundaries right. |

### 2.5 `lib/decisions/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `listDecisionsForUser(userId)`, `getDecisionForUser(decisionId, userId)` | [lib/decisions/store.ts](../../lib/decisions/store.ts) | `prisma.decision.findMany / findUnique` with `user_id` filter. | |
| `createDecision({...})` | same | `tx()`: `prisma.decision.create` + `appendHistoryEvent({ type: 'saved_car' })`. | |
| `updateDecision(decisionId, userId, patch)` | same | `prisma.decision.update` (with `where: { decision_id, user_id }` for user scoping). Sets `decided_at` / `abandoned_at` / `closed_at` based on `patch.status`. | |
| `closeDecision` | same | `updateDecision(..., { status: 'closed' })`. | |
| `appendHistoryEvent(input)` | same | `prisma.decisionHistoryEvent.create` | |
| `listHistoryForUser(userId, {limit?, decisionId?})` | same | `prisma.decisionHistoryEvent.findMany({ where, take: limit, orderBy: { created_at: 'desc' } })` | |
| `listSavedForUser(userId)`, `listViewedForUser(userId)` | same | `prisma.savedCar.findMany`, `prisma.viewedCar.findMany`. | |

### 2.6 `lib/content/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `listNews`, `listPublishedNews`, `getNews`, `getNewsBySlug`, `createNews`, `updateNews` | [lib/content/admin-store.ts](../../lib/content/admin-store.ts) | `prisma.news.{findMany,findUnique,create,update}`. `listPublishedNews` filters `status='published'`. Creates + updates write audit (`content.create` / `content.update`). | |
| `listEncyclopedia`, ... | same | `prisma.encyclopedia.*` analogously. | |
| `listQA`, ... | same | DB splits into `qa_question` + `qa_answer`. `listPublishedQA()` joins question + first published answer and returns the legacy `QAEntry` shape. | |
| `publishContent(contentType, contentId)` / `unpublishContent` | per API route in `app/api/internal/content/**/publish/route.ts` | `prisma.<model>.update({ where, data: { status } })` + audit (`content.publish` / `content.unpublish`). | Today the publish/unpublish actions live in API routes — repository absorbs them. |
| `recordContentRead(userId, contentType, contentId)` | new in 9B | `prisma.contentRead.upsert({ where: { user_id_content_type_content_id }, update: { read_at: now() }, create: {...} })` | Idempotent. |

### 2.7 `lib/ads/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `createAdRequest({...}, actor)` | [lib/ads/store.ts](../../lib/ads/store.ts) | `tx()`: `prisma.adRequest.create` + audit. | |
| `listAdRequests({dealer_id?, status?, placement?})`, `getAdRequest`, `getAdRequestForDealer` | same | `prisma.adRequest.findMany / findUnique`. Dealer-scoped variants assert `dealer_id`. | |
| `updateAdRequest(id, patch, actor)` | same | `tx()`: load, validate label-required invariant, update, write `ad_request.update` audit + conditional `ad_request.label_change` / `ad_request.placement_change` audits. | Invariant **`active` ⇒ `label IS NOT NULL`** enforced here, not in API. |
| `transitionAdStatus({id, to, actor, ...})` | same | `tx()`: validate `ALLOWED_TRANSITIONS` (stays in code), load, validate label-required for public-visible targets, update, write audit using `TRANSITION_AUDIT_ACTION` map. | |
| `listActivePlacements(area)` | same | `prisma.adRequest.findMany({ where: { placement: area, status: 'active' } })` | Hot public path — relies on `(placement, status)` index. |

### 2.8 `lib/invoices/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `createInvoice({...})` | [lib/invoices/store.ts](../../lib/invoices/store.ts) | `tx()`: derive `invoice_number` via a Postgres sequence (`ZLQ-2026-NNNN` format moves into a SQL function `next_invoice_number()` committed alongside `schema.prisma`), `prisma.invoice.create`, `PaymentStatusHistory` row, audit `invoice.create`. | Today's in-memory counter dies on restart — sequence-backed numbering is the production fix. |
| `listInvoices({dealer_id?, status?, ad_request_id?})`, `getInvoice`, `getInvoiceForDealer` | same | `prisma.invoice.findMany / findUnique`. Dealer-scoped variants assert `dealer_id`. | |
| `transitionInvoice({id, to, actor, ...})` | same | `tx()`: validate `ALLOWED[before.status]`, update, insert `PaymentStatusHistory`, audit via `TRANSITION_ACTION` map. | |

### 2.9 `lib/payments/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `uploadPaymentProof({...})` | [lib/payments/store.ts](../../lib/payments/store.ts) | `tx()`: `prisma.paymentProof.create` + audit `payment.upload`. | |
| `listPaymentProofs`, `getPaymentProof`, `getPaymentProofForDealer` | same | `prisma.paymentProof.findMany / findUnique`. | |
| `reviewPaymentProof({id, to: 'approved'|'rejected', reviewer_id, ...})` | same | `tx()`: update proof; if `approved`, also flip linked invoice to `paid` and (cascading) trigger ad request activation eligibility. Audit `payment.approve` / `payment.reject` + downstream `invoice.mark_paid`. | The proof approval is the single most consequential `tx()` outside lead transitions — splits would leave dangling paid proofs against unpaid invoices. |

### 2.10 `lib/market-pulse/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `createTopic({...}, actor)` | [lib/market-pulse/store.ts](../../lib/market-pulse/store.ts) | `tx()`: `prisma.marketPulseTopic.create` with nested `options: { create: [...] }` + audit. | |
| `listTopics({cadence?, status?})`, `getTopic` | same | `prisma.marketPulseTopic.findMany({ include: { options: true } })`. | |
| `updateTopic`, `transitionTopic` | same | `tx()`: validate `ALLOWED_TRANSITIONS`, update, write `closed_at` / `resolved_at` / `archived_at` on the matching transition, audit via `ACTION_FOR` map. On `closed → resolved`, also write a `MarketPulseSnapshot` row capturing the aggregate. | Snapshot is the production-quality answer to today's lossy aggregate (regenerated on every read). |
| `castVote({topic_id, option_id, user_id})` | same | `tx()`: validate topic active + option exists, insert `prisma.marketPulseVote.create`. Postgres UNIQUE `(topic_id, user_id)` catches replays — repository maps the unique-violation error to `{ ok: false, error: 'already_voted' }`. Audit `bazar_vote.cast`. | The DB constraint replaces today's scan-all-votes check. |
| `hasVoted(topicId, userId)` | same | `prisma.marketPulseVote.findUnique({ where: { topic_id_user_id } })` | Uses the unique index. |
| `aggregateTopic(topicId)` | same | Read from `MarketPulseSnapshot` if topic is `closed/resolved/archived`; otherwise compute live with `groupBy(option_id, _count)`. | |
| `listUserVotes(userId)`, `pickFeaturedActiveTopic()` | same | Straight finds. | |

### 2.11 `lib/gamification/repository.ts` (one file replaces `badges.ts`, `points.ts`, `activity.ts`)

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `grantBadge(userId, badgeId)` | [lib/gamification/badges.ts](../../lib/gamification/badges.ts) | `tx()`: `prisma.userBadge.upsert({ where: { user_id_badge_id }, create, update: {} })` + audit `badge.grant`. Idempotent via the unique constraint. | |
| `listUserBadges(userId)`, `userHasBadge(userId, badgeId)` | same | `prisma.userBadge.findMany / findUnique` | |
| `grantPoints(userId, action, metadata, {dedupeKey?})` | [lib/gamification/points.ts](../../lib/gamification/points.ts) | `tx()`: count today's grants for `(user_id, action)`, compare to `DAILY_CAPS[action]`, insert `prisma.pointGrant.create`, audit `point.grant`. Daily-cap check uses the `(user_id, action, granted_at)` index. | |
| `reversePoints(grantId, reason, actor)` | same | `tx()`: `prisma.pointGrant.update({ data: { reversed_at, reverse_reason } })` + audit `point.reverse`. | |
| `listUserPointGrants(userId)`, `userPointTotal(userId)` | same | `findMany` + aggregate `_sum(points)`. | |
| `listProfileActivity(userId)` | [lib/gamification/activity.ts](../../lib/gamification/activity.ts) | **Aggregator** — reads from `Lead`, `LeadEvent`, `SavedCar`, `ViewedCar`, `MarketPulseVote`, `UserBadge`, `PointGrant` (filtering reversed). Repository keeps the existing aggregation shape and returns `ActivityItem[]`. | This is read-side only — `ActivityEvent` write-path is optional in 9B and only useful when we want to materialize the timeline for high-volume users. |

### 2.12 `lib/admin/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `listAdminUsers()`, `getAdminUserById(id)` | [lib/admin/store.ts](../../lib/admin/store.ts) | `prisma.adminUser.findMany / findUnique`. | |
| `writeAudit(input)` | [lib/admin/audit.ts](../../lib/admin/audit.ts) | `prisma.auditLog.create({ data })`. Repository function preserves the exact `WriteAuditInput` signature so every caller across the codebase compiles unchanged. | The audit table is cut over **first** in 9B — see [SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md). |
| `listAuditLog({limit?, actor_id?, entity_type?, entity_id?, action?})` | same | `prisma.auditLog.findMany({ where, take, orderBy })` | Uses the `(entity_type, entity_id, created_at)` and `(actor_type, actor_id, created_at)` indexes documented in [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md). |

### 2.13 `lib/auth/repository.ts`

| Function | Current file | Prisma backing | Notes |
|---|---|---|---|
| `createOtpSession({phoneHash, purpose, code, leadId?})` | [lib/auth/otp-store.ts](../../lib/auth/otp-store.ts) | `prisma.oTPVerification.create({ data: { code_hash: hash(code), ... } })` | **Code is hashed before insert.** Raw OTP never enters the DB. |
| `getOtpSession(id)` | same | `prisma.oTPVerification.findUnique` | |
| `incrementAttempts(id)` | same | `tx()`: increment `attempts`; if `attempts >= MAX_ATTEMPTS` set `locked = true`. | |
| `markVerified(id)` | same | `prisma.oTPVerification.update({ data: { verified_at: now() } })` | |
| `checkRateLimit(phoneHash)`, `recordRequest(phoneHash)` | same | Count of `OTPVerification` rows with `created_at > now() - 1h` and same `phoneHash`. Drops the in-memory rate-limit map. | |
| `deriveUserId(phoneHash)` | same | Pure function — no DB. Stays in `lib/auth/phone.ts` adjacent module. | |

---

## 3. Transaction-boundary rules

A function is **`tx()`-wrapped** when more than one row crosses the wire:

| Function | Tables touched in one `tx()` |
|---|---|
| `transitionLead` | `Lead` + `LeadEvent` + `AuditLog` |
| `createLead` | `Lead` + `LeadEvent` (lead_submitted) |
| `transitionAdStatus` | `AdRequest` + `AuditLog` (+ optionally `ad_request.label_change`/`placement_change`) |
| `updateAdRequest` | `AdRequest` + `AuditLog` (+ optionally label/placement audits) |
| `transitionInvoice` | `Invoice` + `PaymentStatusHistory` + `AuditLog` |
| `reviewPaymentProof` (approve) | `PaymentProof` + `Invoice` + `PaymentStatusHistory` + `AuditLog` |
| `applyApprovedSubmission` | `DealerSubmission` + (`Dealer` ∨ `CatalogPrice` ∨ `DealerOffer`) + `AuditLog` (×2) |
| `transitionTopic` (to `resolved`) | `MarketPulseTopic` + `MarketPulseSnapshot` + `AuditLog` |
| `castVote` | `MarketPulseVote` + `AuditLog` |
| `grantPoints` | `PointGrant` + `AuditLog` |
| `grantBadge` | `UserBadge` + `AuditLog` |
| Any catalog `create/update` | the entity + `AuditLog` |
| `updateDealer` (with `verification_status` change) | `Dealer` + `DealerVerificationHistory` + `AuditLog` |

**Side effects outside `tx()`**: gamification hooks like `onOfficialOfferReceived(userId)` fire **after** the lead transition commits — never inside the same transaction. If a hook fails, the lead transition is already durable.

---

## 4. Read DTO rule

Repository functions **never** leak Prisma-generated types past the lib boundary. They return the same TS types defined in `lib/<domain>/types.ts` today:

- `Lead`, not `Prisma.LeadGetPayload<...>`.
- `PriceRecord`, not `CatalogPrice | DealerOffer` from `@prisma/client`.

This keeps API route handlers, components, and the `app/` tree completely insulated from the ORM choice. If 9C ever migrates off Prisma (drizzle, raw pg), the repository implementation changes; nothing above it does.

---

## 5. Client-safe lib allowlist (codified)

These are the **only** files in `lib/` that may be imported from a client component or RSC client boundary. Sprint 9B step 2 adds an ESLint rule (`@next/no-server-import-in-page` plus a custom `no-restricted-imports` config) to enforce it:

```
lib/api.ts                       (only if it stays fetch-shaped — verify in 9B)
lib/routes.ts
lib/cars/client-lookup.ts
lib/cars/format.ts               (pure functions)
lib/cars/summary.ts              (pure functions — verify no admin-store import)
lib/cars/taxonomy.ts             (pure constants)
lib/cars/generations.ts          (pure constants)
lib/compare/client-store.ts      (localStorage helpers)
lib/leads/labels.ts              (pure label maps)
lib/leads/cta.ts                 (pure helpers — verify)
lib/decisions/labels.ts
lib/dealers/labels.ts
lib/ads/labels.ts
lib/invoices/labels.ts           (if exists)
lib/payments/labels.ts           (if exists)
lib/market-pulse/labels.ts       (if exists)
lib/content/encyclopedia-categories.ts
lib/tracking/track.ts            (only if it stays fetch-shaped)
lib/tracking/events.ts           (pure type/const)
```

**Every other file in `lib/` is server-only.** Any of `lib/db/`, `lib/*/repository.ts`, `lib/admin/*`, `lib/auth/*` (except pure constant modules), `lib/*/store.ts`, `lib/*/seed.ts`, `lib/*/lookup.ts` importing from a client component is a build break.

---

## Future domains (addendum — not in 9B–9D)

Two future repository domains are documented in addendum files. They follow the same seam pattern documented in §1–§5; signatures will be authored in their respective sprints.

- `lib/vin-check/repository.ts` — Sprint 9E. See [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md) §10 for the function inventory (`validateVin`, `createRequest`, `transitionRequest`, `getQuotaForUser`, `consumeCredit`, `lookupCache`, `writeResult`, `listRequestsForUser`). Server-only; never imported from a client component. The `raw_provider_payload` field never crosses the repository → public-route boundary.
- `lib/i18n/repository.ts` — Sprint 9F. See [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md) §7 for the function inventory (`getLocale`, `listLocales`, `getContentTranslation`, `upsertContentTranslation`, `getCarSpecLabel`, `getSeoMetadata`, `getUserLanguagePreference`, `setUserLanguagePreference`, `listMissingTranslations`). Read paths may be exposed to RSC server components; write paths remain server-only.

No existing repository signature is modified by either addendum.
