# Auth & Security Architecture — Sprint 9E

## Three independent sessions, three cookies

| Audience | Cookie name | Helper module | Session payload |
|---|---|---|---|
| Customer (OTP) | `zlq_session` | [lib/auth/session.ts](../../lib/auth/session.ts) | `{ userId, phoneHash, verifiedAt, purpose, exp }` |
| Admin | `zlq_admin_session` | [lib/auth/admin-session.ts](../../lib/auth/admin-session.ts) | `{ adminId, name, role, exp }` |
| Dealer | `zlq_dealer_session` | [lib/auth/dealer-session.ts](../../lib/auth/dealer-session.ts) | `{ dealerId, contactName, role, dealerUserId?, exp }` |

The three never overlap — a customer with a `zlq_session` cookie cannot access `/admin/*` without an `zlq_admin_session`, and vice versa.

All three cookies share the same flags: `httpOnly: true`, `sameSite: "lax"`, `secure: NODE_ENV==="production"`, `path: "/"`, `maxAge: 7 days`. See [SESSION_COOKIE_SECURITY.md](SESSION_COOKIE_SECURITY.md) for the cutover (HMAC signing) details.

## Enforcement layers

1. **Layout guards** (server components) — every `/admin/(authed)/*` and `/dealer/(authed)/*` page is wrapped by a layout that calls `getAdminSession()` / `getDealerSession()` and redirects to the matching `/login` page when the session is missing or expired. Customer `/profile/*` is gated by [proxy.ts](../../proxy.ts) middleware which redirects to `/auth/otp`.

2. **API guards** — `requireAdmin(request, ...roles)`, `requireAdminPermission(request, perm)`, and `requireDealer(request)` in [lib/admin/api-utils.ts](../../lib/admin/api-utils.ts). Every internal/admin/dealer route runs one of these before any work. Forbidden (403) attempts are fire-and-forget written into AuditLog as `auth.forbidden`.

3. **Cookie signature** — `verifySigned()` in [lib/auth/cookie-sign.ts](../../lib/auth/cookie-sign.ts). A cookie that doesn't carry a valid HMAC over its payload is treated as "no session" (decode returns null → redirect to login). Production rejects unsigned cookies entirely; dev (`DEV_AUTH_MODE=true`) accepts legacy base64-JSON cookies for one cutover cycle.

4. **DEV_AUTH_MODE gate** — `/admin/login` and `/dealer/login` render mock pickers and the matching mock `/api/.../auth/login` routes accept submissions only when `DEV_AUTH_MODE=true`. Otherwise the pages show a placeholder and the routes reject with HTTP 503 + `admin.login.blocked_production_mock` / `dealer.login.blocked_production_mock` audit rows.

## Required env vars (production)

| Var | Purpose | Behavior when unset |
|---|---|---|
| `AUTH_SESSION_SECRET` | HMAC key for all three cookies | **Server refuses to start (throws on first cookie sign/verify call).** Dev fallback exists; production has no fallback. |
| `OTP_PHONE_HASH_SALT` | SHA-256 salt for customer phone hashing | `phoneHash()` throws on first call. Dev fallback exists. |
| `DEV_AUTH_MODE` | Mock login enabled | Mock pickers hidden, mock login routes return 503. Set to `true` only in dev/staging. |

## Sprint 9E foundation (DB tables, no migration yet)

[prisma/schema.prisma](../../prisma/schema.prisma) gained:

- `AdminUser` — `password_hash`, `status`, `last_login_at`, `failed_login_count`
- `AdminUserRole` — `(admin_id, role)` join (multi-role per admin)
- `AdminSession` — opaque DB-backed sessions for revocation
- `DealerUser` — `dealer_id`, `role` (owner/manager/staff), `password_hash`, status fields
- `OtpAttempt` — persistent OTP attempt log (replaces the in-memory store in Sprint 9F)

Repository stubs at [lib/auth/admin-user-repository.ts](../../lib/auth/admin-user-repository.ts) and [lib/auth/dealer-user-repository.ts](../../lib/auth/dealer-user-repository.ts) throw `Not implemented (Sprint 9F)`. Sprint 9F will run the migration, seed initial users, and wire the password login form.

## Out of scope (Sprint 9F+)

- Real bcrypt password storage + login form
- SMS provider (still mock via [lib/auth/mock-otp-provider.ts](../../lib/auth/mock-otp-provider.ts))
- DB-backed OTP attempt store (still in-memory `globalThis.__zlq_auth_stores`)
- Session revocation UI (`AdminSession.revoked_at` exists but isn't checked yet)
- SSO / OAuth integration
