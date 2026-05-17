# Sprint 10 — Staging Rollback Plan

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Use when:** A staging deploy is broken or a P0 surfaces during closed beta and you need to revert quickly.

## Rollback decision tree

```
                  Is the bad change in the code (Vercel deploy)?
                  /                                            \
                YES                                             NO
                 |                                               |
        Code rollback (§1)                          Is the bad change in the DB?
                                                   /                          \
                                                 YES                           NO
                                                  |                             |
                                       DB rollback (§2)            Config / env rollback (§3)
```

## 1. Code rollback (fastest — < 2 minutes)

Use this when the most recent deploy introduces a runtime regression that does not require a DB change to fix.

1. Open Vercel → Project `zolaq-staging` → **Deployments**.
2. Find the previous **Ready** deployment (the one immediately before the bad one).
3. Click `…` → **Promote to Production** (or "Redeploy to staging.zolaq.az" — depends on Vercel UI version).
4. Wait for the promotion to complete (~30s).
5. Re-run the `/api/health` smoke from [STAGING_DEPLOYMENT_CHECKLIST.md](./STAGING_DEPLOYMENT_CHECKLIST.md) §E.1.
6. Post the rollback notice in the team channel using the template in §4 below.

**Audit trail:** Vercel records every promotion with the operator's account, timestamp, and source/target deploy IDs. No manual log needed.

## 2. Database rollback

DB rollback is harder and almost never the right move during closed beta. Follow [docs/sprint-9i/ROLLBACK_PLAN.md](../sprint-9i/ROLLBACK_PLAN.md) for the full procedure. Summary:

1. **Stop writes** — promote the last-known-good code deploy first (§1) so no new bad data accumulates.
2. **Snapshot the broken state** — Vercel Postgres or Supabase one-click snapshot. Needed for post-mortem.
3. **Restore from the previous snapshot** — Vercel Postgres / Supabase point-in-time restore to just before the bad migration.
4. **Re-run any missed migrations** — `npx prisma migrate deploy` against the restored DB.
5. **Re-seed if necessary** — `npm run db:seed` is idempotent and safe to re-run.
6. **Re-bootstrap admin only if the user table was lost** — `npm run bootstrap:admin`.

**Closed-beta caveat:** during closed beta, the acceptable answer is often "wipe + re-seed." Data loss is OK because the beta data is staging-only and re-creatable.

## 3. Config / env rollback

Use this when a wrong env var (e.g., `SMS_PROVIDER` flipped from `mock` to `http` with missing credentials) is the root cause.

1. Vercel → Project → Settings → Environment Variables.
2. Edit the offending variable back to its last-known-good value.
3. Vercel → Deployments → **Redeploy** the current deploy (env changes don't auto-rebuild).
4. Re-run `/api/health` smoke.

## 4. Communication template

Post to the team channel within 5 minutes of starting any rollback:

```
🛑 Staging rollback in progress

Deploy: <commit SHA or Vercel deploy URL>
Symptom: <one-line description>
Action: <code rollback | DB rollback | env rollback>
ETA back to green: <minutes>
Operator: <your name>
```

After completion:

```
✅ Staging back to green

Previous deploy restored: <commit SHA>
/api/health: 200 OK
Root cause: <one-line>
Post-mortem: <link or "to follow within 24h">
```

## 5. Post-incident

- File a bug per [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md) §P0.
- Schedule a 30-minute post-mortem within 24 hours.
- Document the root cause and any preventive change in the Sprint 10 incident log (create `docs/sprint-10/INCIDENT_LOG.md` on first incident).
- If the incident touched DB structure, update [DB_MIGRATION_AND_SEED_RUNBOOK.md](./DB_MIGRATION_AND_SEED_RUNBOOK.md) with the lesson learned.

## What not to do

- **Do not run `prisma migrate reset` on staging without a fresh snapshot first** — it drops all data and re-creates the schema.
- **Do not bypass the rollback by editing data directly in Vercel Postgres / Supabase SQL console** during an incident — leave a clean snapshot for post-mortem.
- **Do not silence `/api/health` 503 by relaxing the check** — the 503 is the signal; fix the underlying cause.

## Cross-references

- Sprint 9 rollback: [docs/sprint-9i/ROLLBACK_PLAN.md](../sprint-9i/ROLLBACK_PLAN.md)
- Backup policy: [docs/sprint-9j/BACKUP_POLICY.md](../sprint-9j/BACKUP_POLICY.md)
- Monitoring: [docs/sprint-9j/MONITORING_LOGGING_PLAN.md](../sprint-9j/MONITORING_LOGGING_PLAN.md)
- Bug triage: [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md)
