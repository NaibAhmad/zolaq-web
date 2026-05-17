# Sprint 10 — Admin Operator SOP (Standard Operating Procedure)

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Audience:** internal operators running admin actions during closed beta.

## Mission

Operators keep the closed beta healthy: dealers get unblocked quickly, catalog data is correct, beta users see a polished surface, and audit trails are intact. This SOP is the playbook.

## 0. Operator daily routine (15–30 min)

1. Sign in to `/admin/login`.
2. Check `/api/health` — must be 200.
3. Walk the moderation queues: media, dealer offers, dealer profiles. Aim for zero items > 1 business day old.
4. Walk the audit log for the past 24 hours (see §audit-log-review).
5. Check the beta feedback inbox (see §beta-feedback).
6. Post a one-line status update to the operator channel.

## 1. Admin bootstrap (one-time)

Only the very first operator runs this — already documented in [DB_MIGRATION_AND_SEED_RUNBOOK.md](./DB_MIGRATION_AND_SEED_RUNBOOK.md) §Step 4. After bootstrap:

- Use the bootstrap account to invite additional admin users via the admin console.
- **Rotate the bootstrap admin's password** immediately via the change-password flow — `INITIAL_ADMIN_PASSWORD` is a write-once value.
- Treat the bootstrap admin as a break-glass account. Day-to-day work uses named operator accounts.

## 2. Role assignment

Roles defined in [docs/sprint-9e/RBAC_PERMISSION_MATRIX.md](../sprint-9e/RBAC_PERMISSION_MATRIX.md):

| Role | Capability |
|---|---|
| `super_admin` | Everything, including role assignment. Reserve for 1–2 people. |
| `admin_catalog` | Brand/model/generation/trim CRUD, advanced specs, content publishing. |
| `admin_dealers` | Dealer + offer approval, payment proof review. |
| `admin_media` | Media approval. |
| `admin_support` | Read-only access plus customer/dealer support actions (password reset, account unlock). |

Assignment flow:
1. Admin user is created (invited).
2. Super-admin assigns one or more roles via the admin console.
3. Role changes are logged to `AuditLog` automatically.

## 3. Brand / Model / Generation / Trim management

Daily workflow:

- **Add a brand**: Catalog → Brands → New brand. Required: name, slug, logo. Source recorded in notes.
- **Add a model**: under a brand. Required: brand, name, slug, body type.
- **Add a generation**: under a model. Required: model, year range, chassis code (if known).
- **Add a trim**: under a generation. Required: name, body type, fuel type, transmission, drivetrain, base price (or `price_pending: true`).
- **Edit**: changes are versioned via `AuditLog` (actor, before, after, timestamp).
- **Delete**: avoided during beta — soft-delete or unpublish instead.

Quality gates: [BETA_DATA_QUALITY_CHECKLIST.md](./BETA_DATA_QUALITY_CHECKLIST.md) §A–D.

## 4. Advanced trim specs

Trim specs (engine displacement, range, battery capacity, dimensions, etc.) live on `TrimSpec` rows.

- Each numeric field has units defined in the schema.
- Range / fuel consumption figures must cite a standard (WLTP / NEDC / CLTC).
- Leave fields null when the source doesn't state them — do not estimate.
- See Sprint 9C scope: [docs/sprint-9c/ADVANCED_TRIM_SPECS.md](../sprint-9c/ADVANCED_TRIM_SPECS.md).

## 5. Media approval

All dealer-submitted media is queued; admin-uploaded media auto-publishes.

Flow:
1. Admin Console → Media queue.
2. Click an asset → preview opens (full size).
3. Verify against [BETA_DATA_QUALITY_CHECKLIST.md](./BETA_DATA_QUALITY_CHECKLIST.md) §Media-asset.
4. Approve → asset becomes visible on dealer/trim surfaces.
5. Reject → include a reason; dealer is notified.

**Never approve:**
- Images containing license plates, faces of non-staff, or other PII.
- Watermarked images from competing services.
- Images that conflict with manufacturer claims (e.g., a sedan listed against a hatchback trim).

## 6. Dealer approval

When a dealer submits a profile for review:

1. Admin Console → Dealers → Pending.
2. Compare submitted info against the onboarding form ([DEALER_BETA_ONBOARDING.md](./DEALER_BETA_ONBOARDING.md) §3).
3. Verify map pin via Google Maps.
4. Verify license/registration number.
5. Approve → dealer profile becomes public.
6. Reject → include reason; dealer is notified.

## 7. Offer review

Per dealer offer:

1. Admin Console → Offers → Pending.
2. Verify `trim_id` resolves to a real trim.
3. Verify price within ±20% of catalog price; otherwise flag dealer for clarification.
4. Verify at least one media asset attached.
5. Reject offers that violate the rules in [BETA_DATA_QUALITY_CHECKLIST.md](./BETA_DATA_QUALITY_CHECKLIST.md) §H.
6. Approve → offer becomes publicly visible.

## 8. Audit log review

Every sensitive action writes an `AuditLog` row. Daily:

1. Admin Console → Audit Log → Last 24h.
2. Sort by severity (auth failures > permission denials > approvals > info).
3. Investigate any unusual pattern (e.g., one dealer triggering repeated permission denials → possible credential leak or curiosity probing).
4. Document findings if not routine.

Sprint 9A defines the captured actions: [docs/sprint-9a/AUDIT_LOG_REQUIREMENTS.md](../sprint-9a/AUDIT_LOG_REQUIREMENTS.md).

## 9. Content publishing

News, Encyclopedia, Q&A, Bazar Nəbzi:

1. Admin Console → Content → New.
2. Pick type, locale (az / ru / en), category.
3. Author content; follow vocabulary rules from [BETA_DATA_QUALITY_CHECKLIST.md](./BETA_DATA_QUALITY_CHECKLIST.md) §J.
4. Preview → publish.
5. Edits create a new version; previous version retained.

## 10. Market Pulse (Bazar Nəbzi) publishing

Same flow as content. Short-form posts (≤ 300 words) about market trends.

Rules:
- Cite at least one data source per post.
- No price predictions presented as fact.
- No claims about features Zolaq doesn't have.

## 11. Payment proof review

**Closed-beta posture: not exercised.** The UI exists but the feature is feature-flagged off for beta dealers. If a dealer accidentally submits a payment proof (e.g., during demo), reject with reason "payment flow disabled during closed beta."

## 12. Incident escalation

Severity rubric (full version: [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md)):

| Severity | Examples | Response |
|---|---|---|
| **P0** | Data leak, auth bypass, dealer-to-dealer impersonation, /api/health 503 on staging, total outage | Page operator immediately. Rollback per [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md). Post in operator channel within 5 min. |
| **P1** | Login broken for a subset, media upload rejecting valid files, offer creation 500ing | Triage within 4 business hours. Patch within 1 business day. |
| **P2** | Minor UI bug, theme contrast issue, copy typo | Patch within 1 week. |
| **P3** | Nice-to-have feedback | Log; defer past beta. |

P0 escalation chain:
1. Operator on duty.
2. Sprint 10 owner.
3. Engineering lead.
4. Founder.

## 13. End-of-week routine

- Compile weekly beta report: feedback received, bugs fixed, bugs open, dealer onboarding progress, beta user count.
- Share in operator channel + with project lead.
- Update Sprint 10 readiness report if the beta status changed materially.

## Cross-references

- Daily/weekly checks: [ADMIN_BETA_QA_CHECKLIST.md](./ADMIN_BETA_QA_CHECKLIST.md)
- Dealer onboarding: [DEALER_BETA_ONBOARDING.md](./DEALER_BETA_ONBOARDING.md)
- RBAC matrix: [docs/sprint-9e/RBAC_PERMISSION_MATRIX.md](../sprint-9e/RBAC_PERMISSION_MATRIX.md)
- Audit log requirements: [docs/sprint-9a/AUDIT_LOG_REQUIREMENTS.md](../sprint-9a/AUDIT_LOG_REQUIREMENTS.md)
- Admin auth: [docs/sprint-9f/ADMIN_PASSWORD_AUTH.md](../sprint-9f/ADMIN_PASSWORD_AUTH.md)
- Catalog QA: [docs/sprint-9c/ADMIN_CATALOG_QA.md](../sprint-9c/ADMIN_CATALOG_QA.md)
- Media rules: [docs/sprint-9d/MEDIA_SECURITY_RULES.md](../sprint-9d/MEDIA_SECURITY_RULES.md)
- Rollback: [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md)
