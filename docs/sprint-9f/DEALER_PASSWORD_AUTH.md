# Dealer password auth (Sprint 9F)

## Flow

Mirror of [ADMIN_PASSWORD_AUTH.md](ADMIN_PASSWORD_AUTH.md), with one extra
piece: the dealer session carries `dealerId`, `dealerUserId`, and `role`.

1. User submits email + password to `POST /api/dealer/auth/login`.
2. [`verifyDealerPassword`](../../lib/auth/dealer-user-repository.ts) looks up
   the `DealerUser` by lowercased email (`findFirst` because the `(dealer_id,
   email)` unique constraint doesn't give us a direct lookup-by-email — we
   take the first match; the data model assumes one DealerUser email per
   dealer in practice).
3. Same gates as admin: disabled, lockout, password verify.
4. On success: creates a `DealerSession` row (`session_id = dsess_<uuid>`,
   7-day TTL) and sets the cookie with
   `{ dealerId, contactName, role, dealerUserId, sessionId, exp }`.

## Role matrix (`DealerRole`)

Three roles, defined in [`lib/auth/constants.ts`](../../lib/auth/constants.ts)
and enforced by `dealerCan(role, perm)` in
[`lib/auth/permissions.ts`](../../lib/auth/permissions.ts).

| Permission                          | owner | manager | staff |
|-------------------------------------|-------|---------|-------|
| `dealer.profile.view`               | ✓     | ✓       | ✓     |
| `dealer.profile.request_update`     | ✓     | —       | —     |
| `dealer.offer.view`                 | ✓     | ✓       | ✓     |
| `dealer.offer.create`               | ✓     | ✓       | —     |
| `dealer.offer.update_own_draft`     | ✓     | ✓       | —     |
| `dealer.media.upload`               | ✓     | ✓       | —     |
| `dealer.ad_request.create`          | ✓     | —       | —     |
| `dealer.invoice.view`               | ✓     | —       | —     |
| `dealer.payment_proof.upload`       | ✓     | —       | —     |
| `dealer.lead.view_own`              | ✓     | ✓       | ✓     |
| `dealer.test_drive.view_own`        | ✓     | ✓       | ✓     |
| `dealer.submission.view_own`        | ✓     | ✓       | ✓     |

Manager handles day-to-day operations but not money (no invoices, no payment
proof, no ad request creation, no profile-update requests). Staff is
view-mostly.

## Cross-dealer isolation

`dealerCan()` answers only "what can a role do." It does NOT answer "whose
data can this dealer see." That separation is preserved from 9E:

- Every dealer route filters by `auth.session.dealerId`.
- Routes that receive `dealer_id` in the path/body call
  `auditDealerScopeViolation` when it doesn't match the session — see
  [`lib/admin/api-utils.ts`](../../lib/admin/api-utils.ts).
- Approval actions on submissions are admin-only — a dealer cannot approve
  their own offer/profile/ad-request submission.

## Lockout & logout

Same as admin: 5 failures within 15 minutes. Logout writes
`DealerSession.revoked_at` and clears the cookie.

## Production safety

- `DEV_AUTH_MODE !== "true"` rejects the mock `{ dealer_id, contact_name }`
  payload. The `DealerLoginPicker` UI is hidden.
- A disabled DealerUser cannot sign in.
- Per-action `requireDealerPermission` audit-logs `auth.forbidden` with the
  required permission name when denied.
