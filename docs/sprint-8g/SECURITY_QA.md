# Sprint 8G — Security & Privacy QA

Eight invariants from the Sprint 8E-G spec, each with the file or check that enforces it.

| # | Invariant | Enforced by |
|---|-----------|-------------|
| 1 | Admin routes blocked without admin session | [app/admin/(authed)/layout.tsx](../../app/admin/(authed)/layout.tsx) calls `getAdminSession()` and redirects to `/admin/login` on null. Internal APIs use `requireAdmin()` from [lib/admin/api-utils.ts](../../lib/admin/api-utils.ts). |
| 2 | Dealer routes blocked without dealer session | [app/dealer/(authed)/layout.tsx](../../app/dealer/(authed)/layout.tsx) calls `getDealerSession()`. Dealer APIs use `requireDealer()` from [lib/admin/api-utils.ts](../../lib/admin/api-utils.ts). |
| 3 | Dealer only sees own data | Every dealer-facing store call scopes by `session.dealerId` — see `listAdRequests({ dealer_id })`, `listInvoices({ dealer_id })`, `listPaymentProofs({ dealer_id })`. Single-row reads go through `*ForDealer(id, dealerId)` helpers in [lib/ads/store.ts](../../lib/ads/store.ts), [lib/invoices/store.ts](../../lib/invoices/store.ts), [lib/payments/store.ts](../../lib/payments/store.ts). |
| 4 | Customer OTP session cannot unlock admin/dealer | Three separate cookies (`zlq_session`, `zlq_admin_session`, `zlq_dealer_session`) in [lib/auth/constants.ts](../../lib/auth/constants.ts) — never co-mingled. Each decoder validates its own payload shape; cross-session forgery requires forging the other cookie. |
| 5 | Admin session does not leak into customer profile logic | Customer profile APIs (`/api/profile/badges`, `/api/profile/activity`, existing `/api/profile/*`) read user via `getSession()` only, never `getAdminSession()`. |
| 6 | Draft / submitted / rejected data not visible publicly | Public Bazar Nəbzi route (`/api/market-pulse/topics`) filters to `["active", "closed", "resolved", "archived"]` — `draft`, `sponsored_pending_approval`, `rejected` are excluded. Ad placements: the public surface only ever queries `listActivePlacements()` in [lib/ads/store.ts](../../lib/ads/store.ts), which filters to `status === "active"`. |
| 7 | Sponsored labels cannot be removed from sponsored placements | `updateAdRequest` in [lib/ads/store.ts](../../lib/ads/store.ts) throws `LABEL_REQUIRED` when the current status is in `AD_PUBLIC_VISIBLE_STATUSES` and the new label is null. `transitionAdStatus` rejects transitions into public-visible statuses if `label === null`. |
| 8 | Gamification cannot affect recommendation / verification / official price | No code in `lib/decisions/`, `lib/dealers/`, `lib/cars/`, or any pricing path imports from `lib/gamification/`. Verified by grep: badges and points are read-only inputs to `/profile/badges` and `/profile/activity` only. |

## Reviewer commands

```pwsh
# 1-2: confirm guards in place.
Select-String -Path app\admin\(authed)\layout.tsx -Pattern "getAdminSession"
Select-String -Path app\dealer\(authed)\layout.tsx -Pattern "getDealerSession"

# 3: dealer scoping is present everywhere.
Select-String -Path app\api\dealer\**\*.ts -Pattern "auth.session.dealerId" -SimpleMatch

# 6: public list filters statuses.
Select-String -Path app\api\market-pulse\**\*.ts -Pattern "archived"

# 7: label guard exists.
Select-String -Path lib\ads\store.ts -Pattern "LABEL_REQUIRED|AD_PUBLIC_VISIBLE_STATUSES"

# 8: gamification isolation.
Select-String -Path lib\decisions\**\*.ts,lib\dealers\**\*.ts,lib\cars\**\*.ts -Pattern "gamification"
# Expected: zero matches.
```
