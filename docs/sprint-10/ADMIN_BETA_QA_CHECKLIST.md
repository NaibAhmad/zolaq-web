# Sprint 10 — Admin Beta QA Checklist

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Use:** Daily and weekly operational checks during closed beta. Pairs with [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md).

## Daily check (15 min)

```
Date: 2026-__-__
Operator: __________
```

### A. Health
- [ ] `https://staging.zolaq.az/api/health` → 200, all secret-presence flags green, `database.connected: true`.
- [ ] No error spike in Vercel logs vs the previous day.

### B. Sessions & auth
- [ ] Admin sign-in works for at least the operator's own account.
- [ ] No unexpected `dev_auth_mode=true` in any health response.
- [ ] No failed-login spike in the last 24h audit log.

### C. Queues (target: zero items > 1 business day old)
- [ ] Media queue depth: ___
- [ ] Dealer profile review queue depth: ___
- [ ] Dealer offer review queue depth: ___

### D. Audit log
- [ ] Last-24h audit log scanned.
- [ ] No unusual permission-denial spikes.
- [ ] No unrecognized actor IDs.
- [ ] Findings logged if non-routine.

### E. Beta feedback inbox
- [ ] All new submissions acknowledged.
- [ ] P0 / P1 entries triaged per [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md).

### F. Daily sign-off
```
Status: [ ] GREEN  [ ] YELLOW (notes)  [ ] RED (incident)
Notes: ___________________________________________
```

## Weekly check (45–60 min)

Run on the same weekday each week. Aggregate the daily checks plus:

### G. Catalog hygiene
- [ ] New trims added this week meet [BETA_DATA_QUALITY_CHECKLIST.md](./BETA_DATA_QUALITY_CHECKLIST.md) §D.
- [ ] All new `CatalogPrice` rows have `source` and `status` populated.
- [ ] No trim missing a `generation_id` for multi-generation models.
- [ ] No duplicate brand/model/generation/trim entries.

### H. Dealer health
- [ ] Each onboarded dealer has run through [DEALER_BETA_QA_CHECKLIST.md](./DEALER_BETA_QA_CHECKLIST.md) §H this week.
- [ ] No dealer permission violations in the audit log.
- [ ] Dealer profile updates approved within SLA.

### I. Content hygiene
- [ ] All new news / encyclopedia / Q&A / Bazar Nəbzi posts pass [BETA_DATA_QUALITY_CHECKLIST.md](./BETA_DATA_QUALITY_CHECKLIST.md) §J.
- [ ] No "Carfax" / "Free Carfax" terminology used.
- [ ] No claims about features not yet shipped.

### J. Security review
- [ ] No leaked secrets in repo (re-scan via secret-scan tool of choice).
- [ ] No raw phone numbers found in last-week's logs (grep).
- [ ] No `DEV_AUTH_MODE=true` accidentally set in staging Vercel env.
- [ ] Bootstrap admin's password has been rotated from `INITIAL_ADMIN_PASSWORD`.

### K. Build gate freshness
- [ ] Latest deploy passed lint, tsc, build (Vercel build log green).
- [ ] No Prisma schema drift between repo and staging DB (`npx prisma migrate status`).

### L. Beta cadence
- [ ] Number of beta testers active this week: ___
- [ ] Number of leads submitted: ___
- [ ] Number of dealer responses to leads: ___
- [ ] Number of feedback submissions: ___
- [ ] Notable trends in feedback: ___

### M. Documentation drift
- [ ] Any new operator procedure introduced this week is added to [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md).
- [ ] Any incident this week is captured in `docs/sprint-10/INCIDENT_LOG.md` (create on first incident).

### N. Weekly sign-off
```
Verdict: [ ] PASS  [ ] PASS with issues  [ ] REGRESSION
Top action items for next week:
  1. ___________________________________
  2. ___________________________________
  3. ___________________________________
Operator initials + date: __________
```

## Escalation triggers

If any of the following appear during a check, escalate to P0 immediately (see [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md) §12):

- `/api/health` returns 503.
- Raw phone number observed in any persistent log.
- Dealer-to-dealer data access in the audit log.
- Admin role granted to an unrecognized account.
- Secret found in repo or env-var-screenshot.

## Cross-references

- Daily playbook: [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md)
- Bug triage: [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md)
- Security checklist: [SECURITY_PRIVACY_BETA_CHECKLIST.md](./SECURITY_PRIVACY_BETA_CHECKLIST.md)
- Sprint 9 security QA: [docs/sprint-9j/SECURITY_QA_CHECKLIST.md](../sprint-9j/SECURITY_QA_CHECKLIST.md)
- Monitoring plan: [docs/sprint-9j/MONITORING_LOGGING_PLAN.md](../sprint-9j/MONITORING_LOGGING_PLAN.md)
