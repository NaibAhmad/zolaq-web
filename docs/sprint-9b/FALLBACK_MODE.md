# Fallback Mode

The app runs in two modes, chosen at runtime by [lib/db/availability.ts](../../lib/db/availability.ts).

## How the switch works

`isDatabaseAvailable()` returns `true` only if **all** of these are true:

1. `process.env.DATABASE_URL` is set and non-empty
2. The URL is parseable and its hostname is NOT the literal `placeholder`
   (this lets `prisma validate` succeed locally without a real DB)
3. A one-time `SELECT 1` probe against the DB succeeds

The result is cached for the entire process lifetime. The probe runs at
most once per dev server start / serverless cold start.

On any failure (missing var, unparseable URL, network error, auth error,
schema mismatch), the function returns `false` and the app falls back to
the in-memory globalThis store. **The app never crashes for a missing or
broken DB.**

## What changes between modes

| Behaviour | Fallback (no DB) | DB mode |
|---|---|---|
| App boots | ✅ | ✅ |
| Public catalog / search / filters | ✅ (Sprint 8H intact) | ✅ (same code path) |
| Admin CRUD on brand/model/trim/dealer | ✅ writes to globalThis | ✅ writes to globalThis |
| Generation CRUD (Sprint 9C) | ✅ globalThis | ✅ globalThis |
| TrimSpec advanced fields (Sprint 9C) | ✅ globalThis | ✅ globalThis |
| Media file upload (Sprint 9D) | ✅ file on disk + globalThis MediaAsset | ✅ file on disk + DB MediaAsset row |
| **AuditLog via `audit()` helper** | ✅ globalThis | ✅ **persists in Postgres** |
| AuditLog via direct `writeAudit` import | ✅ globalThis | ⚠️ globalThis only — see below |
| Process restart | All in-memory state lost | AuditLog survives; rest still in-memory |

## The audit() / writeAudit split

`audit()` in [lib/admin/api-utils.ts](../../lib/admin/api-utils.ts) is the
"helper-mediated" path used by 25+ admin/dealer API routes. This is now
backed by `writeAuditFireAndForget()` from [lib/audit/repository.ts](../../lib/audit/repository.ts)
and writes to Postgres in DB mode.

`writeAudit` is also imported directly by 13 other files (auth login/logout,
gamification, payments, invoices, ads, market-pulse, submissions, internal
stores). Those callers still use the **synchronous in-memory** implementation
at [lib/admin/audit.ts](../../lib/admin/audit.ts). When those domains are cut
over to DB in future sprints, their `writeAudit` imports should switch to
the repository's `writeAuditFireAndForget` (or `await writeAudit` if the
caller can participate in a transaction).

**Trade-off accepted this sprint:** in DB mode, those direct-writeAudit
events are not persisted. This is intentional — Sprint 9B is foundation
only; the cross-domain transactional invariant from
[SECURITY_AND_ACCESS_RULES.md R9](../sprint-9a/SECURITY_AND_ACCESS_RULES.md)
becomes relevant only once mutations themselves live in Postgres.

## How to verify each mode locally

### Fallback (no DB)

```
# Comment out DATABASE_URL in .env (or empty it)
npm run dev
# Hit /admin/audit-log, trigger any admin mutation (e.g. brand create),
# refresh — entry shows up. Restart `npm run dev`. Entries are gone.
# This matches the existing pre-9B behaviour.
```

### DB mode

```
# Put a real Postgres URL in .env
npm run prisma:migrate     # init_sprint_9b
npm run db:seed
npm run dev
# Hit /admin/audit-log, trigger any admin mutation.
# Verify in Prisma Studio: SELECT * FROM audit_logs;
# Restart `npm run dev`. Entry is still there.
```
