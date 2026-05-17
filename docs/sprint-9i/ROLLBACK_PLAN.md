# Sprint 9I — Rollback Plan

## When to roll back

Any of:

- `5xx` rate exceeds 1% of requests for 5+ minutes.
- `/api/health` reports `status: "degraded"` and the cause is the release (not external).
- Auth flow regression (admin/dealer can't sign in, OTP returns 500, cookies don't sign).
- Customer data exposure (any user can see another user's leads / decisions / profile).
- Dealer scope violation (dealer A sees dealer B's leads / offers / media).
- Security regression (mock picker visible in production, secrets logged).

## Decide: code rollback vs. data rollback

| Symptom | Action |
|---|---|
| Bad code only (no DB writes) | Code rollback (§A) |
| Bad code + non-destructive DB writes (audit rows, sessions, OTP attempts) | Code rollback (§A); the extra rows are harmless |
| Bad code + destructive DB writes (deletes, schema drops) | Code rollback (§A) + DB restore (§C) |
| Bad migration | Forward-fix migration (§B) — DO NOT rerun `migrate reset` |

## §A — Code rollback (most common)

1. Identify the previous green release tag (`git tag --list 'v*' | tail -5`).
2. Redeploy the previous build artifact (provider-specific):
   - Vercel / Netlify: promote previous deployment.
   - Docker / Kubernetes: rollback to previous image tag.
   - Bare metal: `git checkout <prev-tag>` + `npm ci && npm run build && npm restart`.
3. Verify with [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) §"Post-release smoke".
4. Open an incident ticket; do not redeploy the bad version until root cause is identified.

Time to recover: **< 5 minutes** with proper provider tooling.

## §B — Migration rollback (forward-fix only)

Prisma migrations are **forward-only**. There is no `prisma migrate down`. To reverse a bad migration:

1. Author a NEW migration that undoes the bad one (`npx prisma migrate dev --name fix_<bad_migration_name>`).
2. Commit it.
3. Deploy normally; `prisma migrate deploy` will apply the corrective migration in order.

DO NOT run `prisma migrate reset` against a staging or production database — it drops the schema.

If the bad migration cannot be safely reversed (e.g., dropped column with data loss), follow §C.

## §C — Data rollback (last resort)

1. Stop incoming writes (put the app in maintenance mode or scale to zero).
2. Restore the most recent good backup per [docs/sprint-9j/BACKUP_POLICY.md](../sprint-9j/BACKUP_POLICY.md).
3. Replay any non-destructive events (audit log) from the bad-window manually if needed.
4. Resume traffic.
5. Run a post-mortem; data rollback is a high-cost event.

## Communication

- Notify the team channel within 10 minutes of decision-to-rollback.
- Post status updates every 30 minutes until the incident is closed.
- File a post-mortem within 48 hours for any rollback.
