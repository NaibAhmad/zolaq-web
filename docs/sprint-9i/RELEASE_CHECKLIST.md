# Sprint 9I — Release Checklist

Run through this checklist for every release to staging or production.

## Pre-release (on the merge branch)

- [ ] `npx prisma validate` — schema valid.
- [ ] `npx prisma format` — schema formatted (commit any diff).
- [ ] `npm run lint` — passes.
- [ ] `npx tsc --noEmit` — passes.
- [ ] `npm run build` — passes; build output is clean (no `eval`, no `dynamic import` errors).
- [ ] Manual smoke per [docs/sprint-9j/SECURITY_QA_CHECKLIST.md](../sprint-9j/SECURITY_QA_CHECKLIST.md).
- [ ] Any new env vars are added to [.env.example](../../.env.example) AND [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).
- [ ] No secret values committed (grep for the entries listed in [SECRETS_POLICY.md](./SECRETS_POLICY.md) §3).
- [ ] If `prisma/schema.prisma` changed: matching migration generated and committed (see [DATABASE_MIGRATION_RUNBOOK.md](./DATABASE_MIGRATION_RUNBOOK.md)).
- [ ] Public route inventory unchanged (no surprise additions/removals).

## Release

- [ ] Tag the release (`git tag vX.Y.Z`).
- [ ] Push tag.
- [ ] Trigger deploy (provider-specific).
- [ ] Deploy completes with no build errors.
- [ ] Run `prisma migrate deploy` against the target DB (idempotent; safe to re-run).

## Post-release smoke (within 5 minutes)

- [ ] `GET /api/health` returns `200` with `status: "ok"` and `devAuthMode: false`.
- [ ] Public homepage (`/`) returns `200`.
- [ ] `/cars` returns `200` and renders at least one card.
- [ ] `/admin/login` shows the placeholder (NOT the mock picker).
- [ ] `/dealer/login` shows the placeholder (NOT the mock picker).
- [ ] `POST /api/admin/auth/login` returns `503 AUTH_NOT_AVAILABLE` (until Sprint 9F lands).
- [ ] No `5xx` spikes in the hosting provider's log aggregator.

## Post-release monitoring (24 hours)

- [ ] `/api/health` polled every 60s; no `degraded` flips.
- [ ] Audit log (`AuditLog` table) shows expected event volume; no `dealer_scope_violation` rows.
- [ ] No spike in failed-auth rate (`>10/min/IP` is the alert threshold per [docs/sprint-9j/MONITORING_LOGGING_PLAN.md](../sprint-9j/MONITORING_LOGGING_PLAN.md)).
- [ ] No spike in OTP rate-limit hits.

## If anything fails

Follow [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md).
