# Customer OTP Security Review — Sprint 9E

Reviewing the existing OTP flow against the Sprint 9E brief's customer checklist. UX is unchanged; this is an audit + minor hardening.

## Checklist

| Requirement | Status | Where |
|---|---|---|
| Phone is normalized to E.164 before hashing | ✓ | [lib/auth/phone.ts](../../lib/auth/phone.ts) `normalizePhone()` |
| Only `phone_hash` is stored — raw phone never persisted | ✓ | OTP session payload, audit rows, and logged messages all use `phoneHash`; mock provider logs only `phoneHash.slice(0,12)…` |
| `OTP_PHONE_HASH_SALT` required in production | ✓ (9E) | [lib/auth/phone.ts](../../lib/auth/phone.ts) throws if `IS_PRODUCTION && !OTP_PHONE_HASH_SALT`. Dev keeps fallback. |
| Max OTP attempts | ✓ | `OTP.MAX_ATTEMPTS = 3` in [lib/auth/constants.ts](../../lib/auth/constants.ts); enforced in [lib/auth/otp-store.ts](../../lib/auth/otp-store.ts) `incrementAttempts()` |
| Resend cooldown | ✓ | `OTP.RESEND_COOLDOWN_SECONDS = 60` |
| Session expiry | ✓ | `OTP.EXPIRY_SECONDS = 300` (5 min) checked in verify route |
| Per-phone hourly rate limit | ✓ | `OTP.RATE_LIMIT_PER_HOUR = 3` enforced in [app/api/auth/otp/request/route.ts](../../app/api/auth/otp/request/route.ts) |
| Session cookie expiry | ✓ | 7 days; cookie is HMAC-signed (Sprint 9E) so tamper attempts fail decode |
| Cookie is httpOnly + sameSite + secure-in-prod | ✓ | All three session helpers share the same flags. See [SESSION_COOKIE_SECURITY.md](SESSION_COOKIE_SECURITY.md). |
| `/profile/*` requires a session | ✓ | [proxy.ts](../../proxy.ts) middleware redirects to `/auth/otp` |
| `/api/leads` POST requires a session | ✓ | route calls `getSession()` and returns 401 if missing |
| Audit log captures OTP events | ✓ (9E) | new actions: `otp.requested`, `otp.rate_limited`, `otp.verified`, `otp.failed`, `otp.expired`, `otp.locked` — written via `writeAuditFireAndForget` with truncated phoneHash as actor_id |

## Known limitation: in-memory OTP store

[lib/auth/otp-store.ts](../../lib/auth/otp-store.ts) keeps OTP sessions and per-phone rate counters in `globalThis.__zlq_auth_stores`. Implications:

- Restarting the Next.js process clears all pending OTP sessions (users with a code-in-flight get "session not found"; not a security risk).
- Rate-limit counters reset on restart (lowers protection slightly under a restart loop; still bounded by the 5-minute expiry).
- Multiple instances behind a load balancer do not share state. Currently the app runs as a single instance.

**Fix is scheduled for Sprint 9F**, which will move OTP attempts onto the `OtpAttempt` table added in 9E ([prisma/schema.prisma](../../prisma/schema.prisma)).

## Known limitation: dev fallback salt

When `OTP_PHONE_HASH_SALT` is unset in dev, a fixed string is used. This is fine for local development (the goal is just to avoid storing raw phones) but production now refuses to start with the fallback active (see [lib/auth/phone.ts](../../lib/auth/phone.ts)).

## Out-of-scope (9F)

- Real SMS provider (currently `mock-otp-provider` logs to server console).
- Per-IP rate limit in addition to per-phone (currently only per-phone; an attacker rotating phones could still bypass the cap).
- OTP "purpose" enforcement at consumer routes (`session.purpose` is recorded but profile pages don't re-check it).
