# Dealer Auth Flow — Sprint 9E

## Current (post-9E) flow

```
[user]
  GET /dealer/login
    -> if zlq_dealer_session valid -> 303 /dealer/dashboard
    -> if DEV_AUTH_MODE=true       -> render <DealerLoginPicker>
    -> else                        -> render <PasswordSignInPlaceholder panel="dealer">

[user]
  POST /api/dealer/auth/login  body={ dealer_id, contact_name }
    -> if !DEV_AUTH_MODE  -> audit dealer.login.blocked_production_mock; 503
    -> if !dealer_id|contact_name -> 400
    -> if !getDealer      -> audit dealer.login.failed; 404
    -> setDealerSession({ dealerId, contactName, role: "owner" })   // HMAC-signed
    -> writeAudit({ action: "dealer.login" })
    -> 303 /dealer/dashboard

[user]
  GET /dealer/(authed)/*    (layout)
    -> getDealerSession()
    -> if null -> 303 /dealer/login

[user]
  GET /api/dealer/...
    -> requireDealer(request)
    -> all data queries scoped by auth.session.dealerId (see below)
```

## Roles (Sprint 9E foundation; not yet enforced per-action)

Defined in [lib/auth/constants.ts](../../lib/auth/constants.ts) `DEALER_ROLES`:

- `owner` — full dealer scope (offers, leads, media, invoices, payments)
- `manager` — offers/leads/media, no billing
- `staff` — view-mostly

Permission matrix at [lib/auth/permissions.ts](../../lib/auth/permissions.ts) `DEALER_ROLE_PERMISSIONS`. Mock login assigns `"owner"`; per-action enforcement using `dealerCan(role, perm)` lands in Sprint 9F.

## Dealer-id scoping (server-enforced today)

Every dealer-facing data endpoint reads `auth.session.dealerId` from the cookie and uses it as the filter — the client cannot pass a `dealer_id` and read someone else's data.

| Endpoint | Scope check |
|---|---|
| `GET /api/dealer/offers` | [app/api/dealer/offers/route.ts](../../app/api/dealer/offers/route.ts) — `listPrices({ dealer_id: auth.session.dealerId })` |
| `GET /api/dealer/offers/[offerId]` | [app/api/dealer/offers/[offerId]/route.ts](../../app/api/dealer/offers/[offerId]/route.ts) — `if (offer.dealer_id !== auth.session.dealerId) -> 404` |
| `GET /api/dealer/submissions` | [app/api/dealer/submissions/route.ts](../../app/api/dealer/submissions/route.ts) |
| `GET /api/dealer/leads` | [app/api/dealer/leads/route.ts](../../app/api/dealer/leads/route.ts) — leads filtered by dealer's own offer trim ids |
| `GET /api/dealer/media` | [app/api/dealer/media/route.ts](../../app/api/dealer/media/route.ts) |
| `GET /api/dealer/invoices` | [app/api/dealer/invoices/route.ts](../../app/api/dealer/invoices/route.ts) |
| `POST /api/dealer/payment-proof` | [app/api/dealer/payment-proof/route.ts](../../app/api/dealer/payment-proof/route.ts) — `getInvoiceForDealer(invoice_id, dealerId)` returns null if mismatch |

When a route detects a mismatch (e.g. dealer requests another dealer's `offerId`), it returns 404 (not 403, to avoid leaking that the id exists). Sprint 9E adds `auditDealerScopeViolation()` in [lib/admin/api-utils.ts](../../lib/admin/api-utils.ts) for routes that want to record the attempt — call sites are added opportunistically.

## Forbidden actions (server-enforced)

- ✓ View other dealers' data — all list/get endpoints scope by `session.dealerId`.
- ✓ Approve own submissions — submissions go to an admin-only approval queue.
- ✓ Change payment status — only `payment_uploaded` transition is dealer-facing; payment approval is admin-only.
- ✓ Remove Sponsorlu/Reklam/Premium label — no dealer-facing route exposes label changes.

## Sprint 9F target

- Replace `getDealer(dealer_id)` lookup in login with `verifyDealerPassword({ email, password })`.
- Swap `<DealerLoginPicker>` for a real password form.
- Wire `dealerCan(session.role, perm)` checks into per-action mutation endpoints (e.g. only `owner` and `manager` can upload payment proof).
- Add `DealerUser` membership: an email-invited user joins a dealer with a role.
