# Sprint 9I — Environment Variables Reference

Source of truth is [.env.example](../../.env.example). This document expands each variable with read-site, sprint introduced, dev fallback behavior, and production requirement.

## Active variables (read by code today)

| Variable | Sprint | Read at | Dev fallback | Prod required? | Notes |
|---|---|---|---|---|---|
| `NODE_ENV` | n/a | [lib/env.ts:5](../../lib/env.ts#L5) | Next.js sets automatically | Set to `production` | Drives `IS_PRODUCTION` which gates strict checks across auth/hashing |
| `DEV_AUTH_MODE` | 9E | [lib/env.ts:11](../../lib/env.ts#L11) | unset → false | leave UNSET | When `true`, mock pickers and mock login routes are active |
| `AUTH_SESSION_SECRET` | 9E | [lib/auth/cookie-sign.ts](../../lib/auth/cookie-sign.ts) | `zolaq-dev-only-cookie-secret-do-not-use-in-prod` | YES — throws | HMAC key for all three session cookies. Generate with `openssl rand -base64 48` |
| `OTP_PHONE_HASH_SALT` | 9E | [lib/auth/phone.ts:20](../../lib/auth/phone.ts#L20) | `zolaq-dev-salt` | YES — throws | SHA-256 salt for phone-hashing. **Never rotate** — invalidates existing phone hashes |
| `DATABASE_URL` | 9B | [lib/db/availability.ts:18](../../lib/db/availability.ts#L18) + [lib/db/prisma.ts](../../lib/db/prisma.ts) | empty → in-memory mode | YES if you want persistence | Empty / placeholder host → `isDatabaseAvailable()` returns false and repos fall back to in-memory stores |
| `DIRECT_URL` | 9B | Prisma migrate | unset | required only with PgBouncer / pooler | Non-pooled URL for `prisma migrate` |
| `MEDIA_STORAGE_PROVIDER` | 9D | [lib/media/storage.ts](../../lib/media/storage.ts) | `local` | optional | Only `local` implemented this sprint |
| `MEDIA_UPLOAD_MAX_MB` | 9D | [lib/media/validation.ts](../../lib/media/validation.ts) | `8` | optional | Server-side validation cap |
| `MEDIA_PUBLIC_BASE_URL` | 9D | [lib/media/storage.ts](../../lib/media/storage.ts) | `/uploads` | optional | Public URL prefix for served files |
| `VIN_HASH_SALT` | 9H | [lib/vin-check/hash.ts](../../lib/vin-check/hash.ts) | `zolaq-dev-vin-salt` | YES — throws when `vinHash()` is called | **Never rotate** |

## Planned variables (declared in `.env.example`, not yet read by code)

| Variable | Sprint planned | Purpose |
|---|---|---|
| `SMS_PROVIDER` | 9F | `mock` \| `http` \| `disabled`. In production, `mock` or `unset` reports degraded health |
| `SMS_API_URL` | 9F | HTTP provider endpoint |
| `SMS_API_KEY` | 9F | HTTP provider auth — secret |
| `SMS_SENDER_ID` | 9F | Sender ID shown to the recipient |
| `SMS_TIMEOUT_MS` | 9F | Per-request timeout for the SMS HTTP call (default `5000`) |
| `INITIAL_ADMIN_EMAIL` | 9F | One-time seed for the Super Admin account |
| `INITIAL_ADMIN_PASSWORD` | 9F | One-time seed; deleted from the seed script after first run |

## Variables that MUST NOT appear in any committed file

`.env*` is gitignored except `.env.example`. The following must never be present in `.env.example` with real values, in tests, in seed data, in fixtures, or in any committed file:

- Real `AUTH_SESSION_SECRET`, `OTP_PHONE_HASH_SALT`, `VIN_HASH_SALT`.
- Real `SMS_API_KEY` or any provider API key.
- Real `INITIAL_ADMIN_PASSWORD`.
- Real `DATABASE_URL` / `DIRECT_URL` with credentials.

CI should grep for common secret formats (`sk_live_`, `Bearer eyJ`, etc.) on each PR.

## Validation at runtime

- `/api/health` ([app/api/health/route.ts](../../app/api/health/route.ts)) reports presence-only booleans for `AUTH_SESSION_SECRET`, `OTP_PHONE_HASH_SALT`, `VIN_HASH_SALT`. It NEVER returns the values.
- `IS_PRODUCTION && !AUTH_SESSION_SECRET` → cookie signing throws on first request.
- `IS_PRODUCTION && !OTP_PHONE_HASH_SALT` → `phoneHash()` throws on first OTP request.
- `IS_PRODUCTION && !VIN_HASH_SALT` → `vinHash()` throws on first VIN check.
- `IS_PRODUCTION && DEV_AUTH_MODE === "true"` → mock pickers reachable (bug; flagged as `degraded` by `/api/health`).
