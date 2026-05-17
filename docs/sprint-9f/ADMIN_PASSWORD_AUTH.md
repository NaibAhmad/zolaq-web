# Admin password auth (Sprint 9F)

## Flow

1. User submits email + password to `POST /api/admin/auth/login` (JSON or
   form). The form lives in
   [`components/auth/PasswordSignInForm.tsx`](../../components/auth/PasswordSignInForm.tsx)
   and is rendered by [`app/admin/login/page.tsx`](../../app/admin/login/page.tsx).
2. Route handler in
   [`app/api/admin/auth/login/route.ts`](../../app/api/admin/auth/login/route.ts)
   branches on body shape:
   - `{ email, password }` → real path (this doc).
   - `{ admin_id }` → legacy mock picker, only if `DEV_AUTH_MODE=true`.
3. `verifyAdminPassword` from
   [`lib/auth/admin-user-repository.ts`](../../lib/auth/admin-user-repository.ts):
   - Throws `AuthNotAvailableError` if DB is unavailable. Route maps this to
     `HTTP 503 AUTH_NOT_AVAILABLE`.
   - Looks up by lowercased email. No row → `invalid_credentials`.
   - `status !== "active"` → `disabled`.
   - `failed_login_count >= 5` and last activity within 15 min → `locked`.
   - Verifies the password via `verifyPassword` (scrypt timing-safe compare).
   - On failure: increments `failed_login_count`, emits `admin.login.failed`.
   - On success: resets counter, stamps `last_login_at`, creates an
     `AdminSession` row (`session_id = asess_<uuid>`, 7-day TTL), and emits
     `admin.login`.
4. Cookie value carries `{ adminId, name, role, sessionId, exp }` HMAC-signed
   via existing `signPayload`. `sessionId` is what logout uses to mark the
   session row revoked.

## Lockout policy

- Threshold: **5 consecutive failures**.
- Window: **15 minutes from the last activity (`last_login_at`)**.
- Recovery: a successful login resets `failed_login_count` to 0 — there is no
  manual unlock UI this sprint. A super_admin can update the row directly via
  `prisma studio` or SQL if needed.
- Audited via `admin.login.failed` for each miss; the 6th+ attempt returns
  `LOCKED` (HTTP 423) with the same audit action.

## Logout

`POST /api/admin/auth/logout` reads the cookie, marks
`AdminSession.revoked_at = now()` (if the cookie carries a `sessionId` and DB
is available), clears the cookie unconditionally, and writes `admin.logout`.
A future request that presents the same cookie is rejected at the session
helper layer once `isAdminSessionRevoked` is wired into `getAdminSession`
checks (currently used by route handlers that opt in).

## Bootstrap

The first super_admin is created out-of-band via
[`scripts/bootstrap-admin.ts`](../../scripts/bootstrap-admin.ts):

```bash
INITIAL_ADMIN_EMAIL=ops@zolaq.az \
INITIAL_ADMIN_PASSWORD='change-me-strong' \
INITIAL_ADMIN_NAME='Ops' \
npm run bootstrap:admin
```

The script reads env vars (refuses to run without them), hashes the password
with `hashPassword()`, upserts the AdminUser, and writes the `super_admin`
role into AdminUserRole. Idempotent — re-running rotates the password hash.
**Never logs the password.**

## Production safety

- `DEV_AUTH_MODE !== "true"` → the JSON path `{ admin_id }` is rejected with
  `AUTH_NOT_AVAILABLE`. The mock `RoleSwitcher` UI is hidden.
- `password_hash` is required; an AdminUser row with `password_hash IS NULL`
  cannot sign in (scrypt verify fails on empty stored hash).
- Generic `Invalid credentials` message on all failure paths — no email
  enumeration.
- Timing-safe HMAC compare on cookie signature; timing-safe equality on
  password hash.
