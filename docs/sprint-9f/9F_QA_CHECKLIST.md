# Sprint 9F QA checklist

## Automated

- [x] `npx prisma validate` — pass.
- [x] `npx prisma format` — clean.
- [x] `npx prisma generate` — client regenerated with new fields/models.
- [x] `npx tsc --noEmit` — no errors.
- [x] `npm run lint` — clean.
- [ ] `npm run build` — see the build log in the sprint output report.

## Routes to smoke-check (dev mode, DEV_AUTH_MODE=true)

- [ ] `/admin/login` — mock picker still works → `/admin/dashboard`.
- [ ] `/admin/login` — real form, after `npm run bootstrap:admin`,
      successfully signs in.
- [ ] `/admin/dashboard` — renders for signed-in admin.
- [ ] `/dealer/login` — mock picker still works → `/dealer/dashboard`.
- [ ] `/dealer/login` — real form, with a manually upserted `DealerUser`,
      successfully signs in.
- [ ] `/dealer/dashboard` — renders for signed-in dealer.
- [ ] `/auth/otp` — request + verify, memory store path (no DB).
- [ ] `/auth/otp` — request + verify, DB store path
      (DATABASE_URL points at a writable Postgres after migration).
- [ ] `/profile` — customer session readable after OTP verify.
- [ ] `/dealer/offers/new` — owner can submit; staff session is rejected
      with 403.
- [ ] `/dealer/media` — owner / manager can upload; staff is rejected.
- [ ] `/dealer/payment-proof` — owner can upload; manager is rejected
      (manager has no `dealer.payment_proof.upload`).

## Production-like mode (DEV_AUTH_MODE=false, DB unavailable)

- [ ] `POST /api/admin/auth/login` with `{ email, password }` → 503
      `AUTH_NOT_AVAILABLE`.
- [ ] `POST /api/admin/auth/login` with `{ admin_id }` → 503
      `AUTH_NOT_AVAILABLE`.
- [ ] `POST /api/dealer/auth/login` — same, both shapes.
- [ ] `POST /api/auth/otp/request` — 503 `AUTH_NOT_AVAILABLE` because the
      default `SMS_PROVIDER` in production is `disabled`.
- [ ] No `[MOCK-OTP]` line ever appears in the server console.

## Security checks

- [ ] Tampered admin cookie → `verifySigned` returns `null` → session not
      recognized → redirect to `/admin/login`.
- [ ] Customer `zlq_session` cookie does NOT unlock `/admin/*` or
      `/dealer/*` (different cookies, different decoders).
- [ ] Admin cookie does NOT pass `/api/profile` checks as a customer.
- [ ] Dealer A cannot read dealer B's offers / leads / invoices: cross-
      `dealer_id` requests audit-log `auth.dealer_scope_violation`.
- [ ] `/api/auth/otp/request` is rate-limited at 3 requests/hour per
      `phone_hash` (memory and DB modes).
- [ ] Server logs contain no raw phone numbers.
- [ ] Server logs contain no plaintext OTP codes in production.
- [ ] `.env` is in `.gitignore`; `.env.example` has placeholders only.
- [ ] No bcrypt / argon2 dependency was added (`node:crypto` only).
- [ ] `AdminUser.password_hash` is never returned by any API.
- [ ] `DealerUser.password_hash` is never returned by any API.

## Audit actions to verify in the audit log

- [ ] `admin.login` on successful admin login.
- [ ] `admin.login.failed` on each wrong-password attempt.
- [ ] `admin.login.blocked_production_mock` when mock POST is rejected.
- [ ] `admin.logout` on logout.
- [ ] `dealer.login` / `dealer.login.failed` / `dealer.login.blocked_production_mock` / `dealer.logout`.
- [ ] `auth.forbidden` when a dealer role is missing a per-action permission.
- [ ] `auth.dealer_scope_violation` when a dealer references another dealer's
      entity.
- [ ] `otp.requested` / `otp.rate_limited` / `otp.verified` / `otp.failed` /
      `otp.locked` / `otp.expired` fire on the matching code paths.

## Known TODOs (out of scope for 9F)

- Real SMS vendor pick (Twilio vs SMSc vs local Azeri vendor). Adapter shape
  is in place; vendor wrapper is one file.
- `prisma migrate dev` against staging (the SQL is documented but not run by
  9F).
- `getAdminSession()` / `getDealerSession()` could call
  `isAdminSessionRevoked` / `isDealerSessionRevoked` to honor server-side
  revocation on every request. Currently the helpers exist and the row is
  written; route-level revocation enforcement is opt-in this sprint.
- Manual unlock UI for locked admin/dealer accounts (currently SQL-only).
