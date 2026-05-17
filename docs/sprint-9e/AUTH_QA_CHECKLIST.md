# Auth QA Checklist — Sprint 9E

Run after every auth-related change. None of these require a database (the audit-write events fall through to the in-memory store).

## Environment

- [ ] `npm run lint` — clean
- [ ] `npx tsc --noEmit` — clean
- [ ] `npm run build` — succeeds (this is the only check that exercises production behavior of the env gate; ensure `DEV_AUTH_MODE` is set in `.env` or accept that login pages show the placeholder)

## Routes — DEV mode (`DEV_AUTH_MODE=true npm run dev`)

- [ ] `GET /admin/login` → role picker renders.
- [ ] `POST /api/admin/auth/login` with a valid `admin_id` → 303 → `/admin/dashboard`. Audit `admin.login` row appears.
- [ ] `POST /api/admin/auth/login` with garbage `admin_id` → 404. Audit `admin.login.failed` row appears.
- [ ] `GET /admin/dashboard` without a cookie → 303 → `/admin/login`.
- [ ] Logged in as `moderator`, request `POST /api/admin/media/upload` → 403 + `auth.forbidden` audit row.
- [ ] `GET /dealer/login` → dealer picker renders.
- [ ] Dealer login flow → 303 → `/dealer/dashboard`, audit `dealer.login` row.
- [ ] `POST /api/dealer/auth/logout` → cookie cleared, audit `dealer.logout` row.
- [ ] Hand-edit the `zlq_admin_session` cookie value → next request to `/admin/dashboard` → 303 → `/admin/login` (HMAC verify fails).
- [ ] `POST /api/auth/otp/request` with a valid phone → returns `otp_session_id`, audit `otp.requested` row.
- [ ] Spam OTP requests (>3/h) → 429 + audit `otp.rate_limited` row.
- [ ] Wrong OTP code → 400, audit `otp.failed` row; after 3 wrong codes → audit `otp.locked`.
- [ ] Correct OTP → session cookie set, audit `otp.verified` row, redirect to `/profile`.
- [ ] `/profile` without a customer session → middleware redirects to `/auth/otp`.

## Routes — PROD-like mode (`DEV_AUTH_MODE` unset; `npm run build && npm start`)

- [ ] `GET /admin/login` → renders `<PasswordSignInPlaceholder>`. No picker.
- [ ] `POST /api/admin/auth/login` → 503 `AUTH_NOT_AVAILABLE`. Audit `admin.login.blocked_production_mock` row.
- [ ] `GET /dealer/login` → renders placeholder. No picker.
- [ ] `POST /api/dealer/auth/login` → 503. Audit `dealer.login.blocked_production_mock` row.
- [ ] OTP flow continues to work (it doesn't depend on DEV_AUTH_MODE).
- [ ] With no `AUTH_SESSION_SECRET` and any login attempt → server throws on first sign/verify; the error message names the env var.
- [ ] With no `OTP_PHONE_HASH_SALT` and a POST to `/api/auth/otp/request` → server throws naming the env var.

## Dealer tenancy

- [ ] Logged in as dealer A, `GET /api/dealer/offers/<offer-of-dealer-B>` → 404 (no cross-tenant data leak).
- [ ] (Optional) wire `auditDealerScopeViolation()` into a route that receives a dealer_id param and check that the audit row appears.

## Cookie integrity

- [ ] Cookie values in DevTools include a `.` separator (signed format).
- [ ] After logout, the cookie is set with `Max-Age=0` and disappears from the browser.

## Three-session isolation

- [ ] Customer cookie alone → cannot reach `/admin/*` (303 to `/admin/login`).
- [ ] Admin cookie alone → cannot reach `/profile/*` (middleware redirects to `/auth/otp`).
- [ ] Dealer cookie alone → cannot reach `/admin/*`.
