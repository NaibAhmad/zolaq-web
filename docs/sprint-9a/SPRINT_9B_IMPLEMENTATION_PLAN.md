# Sprint 9B Implementation Plan

Ticket-sized breakdown of the work Sprint 9B executes. Every ticket maps to one PR; every PR has a rollback path. Source of truth for what's in each ticket is the linked sibling doc in this folder.

---

## Ticket 9B-01 — Infrastructure setup
**Estimate:** 1 day. **Risk:** low. **PR scope:** ~6 files.

**Work:**
1. Add deps to `package.json`:
   - `dependencies`: `@prisma/client`, `pg`.
   - `devDependencies`: `prisma`, `tsx`.
2. Add scripts:
   - `"postinstall": "prisma generate"`
   - `"db:migrate": "prisma migrate deploy"`
   - `"db:reset": "prisma migrate reset --force && npx tsx scripts/seed-from-ts.ts"`
   - `"db:seed": "npx tsx scripts/seed-from-ts.ts"`
3. Commit `prisma/schema.prisma` — copy the block from [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md).
4. Generate initial migration: `npx prisma migrate dev --name initial` → commit `prisma/migrations/0001_initial/`.
5. Author and commit `prisma/migrations/0002_partial_indexes/migration.sql` from the partial-index block in [DATABASE_SCHEMA_DRAFT.md](DATABASE_SCHEMA_DRAFT.md) §Indexes.
6. Author and commit `prisma/migrations/0003_invoice_number_sequence/migration.sql` from [SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) Phase 1 step 5.
7. Author and commit `prisma/migrations/0004_ad_request_label_constraint/migration.sql`:
   ```sql
   ALTER TABLE ad_request ADD CONSTRAINT ad_request_active_requires_label
     CHECK (status NOT IN ('approved','paid','active','paused') OR label IS NOT NULL);
   ```
8. Add `DATABASE_URL` documentation block to `README.md` (or `.env.example`).
9. Verify `npm run build` still passes.

**Acceptance:**
- `prisma generate` produces the client.
- `prisma migrate deploy` against an empty Postgres creates 41 tables and the partial indexes.
- No application code imports the client yet; runtime is unchanged.

**Rollback:** revert the PR. No app code touches Prisma yet.

---

## Ticket 9B-02 — Repository scaffolding
**Estimate:** 1 day. **Risk:** low. **PR scope:** ~15 new files.

**Work:**
1. Create `lib/db/prisma.ts` (singleton with HMR guard — code in [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §1).
2. Create `lib/db/index.ts` exporting `prisma`, generated enum types, and a `tx<T>()` helper.
3. Create `lib/security/pii-guard.ts` with `assertNoPii(obj)` referencing `BANNED_PII_KEYS`.
4. Create empty `lib/<domain>/repository.ts` for each domain in [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §2 — each one re-exports from the existing `store.ts` (no Prisma yet). Domains:
   - `lib/cars/repository.ts`
   - `lib/dealers/repository.ts`
   - `lib/dealer/submissions/repository.ts`
   - `lib/leads/repository.ts`
   - `lib/decisions/repository.ts`
   - `lib/content/repository.ts`
   - `lib/ads/repository.ts`
   - `lib/invoices/repository.ts`
   - `lib/payments/repository.ts`
   - `lib/market-pulse/repository.ts`
   - `lib/gamification/repository.ts`
   - `lib/admin/repository.ts`
   - `lib/auth/repository.ts`
5. Add ESLint rule from [SECURITY_AND_ACCESS_RULES.md](SECURITY_AND_ACCESS_RULES.md) R2.1.
6. Run `npm run lint` — confirm zero new violations.

**Acceptance:** every domain has a `repository.ts` shim. App runs identically to today. ESLint blocks future client-bundle leaks.

**Rollback:** revert the PR.

---

## Ticket 9B-03 — Seed loader
**Estimate:** 1 day. **Risk:** low. **PR scope:** 1 new script + tests.

**Work:**
1. Create `scripts/seed-from-ts.ts` per [SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) Phase 3.
2. Implement per-table upsert helpers (FK-respecting order).
3. Implement model/generation derivation from `TRIMS` (using `deriveModelId` byte-for-byte from [lib/admin/catalog-store.ts](../../lib/admin/catalog-store.ts)).
4. Validation queries inline at end-of-script (assert row counts match seed export lengths; assert zero FK violations — Postgres rejects bad inserts so this is automatic).
5. Run against a fresh local Postgres; commit a sample `db.log` of expected output.

**Acceptance:** `npm run db:reset` wipes and re-seeds a local DB in <30s; row counts match seed.

**Rollback:** delete the script file.

---

## Ticket 9B-04 — Audit log cutover (FIRST domain cutover)
**Estimate:** 1 day. **Risk:** medium (every other domain depends on this). **PR scope:** ~3 files.

**Work:**
1. Implement `prisma.auditLog.create` + `findMany` in `lib/admin/repository.ts`.
2. Update `lib/admin/audit.ts`:
   - `writeAudit` becomes async, awaits `prisma.auditLog.create`. (Callers must be updated to await — search for `writeAudit(` and add `await`.)
   - `listAuditLog` becomes async, queries Prisma.
3. Helper `toAuditSnapshot(entity)` lives next to `writeAudit`.
4. Wire the `assertNoPii` guard.
5. Run QA gate ([SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) Phase 5): trigger one mutation per domain, confirm an audit row appears in the DB and survives restart.

**Acceptance:** every existing call site of `writeAudit` compiles (with `await` added); `/admin/audit-log` page renders rows from the DB.

**Rollback:** revert PR; `writeAudit` reverts to the in-memory array.

---

## Tickets 9B-05 → 9B-12 — Per-domain cutovers (8 tickets)

Each ticket follows the same template — one per domain in the order from [SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) Phase 4:

| Ticket | Domain | Order # | Notes |
|---|---|---|---|
| 9B-05 | Content (News, Encyclopedia, Q&A, ContentRead) | 2 | Adds `recordContentRead()` — new repository function. |
| 9B-06 | Ads / Invoices / Payments | 3 | Three sub-domains in ONE PR; they share the ad-request → invoice → payment lifecycle. Sequence-backed invoice numbering goes live here. |
| 9B-07 | Bazar Nəbzi | 4 | Postgres UNIQUE replaces scan-and-check vote dedup. |
| 9B-08 | Gamification | 5 | Daily-cap query path uses `(user_id, action, granted_at)` index. |
| 9B-09 | Leads + LeadEvents | 6 | Highest-risk ticket; allow 2 days. State machine validation stays in code; `tx()` wraps update + event + audit. |
| 9B-10 | Decisions / SavedCar / ViewedCar | 7 | Includes JSONB array reads (`candidate_trim_ids`, `lead_ids`). |
| 9B-11 | Dealer submissions | 8 | `applyApprovedSubmission` is the most consequential `tx()`. |
| 9B-12 | Catalog (Brand, Model, Generation, Trim, TrimSpec, CatalogPrice, DealerOffer, Dealer, DealerVerificationHistory) + OTP/User | 9 | Last. Allow 2 days. Soak window: 1 week on staging before prod. |

**Per-ticket template:**

**Work:**
1. Implement Prisma queries in `lib/<domain>/repository.ts` per [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §2.
2. Wrap multi-table writes in `tx()` per [REPOSITORY_LAYER_PLAN.md](REPOSITORY_LAYER_PLAN.md) §3.
3. Add DTO mappers (`fromPrisma()`) so returns match `lib/<domain>/types.ts` exactly.
4. Update `lib/<domain>/store.ts` to re-export from `repository.ts` (becomes a one-line shim).
5. Delete the `globalThis.__zlq_*_store` bootstrap in the same PR.
6. Run QA gate (Phase 5 of migration plan):
   - Domain-specific QA checklist subset.
   - Full `docs/sprint-8g/REGRESSION_CHECKLIST.md`.
   - Hot paths (per [SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) Phase 4 table).
   - Rollback test before merging.

**Acceptance:** all listed hot paths work; data survives restart; audit rows written for every mutation.

**Rollback:** revert the PR — `repository.ts` returns to no-op shim, `store.ts` returns to globalThis Map.

---

## Ticket 9B-13 — Soak and verify (CATALOG soak)
**Estimate:** 1 week (calendar). **Risk:** low (no code change). **PR scope:** zero — just observation.

**Work:** after 9B-12 ships to staging, monitor for 7 days. Watch for:
- Query latency on `/cars` and `/cars/[trim_id]` (target: p95 < 200ms).
- Error rate on internal catalog APIs.
- Any Sentry/log noise around `Prisma`.

If clean, deploy to prod and continue to 9B-14.

If problems surface, roll back 9B-12 (catalog returns to in-memory). Investigate. Re-ship.

---

## Ticket 9B-14 — Deprecation cleanup
**Estimate:** 0.5 day. **Risk:** low. **PR scope:** delete-only.

**Work:**
1. Delete `lib/*/store.ts` shims (now one-liners).
2. Update `app/api/**` imports from `@/lib/<domain>/store` → `@/lib/<domain>/repository`.
3. Delete `lib/*/seed.ts` files whose only importer is `scripts/seed-from-ts.ts`. (Keep `lib/cars/client-lookup.ts` and any seed file still imported by it.)
4. Delete `globalThis.__zlq_*` guards across the codebase.
5. Verify: `git grep -E "globalThis.*__zlq"` → zero matches; `git grep "@/lib/.*/store" app/` → zero matches.
6. Run `npm run build` + `npm run lint` — both pass.

**Acceptance:** the in-memory store architecture is fully gone. Every read and write flows through Prisma.

**Rollback:** revert PR.

---

## Ticket 9B-15 — Background jobs (DEFER if time-constrained)
**Estimate:** 1 day. **Risk:** low. **PR scope:** ~3 cron entries + handler files.

Listed in [SEED_TO_DATABASE_MIGRATION_PLAN.md](SEED_TO_DATABASE_MIGRATION_PLAN.md) Phase 7. Implementations:

1. **OTP cleanup** (`scripts/jobs/expire-otps.ts`): daily `DELETE FROM otp_verification WHERE expires_at < now() - interval '7 days' AND verified_at IS NULL`.
2. **DealerOffer expiry** (`scripts/jobs/expire-offers.ts`): hourly — find published offers where `valid_until < now()`, transition to `expired` + write audit. Uses the repository's `updateOfferById`.
3. **Invoice overdue** (`scripts/jobs/mark-overdue-invoices.ts`): hourly — find `invoice_sent` invoices where `due_at < now()`, transition to `overdue` + write audit.

**Acceptance:** jobs run on schedule (Vercel cron / external scheduler); audit rows confirm execution.

**Rollback:** disable the cron entry.

---

## Sequencing summary

```
Week 1:  9B-01 ──► 9B-02 ──► 9B-03 ──► 9B-04 (audit cutover)
Week 2:  9B-05 ──► 9B-06 ──► 9B-07 ──► 9B-08
Week 3:  9B-09 (leads, 2 days) ──► 9B-10 ──► 9B-11
Week 4:  9B-12 (catalog, 2 days) ──► 9B-13 (soak begins)
Week 5:  9B-13 (soak continues) ──► 9B-14 (cleanup)
Optional: 9B-15 (background jobs)
```

Total: 4 weeks for the core migration, 1 week for the catalog soak. Background jobs (9B-15) can ship in parallel or defer to a follow-up sprint.

---

## Dependencies and assumptions

- A managed Postgres exists for staging and prod (Neon / Supabase / Vercel Postgres — decision out of scope; any one works with the schema).
- The team can run `prisma migrate deploy` in CI/CD against staging and prod (one-line addition to the deploy script).
- `DATABASE_URL` is available as a secret in Vercel (or wherever the app runs).
- The Sprint 8H search/komplektasiya code is **not** modified during 9B. The catalog cutover (9B-12) preserves every signature in `lib/cars/lookup.ts` and `lib/cars/client-lookup.ts`.

---

## Out of scope for Sprint 9B (per the original sprint brief)

- New product features.
- UI changes.
- Route changes.
- Marketplace / private-seller flow.
- Online payments.
- WhatsApp Business API.
- Lead/OTP flow changes beyond what's required for persistence.
- Tracking-event persistence (sink decision pending).
- `ActivityEvent` write path (aggregator read-path is enough for MVP).
- Audit log retention/archival policy.

---

## Out of scope — future sprints

Two architecture addendums describe features that are **not** part of Sprint 9B–9D (PASS, frozen). No ticket above is altered by this section; the addendums are read-only references for sprint planning.

### Sprint 9E — Zolaq VIN Check

See [VIN_CHECK_ARCHITECTURE_ADDENDUM.md](VIN_CHECK_ARCHITECTURE_ADDENDUM.md).

- New repository domain `lib/vin-check/`.
- 6 new tables (`VinCheckRequest`, `VinCheckResult`, `VinCheckProvider`, `VinCheckQuota`, `VinCheckCredit`, `VinCheckCache`).
- 5 new Prisma enums (`VinCheckStatus`, `VinReportType`, `VinRiskLevel`, `VinRiskFlag`, `QuotaSource`).
- 12 new `AuditAction` strings.
- 10 new security rules (R11.1–R11.10).
- **Strict one-way boundary** from VIN signals to pricing/recommendation/verification.
- No "Free Carfax" / "Carfax" / "AutoCheck" naming.

### Sprint 9F — i18n (AZ / RU / EN)

See [I18N_MULTILINGUAL_ARCHITECTURE.md](I18N_MULTILINGUAL_ARCHITECTURE.md).

- New repository domain `lib/i18n/`.
- 7 new tables (`Locale`, `TranslationKey`, `ContentTranslation`, `CarSpecTranslation`, `SeoMetadataTranslation`, `UserLanguagePreference`, `AdminTranslationWorkflow`).
- 0 new Prisma enums (statuses live as `String` + TS unions).
- 4 new `AuditAction` strings.
- 6 new security rules (R12.1–R12.6).
- **No modification of existing 9A/9B tables.** Translations are additive overlays.
- Localized routes `/ru/...`, `/en/...`; AZ remains prefix-less default.

Both addendums are documentation-only at this point. Sprint 9B–9D ship as planned in §Tickets 9B-01 through the existing list above.
