# Sprint 10 — Closed Beta Bug Triage

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Use:** convert every feedback-form submission and every internal-discovered bug into a triaged ticket with a clear SLA.

## Severity rubric

| Severity | Definition | Examples | Triage SLA | Fix SLA |
|---|---|---|---|---|
| **P0** | Total outage, data leak, security/privacy breach, auth bypass. Cannot proceed with beta. | `/api/health` returns 503; dealer A sees dealer B's data; raw phone in logs; auth cookie ignores HMAC; any secret leak. | ≤ 15 min (operator paged) | Same day. Rollback if necessary per [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md). |
| **P1** | Core flow broken for a subset of users. Beta blocked for some. | OTP fails for valid AZ phone numbers; media upload rejects valid JPEGs; lead form 500s; sign-in loop. | ≤ 4 business hours | ≤ 1 business day. |
| **P2** | Annoying bug with workaround. Doesn't block the user. | Misaligned UI on 390px; broken markdown in one news entry; theme contrast issue; one filter combination is slow. | ≤ 1 business day | ≤ 1 week. |
| **P3** | Cosmetic, nice-to-have, future work. | "Could the price card be bigger?"; "Add Russian-language switcher in the header." | ≤ 3 business days | Deferred past beta. |

## How to triage

For every incoming item:

1. Read the submission.
2. Reproduce on staging (or, if not reproducible, mark `repro: cannot_reproduce` and ask submitter for more info).
3. Assign severity (rubric above).
4. Categorize: `auth`, `catalog`, `dealer`, `media`, `content`, `ui`, `perf`, `seo`, `i18n`, `security`, `other`.
5. Open a ticket in the project tracker (Linear / GitHub Issues / whichever the team uses).
6. Acknowledge submitter if they opted in for follow-up.

## Triage record template

```
ID: ZOLAQ-BETA-NNN
Severity: P0 | P1 | P2 | P3
Category: auth | catalog | dealer | media | content | ui | perf | seo | i18n | security | other
Reported by: <tester ID or "internal">
Reported on: 2026-MM-DD
Page/flow: <as reported>
Repro: always | sometimes | once | cannot_reproduce
One-line summary: <...>
Steps: <...>
Expected: <...>
Actual: <...>
Environment: <device / OS / browser / theme / locale>
Attachments: <links>
Acknowledged: yes/no — on 2026-MM-DD
Assigned to: <operator/engineer>
Status: open | in_progress | fixed | wontfix | duplicate
Fix commit / PR: <link>
Resolution notes: <...>
```

## Weekly triage cadence

- **Monday:** triage everything that came in over the weekend.
- **Wednesday:** mid-week review of open P1s.
- **Friday:** weekly status report — counts by severity / category, what shipped, what's open.

## P0 incident protocol

1. Operator on duty pages the Sprint 10 owner.
2. Open a war-room thread in the operator channel within 5 minutes.
3. Stop ongoing deploys.
4. Decide: hotfix forward, or roll back per [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md).
5. Communicate to beta users only if the issue is user-visible and security-relevant (data leak, exposure). For pure outages, internal-only.
6. Post-mortem within 24 hours. Add to `docs/sprint-10/INCIDENT_LOG.md` (create on first incident).

## Common false-positive patterns

When you triage, watch for these — they look like bugs but aren't:

- **OTP code not received**: testers may be looking for a real SMS. The mock provider only logs to the server. Send the code out-of-band.
- **"Logged out unexpectedly"**: customer session is 7 days but cookies may be cleared by aggressive browser settings. Confirm before filing.
- **"Filter doesn't return results"**: beta seed data is sparse. Confirm the filter combination has matching data before filing UI bug.
- **"Profile updates don't save"**: check if the user is actually signed in (no anonymous edits).
- **"Page is in Russian when I expect Azerbaijani"**: i18n locale detection still falls back to AZ by default; if it's defaulting differently, that's a real bug.

## When to NOT fix during beta

- Any feature request that requires new product surface area (marketplace, online payment, WhatsApp Business, public VIN Check, public i18n route switching) — defer past beta. See the Sprint 10 out-of-scope list in [SPRINT_10_READINESS_REPORT.md](./SPRINT_10_READINESS_REPORT.md).
- UI redesign requests — defer past beta. Closed beta is not the time for design overhauls.
- Performance optimizations below "user notices it" — defer past beta unless it's a regression vs Sprint 9.

## Metrics to report weekly

- Total submissions: ___
- By severity: P0=__, P1=__, P2=__, P3=__
- By category: auth=__, catalog=__, dealer=__, …
- Median time to acknowledge: __ hours.
- Median time to fix (by severity): P0=__h, P1=__h, P2=__d.
- Currently open: ___

## Cross-references

- Feedback form: [CLOSED_BETA_FEEDBACK_FORM.md](./CLOSED_BETA_FEEDBACK_FORM.md)
- User test plan: [CLOSED_BETA_USER_TEST_PLAN.md](./CLOSED_BETA_USER_TEST_PLAN.md)
- Daily operator check: [ADMIN_BETA_QA_CHECKLIST.md](./ADMIN_BETA_QA_CHECKLIST.md)
- Admin SOP: [ADMIN_OPERATOR_SOP.md](./ADMIN_OPERATOR_SOP.md)
- Rollback: [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md)
