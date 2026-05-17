# Sprint 10 — DB Migration & Seed Runbook

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Use:** First-time staging bootstrap, and ongoing migration of schema changes during closed beta.

## Pre-flight

Before running any migration command against staging:

- [ ] Read the broader [docs/sprint-9i/DATABASE_MIGRATION_RUNBOOK.md](../sprint-9i/DATABASE_MIGRATION_RUNBOOK.md) — covers the underlying Prisma migration model and rollback nuances.
- [ ] Confirm a fresh DB snapshot exists (Vercel Postgres / Supabase one-click snapshot).
- [ ] Confirm both `DATABASE_URL` and `DIRECT_URL` are correct and the direct URL is **not** routed through PgBouncer.
- [ ] Confirm the local `prisma/schema.prisma` matches the version of the code being deployed.

## 1. First-time staging bootstrap

Run these in order from a local shell with the staging URLs exported. Do **not** run any of them from inside a Vercel build.

### Step 1 — Generate the initial migration locally (one-time)

The `prisma/migrations/` directory is currently empty. The first migration must be generated against a real Postgres database; SQLite or in-memory will not produce the right SQL for production Postgres.

```bash
# Point at a LOCAL Postgres (or a disposable staging-shaped DB) first
export DATABASE_URL="postgresql://user:pass@localhost:5432/zolaq_dev?schema=public"
export DIRECT_URL="$DATABASE_URL"

npx prisma migrate dev --name initial
```

This produces `prisma/migrations/<timestamp>_initial/migration.sql`. **Commit this file** — it is the canonical initial schema for every future environment.

### Step 2 — Apply the migration to staging

```bash
# Now point at staging
export DATABASE_URL="<staging pooled URL>"
export DIRECT_URL="<staging direct URL>"

npx prisma migrate deploy
```

`migrate deploy` only applies pending migrations; it never auto-generates new ones. Safe to run in CI / from any operator shell.

### Step 3 — Run the seed

```bash
npm run db:seed
```

This invokes [prisma/seed.ts](../../prisma/seed.ts), which idempotently upserts:

- Brands, Models, Generations, Trims, TrimSpecs from [lib/cars/seed.ts](../../lib/cars/seed.ts).
- Dealers + initial DealerOffers from [lib/dealers/seed.ts](../../lib/dealers/seed.ts).
- CatalogPrice rows for the seeded trims.

Idempotent — safe to re-run after every deploy.

### Step 4 — Bootstrap the initial admin

Verify `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, and (optionally) `INITIAL_ADMIN_NAME` are set in the shell that will run this command. They do **not** need to be set in Vercel — the script runs locally against staging Postgres.

```bash
npm run bootstrap:admin
```

This calls [scripts/bootstrap-admin.ts](../../scripts/bootstrap-admin.ts) which:

- Hashes `INITIAL_ADMIN_PASSWORD` with bcrypt.
- Upserts the AdminUser row (idempotent by email).
- Assigns the `super_admin` role.
- Refuses to log the password.

Re-running the command with the same email is a no-op except for the password hash, which is re-computed.

### Step 5 — Verify tables exist

Connect to the staging DB via `psql` or Vercel Postgres / Supabase SQL console:

```sql
\dt
```

Expected tables (18):

```
AdminSession        DealerOffer      MediaUsage
AdminUser           DealerSession    Model
AdminUserRole      DealerUser       OtpAttempt
AuditLog           Generation       Trim
Brand              MediaAsset       TrimSpec
CatalogPrice       Dealer
```

Spot-check row counts:

```sql
SELECT COUNT(*) FROM "Brand";          -- expect > 0 (seed data)
SELECT COUNT(*) FROM "AdminUser";      -- expect 1
SELECT COUNT(*) FROM "AdminUserRole";  -- expect 1 (super_admin)
SELECT COUNT(*) FROM "OtpAttempt";     -- expect 0 (no OTPs issued yet)
```

### Step 6 — Smoke from the app side

After the deploy is live, hit `/api/health` and confirm `database.connected: true`. Then sign in to `/admin/login` with the bootstrap credentials.

## 2. Ongoing migrations during closed beta

Every time `prisma/schema.prisma` changes:

1. From a local dev DB:
   ```bash
   npx prisma migrate dev --name <short_kebab_description>
   ```
2. Review the generated SQL under `prisma/migrations/<timestamp>_<name>/migration.sql`.
3. Commit both the schema change and the migration SQL.
4. After deploy, from a local shell pointed at staging:
   ```bash
   export DATABASE_URL="<staging pooled>"
   export DIRECT_URL="<staging direct>"
   npx prisma migrate deploy
   ```
5. Re-run `npm run db:seed` if the migration adds new seed-relevant tables.

## 3. Fallback-mode safety (dev only)

The app supports a **fallback mode** in development when `DATABASE_URL` is unset:

- Documented in [docs/sprint-9b/FALLBACK_MODE.md](../sprint-9b/FALLBACK_MODE.md).
- In-memory `globalThis` stores back the catalog repository.
- `AuditLog` writes are non-persistent.
- OTP store falls back to in-memory (loses state on restart).

**Fallback mode is dev-only.** Staging and production must always have `DATABASE_URL` set; `/api/health` returns 503 in production when it isn't.

Do NOT remove the fallback path — it's used by contributors who clone the repo without a Postgres setup.

## 4. Destructive commands — DO NOT RUN without explicit approval

These commands are documented for completeness. **Do not run them against staging without an incident ticket and an approver.**

| Command | What it does | When (if ever) |
|---|---|---|
| `npx prisma migrate reset` | Drops all data, drops all tables, re-runs every migration, then re-runs the seed. | Only acceptable on a personal dev DB. Never staging or production. |
| `npx prisma db push --force-reset` | Force-resets the DB to match the current schema, bypassing the migrations folder. | Never on a shared environment. |
| `DROP TABLE …` direct SQL | Drops a single table irrecoverably. | Only as part of an approved incident-recovery procedure. |

## 5. Rollback

Migration rollback procedure: [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md) §2. The short version: restore from the pre-migration snapshot, then re-apply only the migrations that were intended.

Prisma does not generate "down" migrations. The forward-only model is intentional — rollback always uses snapshots, never reverse SQL.

## Cross-references

- [prisma/schema.prisma](../../prisma/schema.prisma) — current schema source
- [prisma/seed.ts](../../prisma/seed.ts) — seed entry point
- [scripts/bootstrap-admin.ts](../../scripts/bootstrap-admin.ts) — admin bootstrap script
- [docs/sprint-9i/DATABASE_MIGRATION_RUNBOOK.md](../sprint-9i/DATABASE_MIGRATION_RUNBOOK.md) — Sprint 9 broader runbook
- [docs/sprint-9b/FALLBACK_MODE.md](../sprint-9b/FALLBACK_MODE.md) — dev fallback contract
- [docs/sprint-9f/MIGRATION_PLAN.md](../sprint-9f/MIGRATION_PLAN.md) — Sprint 9F migration considerations
