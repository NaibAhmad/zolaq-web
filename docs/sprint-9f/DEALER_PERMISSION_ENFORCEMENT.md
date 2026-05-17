# Dealer permission enforcement (Sprint 9F)

## Why

9E added the `DealerSession.role` field but every dealer API route still did
the same single check: "is the caller authenticated as some dealer?" 9F
enforces the full owner/manager/staff matrix on a per-route basis.

## How

[`requireDealerPermission(request, permission)`](../../lib/admin/api-utils.ts)
wraps `requireDealer` and adds a `dealerCan(session.role, permission)` check.
On failure it returns `HTTP 403 FORBIDDEN` and audit-logs `auth.forbidden`
with `note=required=<permission>` and `entity_id=<route pathname>`. Cross-
dealer-id checks (e.g. dealer A asking for dealer B's offer) continue to use
the existing `auditDealerScopeViolation` helper on top of the permission
check.

## Route ↔ permission mapping

| Method+Route                                          | Permission                          |
|-------------------------------------------------------|-------------------------------------|
| GET    `/api/dealer/profile`                          | `dealer.profile.view`               |
| POST   `/api/dealer/profile`                          | `dealer.profile.request_update`     |
| PATCH  `/api/dealer/profile`                          | `dealer.profile.request_update`     |
| GET    `/api/dealer/offers`                           | `dealer.offer.view`                 |
| POST   `/api/dealer/offers`                           | `dealer.offer.create`               |
| GET    `/api/dealer/offers/[offerId]`                 | `dealer.offer.view`                 |
| PATCH  `/api/dealer/offers/[offerId]`                 | `dealer.offer.update_own_draft`     |
| POST   `/api/dealer/offers/[offerId]`                 | `dealer.offer.update_own_draft`     |
| POST   `/api/dealer/media`                            | `dealer.media.upload`               |
| POST   `/api/dealer/media/upload`                     | `dealer.media.upload`               |
| GET    `/api/dealer/ad-requests`                      | `dealer.invoice.view`               |
| POST   `/api/dealer/ad-requests`                      | `dealer.ad_request.create`          |
| GET    `/api/dealer/ad-requests/[adRequestId]`        | `dealer.invoice.view`               |
| GET    `/api/dealer/invoices`                         | `dealer.invoice.view`               |
| GET    `/api/dealer/invoices/[invoiceId]`             | `dealer.invoice.view`               |
| GET    `/api/dealer/payment-proof`                    | `dealer.invoice.view`               |
| POST   `/api/dealer/payment-proof`                    | `dealer.payment_proof.upload`       |
| GET    `/api/dealer/leads`                            | `dealer.lead.view_own`              |
| GET    `/api/dealer/test-drives`                      | `dealer.test_drive.view_own`        |
| GET    `/api/dealer/submissions`                      | `dealer.submission.view_own`        |
| POST   `/api/dealer/submissions/[submissionId]/resubmit` | `dealer.submission.view_own`     |
| GET    `/api/dealer/me`                               | `requireDealer` (basic, no perm)    |

`/api/dealer/auth/login` and `/api/dealer/auth/logout` deliberately have no
permission gate — login is pre-auth, logout is post-session.

## Role × Permission (canonical matrix)

See [DEALER_PASSWORD_AUTH.md](DEALER_PASSWORD_AUTH.md). The matrix lives in
[`lib/auth/permissions.ts`](../../lib/auth/permissions.ts) — single source of
truth. The admin "Roles" read-only page reads from the same constants.

## Invariants

- A dealer cannot approve their own submission. (Admin-only routes guard
  the approve path; no `dealer.*` permission grants approval.)
- A dealer cannot change a payment status — only upload a payment proof. The
  status transition happens server-side inside the POST handler after the
  proof is recorded.
- A dealer cannot remove the Sponsorlu / Reklam / Premium label on their ad
  request — those fields are read-only after submission; only admin transitions
  the ad request to `published`. No dealer permission grants label edit.
