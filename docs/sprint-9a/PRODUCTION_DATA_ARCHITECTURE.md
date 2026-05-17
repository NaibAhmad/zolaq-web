# Production Data Architecture — Sprint 9A

**Status:** documentation-only. No runtime change in 9A.
**Scope:** freeze the data architecture that Sprint 9B will implement.
**Locked decisions:** ORM = **Prisma**, DB = **PostgreSQL**.

---

## 1. Why now

Sprint 8H closed at **operation-ready MVP**. Every mutable store in `lib/` is a `globalThis`-pinned `Map<>` bootstrapped from a static `seed.ts` export. On any server restart we lose every lead, decision, vote, badge grant, dealer submission, audit row, ad request, invoice, payment proof, and market-pulse vote. The product cannot ship to production in that state.

Sprint 9A's job is to **freeze the data architecture** so 9B can implement persistence without re-arguing entity shapes, enums, FKs, or repository boundaries.

We are not migrating runtime in 9A. We are not touching UI. We are not touching `app/` routes. We are not adding dependencies. We are writing the nine docs in this folder.

---

## 2. Current state — confirmed

| Domain | Types | Seed | Store (mutable) | Public lookup | Client-safe lookup |
|---|---|---|---|---|---|
| Catalog (Brand, Model, Generation, Trim, Price, DealerOffer) | [lib/cars/types.ts](../../lib/cars/types.ts) | [lib/cars/seed.ts](../../lib/cars/seed.ts) | [lib/admin/catalog-store.ts](../../lib/admin/catalog-store.ts) | [lib/cars/lookup.ts](../../lib/cars/lookup.ts) | [lib/cars/client-lookup.ts](../../lib/cars/client-lookup.ts) |
| Dealer | [lib/dealers/types.ts](../../lib/dealers/types.ts) | [lib/dealers/seed.ts](../../lib/dealers/seed.ts) | [lib/admin/dealer-store.ts](../../lib/admin/dealer-store.ts) | [lib/dealers/lookup.ts](../../lib/dealers/lookup.ts) | — |
| Dealer Submissions | [lib/dealer/submissions/types.ts](../../lib/dealer/submissions/types.ts) | — | [lib/dealer/submissions/store.ts](../../lib/dealer/submissions/store.ts) | server-only | — |
| Lead, LeadEvent | [lib/leads/types.ts](../../lib/leads/types.ts) | [lib/leads/seed.ts](../../lib/leads/seed.ts) | [lib/leads/store.ts](../../lib/leads/store.ts) + [lib/leads/state-machine.ts](../../lib/leads/state-machine.ts) | user-scoped | — |
| Decision, SavedCar, ViewedCar | [lib/decisions/types.ts](../../lib/decisions/types.ts) | [lib/decisions/seed.ts](../../lib/decisions/seed.ts) | [lib/decisions/store.ts](../../lib/decisions/store.ts) | user-scoped | — |
| Compare | — | — | [lib/compare/client-store.ts](../../lib/compare/client-store.ts) (localStorage) | — | client-only |
| Content (News, Encyclopedia, Q&A) | [lib/content/types.ts](../../lib/content/types.ts) | [lib/content/seed.ts](../../lib/content/seed.ts) | [lib/content/admin-store.ts](../../lib/content/admin-store.ts) | [lib/content/lookup.ts](../../lib/content/lookup.ts) | — |
| AdRequest | [lib/ads/types.ts](../../lib/ads/types.ts) | [lib/ads/seed.ts](../../lib/ads/seed.ts) | [lib/ads/store.ts](../../lib/ads/store.ts) | server-only | — |
| Invoice | [lib/invoices/types.ts](../../lib/invoices/types.ts) | [lib/invoices/seed.ts](../../lib/invoices/seed.ts) | [lib/invoices/store.ts](../../lib/invoices/store.ts) | server-only | — |
| PaymentProof | [lib/payments/types.ts](../../lib/payments/types.ts) | [lib/payments/seed.ts](../../lib/payments/seed.ts) | [lib/payments/store.ts](../../lib/payments/store.ts) | server-only | — |
| Bazar Nəbzi (Topic, Option, Vote) | [lib/market-pulse/types.ts](../../lib/market-pulse/types.ts) | [lib/market-pulse/seed.ts](../../lib/market-pulse/seed.ts) | [lib/market-pulse/store.ts](../../lib/market-pulse/store.ts) | server-only | — |
| Badges, Points, Activity | — | — | [lib/gamification/badges.ts](../../lib/gamification/badges.ts), [lib/gamification/points.ts](../../lib/gamification/points.ts), [lib/gamification/activity.ts](../../lib/gamification/activity.ts) | server-only | — |
| AdminUser | [lib/admin/types.ts](../../lib/admin/types.ts) | [lib/admin/seed.ts](../../lib/admin/seed.ts) | [lib/admin/store.ts](../../lib/admin/store.ts) | server-only | — |
| AuditLog | [lib/admin/types.ts](../../lib/admin/types.ts) | — | [lib/admin/audit.ts](../../lib/admin/audit.ts) (append-only globalThis array) | server-only | — |
| OTP, Session | [lib/auth/session.ts](../../lib/auth/session.ts), [lib/auth/otp-store.ts](../../lib/auth/otp-store.ts) | — | globalThis Map + base64 cookie | server-only | — |
| Tracking events | [lib/tracking/events.ts](../../lib/tracking/events.ts) | — | [app/api/events/route.ts](../../app/api/events/route.ts) (validate-and-drop) | server-only | — |

**Universal pattern.** Every server store is a `globalThis`-pinned `Map<>` (HMR-safe). Public lookups delegate to admin stores and filter by `status === "published" / "active"`. Seed exports are immutable. **This is the migration seam:** 9B replaces the Map layer with a Prisma repository without changing API route shapes.

**No ORM, no migrations folder, no DB driver in `package.json`.** Stack today: `next@16.2.6`, `react@19.2.4`, `tailwindcss@4`, `eslint@9`, `typescript@5`. Sprint 9A adds nothing.

---

## 3. Target state

```
 ┌────────────────────────────────────────────────────────────┐
 │  app/api/**/route.ts            (UNCHANGED in 9B)          │
 │     │                                                       │
 │     │  imports from lib/<domain>/store today;               │
 │     │  imports from lib/<domain>/repository after 9B        │
 │     ▼                                                       │
 │  lib/<domain>/repository.ts     (NEW in 9B — same API as    │
 │     │                            today's store.ts)          │
 │     ▼                                                       │
 │  lib/db/prisma.ts               (singleton, HMR-guarded)    │
 │     │                                                       │
 │     ▼                                                       │
 │  Prisma client → PostgreSQL                                 │
 └────────────────────────────────────────────────────────────┘
```

### The four storage tiers we recognize going forward

1. **Static seed** — client-safe lookup data (brand display names, body-type labels, enum copy). Bundled, immutable, never DB-backed. Currently: `lib/cars/client-lookup.ts`, all `lib/*/labels.ts`.
2. **Read-through cache of DB** — catalog DTOs the public site renders. DB-backed; in-process LRU is optional in 9B (defer until measured).
3. **Mutable DB tables** — everything currently in a `Map<>`.
4. **Per-request ephemeral** — OTP codes pre-verification (Map keyed by `phone_hash`, TTL ≤ 5 min) and tracking events (validate-and-drop today; will become an append-only events sink in 9B step 9.x but is *not* in scope for the 9A entity list).

---

## 4. Decision log

| Decision | Choice | Rationale |
|---|---|---|
| ORM | **Prisma** | Declarative `schema.prisma`, generated typed client, mature migrations, matches the shape of existing `lib/*/types.ts`, well-supported on Next.js App Router runtime. |
| DB | **PostgreSQL** | Native enums (every `XXX_STATUSES as const` becomes one), `JSONB` for `AuditLog.before/after` and ad/invoice metadata, partial indexes for `DealerOffer WHERE offer_status='published'`, mature hosting (Neon / Supabase / Vercel Postgres). |
| Primary-key strategy | Preserve all existing `${prefix}_${uuid}` natural keys (`trim_id`, `lead_id`, `bz_*`, `adr_*`, `inv_*`, `pp_*`, `bdg_*`, `pg_*`, `audit_*`). New tables introduced in 9A (TrimSpec, ContentRead, PaymentStatusHistory, AdPackage, AdPlacement, DealerVerificationHistory, MarketPulseSnapshot, Role, AdminUserRole) use `cuid()`. | URLs and audit history already reference the prefixed UUIDs; changing them would invalidate every existing seed row, decision-history row, audit row, and every share URL the client has bookmarked. |
| Timestamps | `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL` on every mutable table. Existing TS types use `number` (epoch ms) — repository translates at the boundary. | Postgres-native time types beat opaque ms ints for ops queries; type translation hides at the repository layer. |
| Enums | Postgres native enums for every closed set listed in `ENUMS_AND_STATUS_CODES.md`. | Mirrors the `as const` arrays already in code; schema-level guarantee instead of app-level guard. |
| Catalog split | `PriceRecord` is split in the DB into `CatalogPrice` (no dealer) and `DealerOffer` (dealer-bound, lifecycle). Repository collapses them back into the existing `PriceRecord` union shape. | Today's [`lib/cars/types.ts`](../../lib/cars/types.ts) `PriceRecord` carries both flavors via optional dealer fields — a single table can't enforce "dealer fields required when offer_status set" without a check constraint, and conflating them obstructs partial indexes. The repository's `getPriceForTrim()` keeps API consumers untouched. |
| Compare | Stays in `localStorage`. No `CompareSession` DB table. | Compare is selection state, not user history. The existing [`lib/compare/client-store.ts`](../../lib/compare/client-store.ts) is correct. |
| Tracking events | Stay validate-and-drop in 9A's scope. `ActivityEvent` (gamification timeline) is distinct and *is* persisted. | Tracking events are analytics-grade; durability requires sinks (Segment / BigQuery) out of MVP scope. |

---

## 5. Non-goals (explicit)

- No UI changes.
- No route changes (public or admin).
- No new product scope, no marketplace, no private-seller flow.
- No online payments, no WhatsApp Business API.
- No Lead/OTP flow changes (except documenting production requirements).
- No catalog runtime migration — catalog is the **last** domain to cut in 9B.
- No commit at end of Sprint 9A.

---

## 6. Where to read next

1. [ENTITY_RELATIONSHIP_MAP.md](ENTITY_RELATIONSHIP_MAP.md) — the entity graph.
2. [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md) — the Prisma schema draft.
3. [ENUMS_AND_STATUS_CODES.md](ENUMS_AND_STATUS_CODES.md) — every enum and every state machine.
4. [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) — the seam between API and Prisma.
5. [SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) — seed loader and cutover order.
6. [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md) — invariants the schema must preserve.
7. [AUDIT_LOG_REQUIREMENTS.md](AUDIT_LOG_REQUIREMENTS.md) — audit table spec.
8. [SPRINT_9B_IMPLEMENTATION_PLAN.md](SPRINT_9B_IMPLEMENTATION_PLAN.md) — ticket-sized 9B work.

---

## Future addendums (out of 9B–9D scope)

Two future-ready architecture concerns are documented separately and are **not** part of Sprint 9B–9D (PASS, frozen). Sprint 9B implements only the architecture documented in this file and its siblings above; the two addendums below describe architecture for later sprints.

- [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md) — Zolaq VIN Check / Vehicle History (recommended Sprint 9E). New entities/enums; new repository domain `lib/vin-check/`; strict one-way boundary from VIN signals to pricing/recommendation/verification.
- [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md) — AZ/RU/EN i18n (recommended Sprint 9F). New entities (`Locale`, `ContentTranslation`, etc.); per-locale SEO; admin translation workflow; **no modification of existing tables**.
