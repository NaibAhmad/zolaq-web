# Sprint 9I — Database Migration Runbook

## Current state (Sprint 9I)

- `prisma/migrations/` is **empty**. The project has run in hybrid fallback mode (`isDatabaseAvailable()` in [lib/db/availability.ts](../../lib/db/availability.ts)) through Sprint 9E.
- `prisma/schema.prisma` is the source of truth for the model layout but no DDL has been recorded as a migration yet.
- This means a fresh database cannot be brought up to the current schema by running `prisma migrate deploy` until step 1 below is done.

## Why this is fine

Through Sprint 9D, the app worked entirely without a database — every repository checked `isDatabaseAvailable()` and fell back to a globalThis in-memory store. AuditLog was the first domain cut over to DB in 9B but still falls back cleanly. This let the team iterate quickly without DDL ceremony.

The cost: the first time we attach a real database, we must generate the initial migration.

## Step 1 — Generate the initial migration (one-time)

Run from a developer machine with a fresh, empty Postgres database:

```sh
# point at a throwaway DB
export DATABASE_URL="postgresql://user:pass@localhost:5432/zolaq_init"

# generate the migration; Prisma diffs the schema against the empty DB and writes one migration
npx prisma migrate dev --name init_9e_baseline

# verify the generated SQL looks sane (all tables created, no DROP statements)
cat prisma/migrations/*_init_9e_baseline/migration.sql

# commit the new prisma/migrations/ directory
git add prisma/migrations/
git commit -m "chore(prisma): generate init migration for 9B/9C/9D/9E baseline"
```

## Step 2 — Apply migrations in CI / staging / production

```sh
# fail-fast if a migration is missing or out of order
npx prisma migrate deploy
```

- `migrate deploy` is non-interactive and idempotent.
- It NEVER creates new migrations — only applies committed ones.
- Run it as part of the deploy pipeline, BEFORE the app starts serving traffic.

## Forward-only policy

Prisma does not support automatic down-migrations. To reverse a migration:

1. Author a new migration that performs the inverse DDL.
2. Commit it.
3. Deploy normally.

Detail in [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) §B.

## Schema change checklist

For any PR that modifies `prisma/schema.prisma`:

- [ ] Run `npx prisma format` and commit any diff.
- [ ] Run `npx prisma validate`.
- [ ] Run `npx prisma migrate dev --name <descriptive_name>` against a local DB.
- [ ] Inspect the generated SQL; reject anything that:
  - Drops a column without a documented data-loss plan.
  - Adds a `NOT NULL` column without a default or a follow-up backfill migration.
  - Renames a table or column directly (use create-new + backfill + drop-old, three migrations).
- [ ] Commit the new `prisma/migrations/<timestamp>_<name>/migration.sql` file.
- [ ] Update [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) if new env vars were added.
- [ ] Update [docs/sprint-9b/REPOSITORY_CUTOVER_STATUS.md](../sprint-9b/REPOSITORY_CUTOVER_STATUS.md) if a new domain is now DB-backed.

## Connection pooling

If `DATABASE_URL` points at PgBouncer (Supabase, RDS Proxy, etc.) in transaction-mode:

- Set `DIRECT_URL` to the non-pooled URL.
- Use `DIRECT_URL` for `prisma migrate deploy` — pooled URLs cannot run DDL.
- The app runtime uses `DATABASE_URL` (pooled) for normal queries.

This is handled by Prisma automatically when both are set; just ensure both are in env.

## Backups

Backup procedure is documented in [docs/sprint-9j/BACKUP_POLICY.md](../sprint-9j/BACKUP_POLICY.md). Always take a manual backup IMMEDIATELY before deploying a migration with structural risk (drops, type changes, large tables).

## Open TODOs

- Initial migration not yet generated (waiting for a real DB attachment).
- No migration CI check yet — recommend adding `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-migrations prisma/migrations --shadow-database-url <shadow> --exit-code` to CI once migrations exist.
- No shadow database configured for CI migration checks.
