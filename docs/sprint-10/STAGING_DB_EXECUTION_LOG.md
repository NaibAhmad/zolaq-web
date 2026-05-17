# Staging DB Execution Log (Sprint 10B)

> **Sprint 10D pause note (2026-05-17):** Staging execution is **paused, not
> failed**. Phase A (Vercel env injection) and the entire DB execution sequence
> below are deferred until the founder restarts Phase A. Local demo preview
> (Sprint 10D) continues against the in-memory fallback. None of the rows in
> this log are marked FAILED — they remain `PENDING` / `FOUNDER_ACTION_REQUIRED`.
> See [CLOSED_BETA_GO_NO_GO_DECISION.md](./CLOSED_BETA_GO_NO_GO_DECISION.md) for
> the current criteria matrix.

## Sprint 10D phase status (frozen)

| Phase                                 | Status                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------- |
| A — Vercel env injection + DNS        | `FOUNDER_ACTION_REQUIRED`                                                |
| B1 — initial Prisma migration         | `PENDING — awaiting disposable Supabase scratch DB (Docker unavailable)` |
| C — staging DB execution              | `PENDING`                                                                |
| D — staging HTTP probes               | `PENDING`                                                                |
| E — manual browser smoke              | `PENDING`                                                                |

Note: Phase B2 (local build gates) is `PASS` from Sprint 10C and re-verified in
Sprint 10D Section G. The `directUrl` edit to `prisma/schema.prisma` is
uncommitted and validated by `prisma validate`.

Append-only log of database operations performed against the **staging**
Supabase Postgres instance. Each row documents one command executed by a
named operator with the exit code and any notes. Never paste real secrets,
URLs, or row content into this log.

If DATABASE_URL / DIRECT_URL are not yet provisioned, the log starts in the
**STAGING_DB_REQUIRED** state below — no commands are run until the founder
supplies credentials.

## Current state

- [ ] DATABASE_URL provisioned (Supabase pooled, port 6543, `?pgbouncer=true`)
- [ ] DIRECT_URL provisioned (Supabase direct, port 5432)
- [ ] DATABASE_URL added to Vercel Staging environment
- [ ] DIRECT_URL added to Vercel Staging environment
- [ ] First `prisma migrate deploy` executed
- [ ] First `npm run db:seed` executed
- [ ] First `npm run bootstrap:admin` executed
- [ ] Admin login round-trip verified (see [STAGING_DB_VERIFICATION_CHECKLIST.md](STAGING_DB_VERIFICATION_CHECKLIST.md))

While ANY box above is unchecked, sprint state = **STAGING_DB_REQUIRED**.

## Execution log

| Timestamp (UTC)   | Operator      | Command                                  | Exit | Notes                                                  |
| ----------------- | ------------- | ---------------------------------------- | ---- | ------------------------------------------------------ |
| _YYYY-MM-DD hh:mm_ | _name/handle_ | `npx prisma validate`                    |      |                                                        |
| _YYYY-MM-DD hh:mm_ | _name/handle_ | `npx prisma generate`                    |      |                                                        |
| _YYYY-MM-DD hh:mm_ | _name/handle_ | `npx prisma migrate deploy`              |      | First run uses `migrate dev --name initial_sprint_10_staging` against empty DB |
| _YYYY-MM-DD hh:mm_ | _name/handle_ | `npm run db:seed`                        |      | Idempotent upserts; safe to re-run                     |
| _YYYY-MM-DD hh:mm_ | _name/handle_ | `npm run bootstrap:admin`                |      | INITIAL_ADMIN_PASSWORD must be rotated after first login |

## Standard runbook order

```bash
# 1. Confirm staging env is ready
node scripts/verify-staging-env.mjs       # must exit 0 or 2 (warnings only)

# 2. ONE-TIME schema edit when wiring Supabase pooled URL
#    Open prisma/schema.prisma and uncomment the directUrl line inside
#    `datasource db`:
#       directUrl = env("DIRECT_URL")
#    Required because Supabase pooled URL (port 6543, ?pgbouncer=true) cannot
#    run migrations. DIRECT_URL points at the direct port 5432. Skip this step
#    if DATABASE_URL is a plain non-pooled Postgres URL.

# 3. Schema sanity (no DB writes)
npx prisma validate
npx prisma generate
npx prisma format                          # normalizes schema.prisma in place

# 4. Apply migrations (ONLY after DATABASE_URL/DIRECT_URL are wired)
#    First time:
npx prisma migrate dev --name initial_sprint_10_staging
#    Subsequent deploys:
npx prisma migrate deploy

# 4. Seed catalog
npm run db:seed

# 5. Bootstrap initial super_admin (one-time)
npm run bootstrap:admin

# 6. Verify
#    See docs/sprint-10/STAGING_DB_VERIFICATION_CHECKLIST.md
```

## Rules

- Never commit `DATABASE_URL` / `DIRECT_URL` values. They live only on Vercel.
- Never paste row counts, IDs, or column values into this log. The verification
  checklist (sibling doc) handles assertions privately.
- Migrations are append-only. Do not edit historical migrations in
  `prisma/migrations/` after they're applied to staging.
- If a migration fails midway, prefer fix-forward (new migration) over `migrate
  reset` on staging once data exists. Reset is safe ONLY while the DB is empty.
- `INITIAL_ADMIN_PASSWORD` is a write-once secret. After the first
  `bootstrap:admin` run, the founder must log in and rotate it via the
  password change flow. Remove `INITIAL_ADMIN_PASSWORD` from Vercel env after
  rotation.

## See also

- [STAGING_DB_VERIFICATION_CHECKLIST.md](STAGING_DB_VERIFICATION_CHECKLIST.md)
- [DB_MIGRATION_AND_SEED_RUNBOOK.md](DB_MIGRATION_AND_SEED_RUNBOOK.md) (Sprint 10 prep)
- [STAGING_ROLLBACK_PLAN.md](STAGING_ROLLBACK_PLAN.md)
