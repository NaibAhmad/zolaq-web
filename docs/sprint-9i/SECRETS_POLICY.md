# Sprint 9I — Secrets Policy

## 1. Storage

- Secrets live ONLY in the hosting provider's environment-variable store.
- Never in repo. `.env*` is gitignored except `.env.example`.
- `.env.example` contains variable NAMES and empty values only — never real values.
- Local dev `.env` (untracked) may contain dev-fallback values; never production credentials.

## 2. Access

- Least privilege. The DB role used by the app is `SELECT / INSERT / UPDATE / DELETE` on the public schema only — never `SUPERUSER`, never the migration role (that is reserved for CI / dev machines running `prisma migrate dev`).
- Provider dashboards (DB, SMS, object storage) are accessed by named human accounts with MFA. No shared accounts.
- API keys for outbound services (SMS provider, future VIN provider) are scoped to the smallest possible permission set the provider exposes.

## 3. Forbidden in commits

CI must reject pull requests containing any of these patterns (case-insensitive):

- Real `AUTH_SESSION_SECRET`, `OTP_PHONE_HASH_SALT`, `VIN_HASH_SALT` values.
- `sk_live_`, `pk_live_`, `Bearer eyJ` (common JWT / Stripe-style prefixes).
- `INITIAL_ADMIN_PASSWORD=...` with a non-empty value.
- `SMS_API_KEY=...` with a non-empty value.
- `DATABASE_URL=postgresql://.*:.*@.*` with non-placeholder credentials.

Suggested CI grep (run on every PR):
```sh
git diff --cached | grep -Ei '^\+.*(sk_live_|pk_live_|Bearer eyJ|SMS_API_KEY=.+|INITIAL_ADMIN_PASSWORD=.+|postgresql://[^:]+:[^@]+@(?!placeholder))'
```

## 4. Rotation cadence

| Secret | Rotation | Trigger |
|---|---|---|
| `AUTH_SESSION_SECRET` | Annual, or on suspected compromise. Rotation invalidates all live sessions (users re-auth). | Calendar + incident |
| `OTP_PHONE_HASH_SALT` | **Never rotate.** Rotation invalidates all stored phone hashes and breaks the OTP de-dupe model. | Only if a breach makes the salt itself public |
| `VIN_HASH_SALT` | **Never rotate.** Same reasoning. | Same as above |
| `SMS_API_KEY` | On suspected compromise; provider rotation cadence; on departure of admins with provider dashboard access | Event-driven |
| `INITIAL_ADMIN_*` | One-time use; delete from env after first run | After bootstrap |
| `DATABASE_URL` (password component) | On suspected compromise; on DB role rotation | Event-driven |

## 5. Compromise response

1. Rotate the affected secret in the provider dashboard immediately.
2. Redeploy with the new value.
3. For `AUTH_SESSION_SECRET`: all users will be force-signed-out; communicate proactively.
4. For DB password: ensure no scheduled jobs / external integrations are using the old credential.
5. Audit: scan `AuditLog` for the time window of the suspected breach.

## 6. Local dev hygiene

- Developers MUST NOT use production secrets in local `.env`.
- Local `.env` should rely on dev fallbacks for `AUTH_SESSION_SECRET`, `OTP_PHONE_HASH_SALT`, `VIN_HASH_SALT` — these are documented in [.env.example](../../.env.example) and produce a `console.warn` on use.
- `DATABASE_URL` for local dev should point at a local Postgres or be left blank (in-memory fallback).
