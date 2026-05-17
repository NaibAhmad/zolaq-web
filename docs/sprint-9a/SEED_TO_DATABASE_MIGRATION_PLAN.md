# Seed → Database Migration Plan — Sprint 9A

Step-by-step plan for Sprint 9B execution. Sprint 9A produces no runtime change; this document is what 9B follows.

**Golden rule:** every cutover ships behind a per-domain PR. No "big bang" migration. The catalog is **last** because Sprint 8H's search / generation / komplektasiya page reads from it on every request.

---

## Phase 1 — Setup (no runtime impact)

1. Add `prisma`, `@prisma/client`, `pg` to `dependencies`. Add `prisma` to `devDependencies` as the CLI.
2. Initialize `prisma/schema.prisma` from the block in [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md).
3. Commit `prisma/migrations/0001_initial/migration.sql` (generated via `prisma migrate dev --name initial`).
4. Commit `prisma/migrations/0002_partial_indexes/migration.sql` containing the raw-SQL partial-index block from [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md) §Indexes.
5. Commit `prisma/migrations/0003_invoice_number_sequence/migration.sql`:
   ```sql
   CREATE SEQUENCE invoice_number_seq START 13;  -- preserves continuity with in-memory counter=12
   CREATE FUNCTION next_invoice_number() RETURNS TEXT AS $$
     SELECT 'ZLQ-2026-' || lpad(nextval('invoice_number_seq')::text, 4, '0')
   $$ LANGUAGE SQL;
   ```
6. Add `DATABASE_URL` documentation to README. Recommended local default: `postgresql://zolaq:zolaq@localhost:5432/zolaq_dev`.
7. Add `prisma generate` to a `postinstall` script in `package.json`.

**At end of Phase 1:** the repo compiles, `prisma generate` produces the client, but no application code imports it. Public site is untouched.

---

## Phase 2 — Repository scaffolding (no runtime impact)

For each domain in section 2 of [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md), create an empty `lib/<domain>/repository.ts` that re-exports the current store functions:

```ts
// lib/leads/repository.ts — Phase 2 scaffold
export {
  createLead,
  listLeadsForUser,
  listAllLeads,
  listLeadsForTrims,
  getLeadById,
  getLeadForUser,
  getTimelineForLead,
  transitionLead,
} from "./store";
export type { CreateLeadInput, TransitionError, TransitionResult } from "./store";
```

Add the `lib/db/prisma.ts` singleton and `lib/db/index.ts` re-export. Nothing else changes.

**At end of Phase 2:** every domain has a `repository.ts` file. They are no-op shims. Runtime is identical to today.

---

## Phase 3 — Seed loader (runs once per DB)

Create `scripts/seed-from-ts.ts`:

```ts
// One-shot. Reads the current lib/*/seed.ts exports and inserts via Prisma.
// Idempotent — every insert uses ON CONFLICT DO NOTHING via prisma.<model>.upsert.
import { prisma } from "@/lib/db/prisma";
import { BRANDS, TRIMS, DEALER_OFFERS, EXTRA_PRICES } from "@/lib/cars/seed";
import { DEALERS } from "@/lib/dealers/seed";
import { SEED_LEADS, SEED_TIMELINE } from "@/lib/leads/seed";
// ... (every seed export)

async function main() {
  // FK-respecting order — any change breaks integrity.
  await upsertBrands(BRANDS);
  await upsertModels(deriveModelsFromTrims(TRIMS));
  await upsertGenerations(deriveGenerationsFromTrims(TRIMS));
  await upsertTrims(TRIMS);
  await upsertTrimSpecs(TRIMS);                // split from Trim row
  await upsertCatalogPrices(EXTRA_PRICES);     // no dealer_id
  await upsertDealers(DEALERS);
  await upsertDealerOffers(DEALER_OFFERS);     // dealer_id required

  await upsertContent();                       // News, Encyclopedia, QA
  await upsertAdRequests();
  await upsertInvoices();
  await upsertPaymentProofs();
  await upsertMarketPulse();                   // topics → options → votes

  await upsertSeededLeads(SEED_LEADS);
  await upsertSeededTimeline(SEED_TIMELINE);
  await upsertSeededDecisions();
  await upsertSeededSavedAndViewed();

  await upsertAdminUsers();
  await upsertRoles();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
```

Run via `npx tsx scripts/seed-from-ts.ts`. **Always against a fresh DB.** Re-running is safe (idempotent), but not the migration path — the cutover PRs do not re-run the loader.

**Validation at end of Phase 3:**
- `SELECT count(*) FROM trim` matches `TRIMS.length`.
- `SELECT count(*) FROM dealer_offer WHERE offer_status='published'` matches the published-offer count today.
- Foreign key check: zero rows where `dealer_offer.trim_id` is not in `trim`, etc. (Postgres rejects the inserts if this fails — the loader fails loudly.)
- Verify `next_invoice_number()` returns `ZLQ-2026-0013`.

---

## Phase 4 — Per-domain cutover

One PR per domain. Each PR replaces the `repository.ts` shim with a real Prisma implementation, runs the per-domain QA gate (Phase 5), and ships.

**Cutover order — minimum-blast-radius first:**

| # | Domain | Why this order | Hot paths to verify |
|---|---|---|---|
| 1 | **Audit log** | Write-only. Safe to dual-write first (call old `writeAudit` *and* new repository for one PR), then cut readers. Provides a foundation every other domain needs. | `/admin/audit-log` page, `GET /api/internal/audit-log`. |
| 2 | **Content** (News, Encyclopedia, Q&A, ContentRead) | Low write volume. Lets us validate publish/unpublish state machine end-to-end before touching higher-volume domains. | Public `/news`, `/encyclopedia`, `/qa` lists; detail pages; admin publish/unpublish. |
| 3 | **Ads / Invoices / Payments** (in that sub-order inside the PR) | Internal-only routes — public site doesn't read these directly (only the active label surface). Big surface but isolated. | Dealer ad-request creation → admin approval → invoice issue → dealer payment proof → admin proof review → ad activation. Run end-to-end on staging. |
| 4 | **Bazar Nəbzi** (topics, options, votes, snapshots) | Write-heavy on votes. Critical to verify the new Postgres UNIQUE `(topic_id, user_id)` catches duplicate votes instead of today's scan-and-check. | Homepage active-topic block; vote submission; aggregate display. |
| 5 | **Gamification** (badges, points, activity) | Pure side-channel — no read path on the public catalog. Activity aggregator is read-only; can ship without writing `ActivityEvent` rows. | Profile activity timeline, badge grants on first comparison / first official offer, daily-cap enforcement. |
| 6 | **Leads** (+ LeadEvents) | Highest user-facing risk. Coordinated cut: state machine validation, OTP gating, dealer scoping, gamification hook. Requires a soak window on staging before prod. | Full lead flow: car detail → OTP → submit → internal state transition → official offer → test drive → close. |
| 7 | **Decisions / SavedCar / ViewedCar** | User-scoped reads/writes. Lower risk than Leads (no state machine). | `/profile/decisions`, `/profile/saved`, `/profile/viewed`, decision creation, history append. |
| 8 | **Dealer submissions** | Cross-domain `tx()` in `applyApprovedSubmission` is the most consequential write outside lead transitions. | Dealer submits profile edit → admin approves → dealer profile updates + audit row chain. |
| 9 | **Catalog** (Brand, Model, Generation, Trim, TrimSpec, CatalogPrice, DealerOffer, Dealer, DealerVerificationHistory) | Hot path — every public request reads from it. Longest soak window. Sprint 8H search and generation/komplektasiya filters live here. | `/cars`, `/cars/[trim_id]`, `/compare`, `/dealers`, `/dealers/[dealerId]`, admin catalog editor, all internal catalog APIs. |

**OTP cutover** is included in Phase 4 Step 9's catalog PR (small, no API change) — but if the team prefers, it can ship as its own tiny PR between Step 8 and 9.

---

## Phase 5 — Per-domain QA gate (run BEFORE merging each cutover PR)

For each cutover PR:

1. Run the relevant subset of [docs/SPRINT_1_6_QA_CHECKLIST.md](../SPRINT_1_6_QA_CHECKLIST.md) (use the domain anchor — e.g., "Sprint 3 — Leads" for the Leads cutover).
2. Run [docs/sprint-8g/REGRESSION_CHECKLIST.md](../sprint-8g/REGRESSION_CHECKLIST.md) in full. Any failure blocks the PR.
3. Manually verify the hot paths in the table above.
4. For state-machine domains (Leads, Ads, Invoices, Bazar topics, Submissions): walk every transition once on staging and assert the audit row is written.
5. Smoke test: kill the dev server, restart, confirm the data is still there (this is the whole point of the migration — if data is lost on restart, the cutover is incomplete).
6. **Rollback test:** before merging, revert the repository file to its Phase 2 shim and confirm the app still runs against the in-memory store. This proves the rollback path works.

---

## Phase 6 — Deprecation cleanup (single final PR)

After all nine domain cutovers ship and have soaked for at least one week:

1. Delete `lib/*/store.ts` shims that now only re-export from `repository.ts`.
2. Update any remaining `app/api/**` import that still references `@/lib/<domain>/store` to use `@/lib/<domain>/repository`.
3. Delete `lib/*/seed.ts` files whose only remaining importer is `scripts/seed-from-ts.ts`. (The loader can hold inline copies if needed — but most seeds will simply move into a `prisma/seed/` folder as JSON or stay deleted entirely now that the DB is authoritative.)
4. **Keep** `lib/cars/client-lookup.ts`. It is the client-safe brand/trim lookup — bundled, immutable, no DB call. It is the only seed-shaped export that survives.
5. Delete `globalThis.__zlq_*_store` and `__zlq_audit_store` guards across the codebase (they have no effect once the underlying Map is gone).
6. Audit: `git grep -E "globalThis.*__zlq"` should return zero matches.

---

## Phase 7 — Post-migration (not in scope of Sprint 9B, but documented for the team)

- Add a background job for `OTPVerification` cleanup: `DELETE FROM otp_verification WHERE expires_at < now() - interval '7 days' AND verified_at IS NULL` (daily).
- Add a background job for `DealerOffer.offer_status = 'published' AND valid_until < now()` → transition to `expired` + audit.
- Add a background job for invoice `overdue` flip when `status='invoice_sent' AND due_at < now()`.
- Add a Postgres backup policy (Neon / Supabase native; or `pg_dump` on cron).
- Add observability: log slow queries (>100ms) from Prisma; export `prisma_query_duration_seconds` to whatever metrics sink the team picks.

---

## What is **not** migrated in 9A or 9B

- `CompareSession` — stays in `localStorage` via [lib/compare/client-store.ts](../../lib/compare/client-store.ts).
- Tracking events posted to `app/api/events/route.ts` — stay validate-and-drop. Persistence requires a sink (Segment / BigQuery / etc.) and is out of MVP scope.
- WhatsApp Business API integration — explicitly out of scope per the sprint brief.
- Online payments — out of scope; manual `PaymentProof` flow remains the only path.

---

## Risk table — cutover-specific

| Risk | Where it bites | Mitigation |
|---|---|---|
| Seed loader inserts wrong FK because a derived `model_id` slug differs | Phase 3 Brand→Model→Trim chain | The slug derivation function in `lib/admin/catalog-store.ts` (`deriveModelId`) is the source — copy it byte-for-byte into the loader. Run integrity check (FK violations are loud). |
| Catalog cutover (Step 9) breaks Sprint 8H search | `/cars` page | Catalog ships LAST with longest soak. Pre-flight: assert `searchTrims()` returns identical row count + ordering on staging vs in-memory baseline. |
| `transitionLead` `tx()` boundary missed → audit gap | Lead cutover (Step 6) | Audit row is written **inside** the same `prisma.$transaction` as the `Lead` update and `LeadEvent` insert. Test: simulated `tx()` rollback must leave zero audit, zero event, zero state change. |
| Invoice number collision after restart | Invoice cutover (Step 3) | Sequence-backed `next_invoice_number()` SQL function (Phase 1, migration 0003) — no more in-memory counter. Sequence starts at 13 to preserve continuity. |
| Duplicate vote slips through | Bazar cutover (Step 4) | Postgres UNIQUE `(topic_id, user_id)` constraint enforces. Repository catches `P2002` and returns the existing `{ ok: false, error: 'already_voted' }` shape. |
| Gamification hook fires before lead `tx()` commits | Lead cutover (Step 6) | Side effects called **after** `await tx(...)` returns. Audit step proves this with a rollback test. |
| Stale `globalThis` Map outlives the cutover | Any cutover | Each cutover PR deletes the Map bootstrap in the same PR that flips the repository — no dual-source window. |
| Dealer sees another dealer's leads | Lead / Invoice / AdRequest cutovers | Dealer-scoped repository functions enforce `WHERE dealer_id = session.dealerId`. See [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md). |
| Raw phone or OTP code leaks to DB | OTP cutover (Step 9 or its own) | `OTPVerification.code_hash` stores a SHA-256 of the code with the OTP salt, never the raw code. Phone columns are `phone_hash`-only (Citext). |
