# OTP persistence (Sprint 9F)

## Goals

- Persist OTP attempts across restarts so an attacker cannot avoid rate-limit
  by waiting for a memory-clearing reboot.
- Never store the raw phone number or the raw OTP code.
- Keep the dev/local DX: when `DATABASE_URL` is missing or the DB is
  unreachable, fall back to the same in-memory store the app has always used.
- In production-like mode (`DEV_AUTH_MODE !== "true"`), refuse to handle OTP
  if no provider is available — return `AUTH_NOT_AVAILABLE` (HTTP 503).

## Storage model

`OtpAttempt` (see [prisma/schema.prisma](../../prisma/schema.prisma)):

| Field          | Type      | Notes |
|----------------|-----------|-------|
| `attempt_id`   | String PK | `otp_<uuid>` |
| `phone_hash`   | String    | SHA-256 via `phoneHash()` (`OTP_PHONE_HASH_SALT`) |
| `purpose`      | String    | `lead_submit` / `whatsapp_handoff` / `profile_access` |
| `code_hash`    | String    | HMAC-SHA256 of the code, keyed by `AUTH_SESSION_SECRET`. base64url. |
| `attempt_count`| Int       | Number of verify attempts so far |
| `max_attempts` | Int (=3)  | Configurable per row; default matches `OTP.MAX_ATTEMPTS` |
| `expires_at`   | DateTime  | `created_at + 300s` |
| `verified_at`  | DateTime? | Set when verify succeeds |
| `consumed_at`  | DateTime? | Spec field; mirrors `verified_at` for clarity |
| `locked_at`    | DateTime? | Set when `attempt_count >= max_attempts` or after explicit lock |
| `created_at`   | DateTime  | `default(now())` |

Indexes: `(phone_hash, created_at)` and `(phone_hash, purpose, created_at)`.

### Field-name mapping

The sprint spec called the counter `attempts_count`. We kept the existing 9E
column name `attempt_count` to avoid a destructive rename. Application code,
this doc, and the SQL preview all use `attempt_count`.

## Rate-limit in DB mode

`checkRateLimit(phoneHash)` queries:

```sql
SELECT created_at FROM otp_attempts
WHERE phone_hash = $1 AND created_at >= now() - interval '1 hour'
ORDER BY created_at ASC;
```

`allowed = rows.length < OTP.RATE_LIMIT_PER_HOUR (=3)`. The retry-after value
is computed from the oldest in-window row. In DB mode `recordRequest()` is a
no-op because `createOtpSession()` already inserted the row.

## Verify path

`verifyCode(id, code)` performs atomic-ish updates:

1. Load the row by `attempt_id`.
2. If `locked_at` is set → return `locked`.
3. If `verified_at` is set → return `already_verified`.
4. If `expires_at < now()` → set `locked_at = now()`, return `expired`.
5. Compare `hmac(code) === code_hash` with `timingSafeEqual`.
6. On miss: `attempt_count += 1`, optionally `locked_at = now()` when the new
   count reaches `max_attempts`. Return `invalid_code` with
   `attemptsRemaining`.
7. On hit: `verified_at = now()`, `consumed_at = now()`. Return `ok`.

## Audit actions

Already defined in [`lib/admin/types.ts`](../../lib/admin/types.ts); every
emit uses the truncated phoneHash (first 16 chars) as `actor_id` and
`entity_id`. Raw phone never appears in audit rows.

| Action            | Where emitted |
|-------------------|---------------|
| `otp.requested`   | After successful `createOtpSession + sendCode` |
| `otp.rate_limited`| When `checkRateLimit.allowed === false` |
| `otp.verified`    | On verify hit |
| `otp.failed`      | On verify miss (per attempt) |
| `otp.locked`      | When the verify miss puts the row over `max_attempts`, OR when the row was already locked |
| `otp.expired`     | When verify is called after `expires_at` |

## Fallback behaviour

- DB available → DB-mode (writes to `otp_attempts`).
- DB unavailable AND `DEV_AUTH_MODE === "true"` → memory-mode (globalThis
  Map). Same API surface, no privacy regression because the memory store also
  never holds the raw phone, only the hash.
- DB unavailable AND `DEV_AUTH_MODE !== "true"` → the **SMS provider** is the
  gate: in production the default `SMS_PROVIDER=disabled` makes the OTP route
  return `AUTH_NOT_AVAILABLE` before reaching the store. If someone forces
  `SMS_PROVIDER=mock` in production, the mock provider's constructor throws.

## Never logged

- Raw phone number — only the `phoneHash` prefix (first 12–16 chars).
- OTP code — neither `[MOCK-OTP]` nor any error message includes it in
  production paths. The mock provider logs the code by design in dev only.
