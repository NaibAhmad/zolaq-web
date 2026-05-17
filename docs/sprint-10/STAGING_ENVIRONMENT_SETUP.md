# Sprint 10 — Staging Environment Setup

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Host:** Vercel.
**Domain:** `staging.zolaq.az`.

## Purpose

Single source of truth for provisioning the closed-beta staging environment. This document covers DNS, hosting, environment variables, secret sourcing, the post-deploy `/api/health` smoke, and the rollback entry point.

Staging is **closed beta only** — not indexed, not public, and not yet wired to a real SMS provider.

## 1. Hosting platform

| Item | Value | Notes |
|---|---|---|
| Provider | Vercel | Production-grade Next.js host; native support for [app/](../../app/) router and Edge runtime. |
| Project | `zolaq-staging` | Separate Vercel project from any future production project. |
| Branch | `master` (or a dedicated `staging` branch if branch protection is added later) | Automatic deploy from VCS. |
| Region | Frankfurt (`fra1`) or closest EU region | Lowest latency to Azerbaijan. |
| Postgres | Vercel Postgres **or** Supabase Postgres | Either is acceptable; both expose pooled (`DATABASE_URL`) and direct (`DIRECT_URL`) connection strings. |
| Media storage | Local FS (`/public/uploads/`) for closed beta | Vercel filesystem is ephemeral between deploys — see §6 for the closed-beta caveat. Production-grade media storage (S3 / R2 / Supabase Storage) is tracked as a non-blocking TODO. |

## 2. DNS

| Record | Type | Target |
|---|---|---|
| `staging.zolaq.az` | CNAME | `cname.vercel-dns.com` |

After the CNAME propagates, attach the domain in Vercel's project settings → Domains. Vercel will issue and renew a Let's Encrypt cert automatically.

## 3. Environment variables

All values must be set in Vercel → Project → Settings → Environment Variables → Preview/Production scope as appropriate. **Do not commit any real value to the repo.** [.env.example](../../.env.example) documents the names and contracts.

### 3.1 Required for closed beta

| Variable | Required? | How to source | Notes |
|---|---|---|---|
| `DEV_AUTH_MODE` | **Unset** (or `false`) | n/a | Must NOT be `true` in staging. Mock login pickers are rejected when unset. |
| `AUTH_SESSION_SECRET` | ✅ Required | `openssl rand -base64 48` | HMAC secret signing all three session cookies. Treat as **never rotate** during the beta (rotating invalidates every active session). |
| `OTP_PHONE_HASH_SALT` | ✅ Required | `openssl rand -base64 32` | SHA-256 salt for phone-number hashing. Server refuses to start without it in production. **Never rotate** — rotating invalidates every existing OTP attempt record. |
| `VIN_HASH_SALT` | ✅ Required | `openssl rand -base64 32` | SHA-256 salt for VIN hashing. Reserved for the still-internal VIN Check feature; setting it now avoids a server-start crash if any code path touches it. **Never rotate.** |
| `DATABASE_URL` | ✅ Required | Vercel Postgres / Supabase | Pooled connection string. |
| `DIRECT_URL` | ✅ Required | Vercel Postgres / Supabase | Direct (non-pooled) connection used by `prisma migrate`. Must NOT go through PgBouncer. |
| `MEDIA_STORAGE_PROVIDER` | ✅ Required | Literal | `local` for closed beta. |
| `MEDIA_UPLOAD_MAX_MB` | Optional | Literal | Defaults to `8`. |
| `MEDIA_PUBLIC_BASE_URL` | Optional | Literal | Defaults to `/uploads`. |
| `SMS_PROVIDER` | ✅ Required | Literal | `mock` for closed beta. Real provider selection deferred — see [SMS_PROVIDER_READINESS.md](./SMS_PROVIDER_READINESS.md). |
| `SMS_API_URL` | Skip for beta | — | Only needed when `SMS_PROVIDER=http`. |
| `SMS_API_KEY` | Skip for beta | — | Only needed when `SMS_PROVIDER=http`. Treat as secret. |
| `SMS_SENDER_ID` | Skip for beta | — | Only needed when `SMS_PROVIDER=http`. |
| `SMS_TIMEOUT_MS` | Optional | Literal | Defaults to `5000`. |
| `INITIAL_ADMIN_EMAIL` | ✅ Required (one-time) | Operator-chosen | Email of the first super_admin. Used only by `npm run bootstrap:admin`. |
| `INITIAL_ADMIN_PASSWORD` | ✅ Required (one-time) | `openssl rand -base64 24` | Strong random password. Treat as write-once — rotate via the proper change-password flow after first sign-in. Never log. |
| `INITIAL_ADMIN_NAME` | Optional | Literal | Display name; defaults to email prefix. |

### 3.2 Secret hygiene

- Vercel encrypts environment variables at rest and only injects them into the runtime; no need to commit.
- Use a password manager (1Password / Bitwarden) to store the three generated salts + admin password. Lose them and recovery requires re-provisioning the DB.
- `AUTH_SESSION_SECRET`, `OTP_PHONE_HASH_SALT`, `VIN_HASH_SALT` are flagged **never rotate** in [docs/sprint-9i/SECRETS_POLICY.md](../sprint-9i/SECRETS_POLICY.md) §4.

## 4. Initial database provisioning

Provisioning order:

1. Create the Postgres instance (Vercel Postgres or Supabase) and copy both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
2. Set the env vars in Vercel.
3. Run the migration + seed + bootstrap from a local shell pointed at the staging URL — see [DB_MIGRATION_AND_SEED_RUNBOOK.md](./DB_MIGRATION_AND_SEED_RUNBOOK.md).

## 5. `/api/health` smoke

After every deploy, verify [/api/health](../../app/api/health/route.ts):

```bash
curl -i https://staging.zolaq.az/api/health
```

**Expected:**
- HTTP `200`
- JSON body with `status: "ok"`, `environment: "production"` (Vercel sets `NODE_ENV=production`), `devAuthMode: false`, all secret-presence booleans `true`, `database.connected: true`.
- Body must NOT contain any secret value — only booleans.

**If HTTP 503:** the health endpoint flagged the deploy as `degraded`. Check the response for which check failed (`auth.sessionSecret`, `otp.phoneHashSalt`, `vinHashSalt`, `database.connected`, `media.providerConfigured`, `sms.providerConfigured`, etc.). Do not promote until green.

## 6. Media upload caveat (closed beta)

`MEDIA_STORAGE_PROVIDER=local` writes to `/public/uploads/` on the Vercel server filesystem. **Vercel's filesystem is ephemeral** — files are wiped on every deploy. For closed beta this is acceptable because:

- Test data can be re-seeded on each deploy.
- Dealer media uploaded during beta is treated as throwaway test content.
- Beta users are warned in the feedback form that uploaded media may be cleared.

Production-grade media storage (S3 / R2 / Supabase Storage) is a Sprint 11+ task documented in [docs/sprint-9d/STORAGE_PROVIDER_DECISION.md](../sprint-9d/STORAGE_PROVIDER_DECISION.md).

## 7. Rollback entry point

If the deploy is broken or a P0 surfaces during beta, follow [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md). The fastest path is Vercel → Deployments → previous green deploy → "Promote to Production."

## 8. Indexing protection

Staging must never be indexed. See [PERFORMANCE_SEO_BETA_CHECKLIST.md](./PERFORMANCE_SEO_BETA_CHECKLIST.md) for the `X-Robots-Tag` / `robots.txt` configuration that ships with the staging deploy.

## Cross-references

- Deploy steps: [STAGING_DEPLOYMENT_CHECKLIST.md](./STAGING_DEPLOYMENT_CHECKLIST.md)
- Rollback: [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md)
- DB migration + seed: [DB_MIGRATION_AND_SEED_RUNBOOK.md](./DB_MIGRATION_AND_SEED_RUNBOOK.md)
- Env var contract: [.env.example](../../.env.example), [docs/sprint-9i/ENVIRONMENT_VARIABLES.md](../sprint-9i/ENVIRONMENT_VARIABLES.md)
- Secrets policy: [docs/sprint-9i/SECRETS_POLICY.md](../sprint-9i/SECRETS_POLICY.md)
