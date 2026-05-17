# Sprint 9I — Staging Deployment Guide

This guide describes how to deploy zolaq-web to a staging environment running on Node 20+. It assumes a PostgreSQL database, an HTTPS reverse proxy (or PaaS equivalent), and a hosting provider that exposes environment variables securely.

Sister docs in this folder:
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) — variable reference.
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) — pre/during/post deploy.
- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) — what to do if a release breaks.
- [SECRETS_POLICY.md](./SECRETS_POLICY.md) — how secrets are stored and rotated.
- [DATABASE_MIGRATION_RUNBOOK.md](./DATABASE_MIGRATION_RUNBOOK.md) — current migration state and procedure.

## 0. Prerequisites

- Node 20+ (matches the version used in CI / local dev).
- PostgreSQL 14+ instance reachable from the app host.
- An object-storage bucket OR a persistent volume for `/public/uploads/` (staging may use the local filesystem; production must mirror to durable storage — see [docs/sprint-9d/STORAGE_PROVIDER_DECISION.md](../sprint-9d/STORAGE_PROVIDER_DECISION.md)).
- HTTPS termination — cookies are signed `secure` in production.

## 1. Provision the database

1. Create the Postgres database and a least-privilege role with `CREATE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE` on the public schema.
2. Capture two connection strings:
   - `DATABASE_URL` — pooled / app-runtime URL.
   - `DIRECT_URL` — non-pooled URL used by `prisma migrate` (only required if `DATABASE_URL` points at PgBouncer / Supabase pooler).

## 2. Set environment variables

Set the following at the hosting provider (never in repo):

| Required | Variable | Notes |
|---|---|---|
| ✅ | `DATABASE_URL` | from step 1 |
| ✅ | `AUTH_SESSION_SECRET` | `openssl rand -base64 48` |
| ✅ | `OTP_PHONE_HASH_SALT` | `openssl rand -base64 32` — **never rotate** (invalidates existing phone hashes) |
| ✅ | `VIN_HASH_SALT` | `openssl rand -base64 32` — **never rotate** |
| ✅ | `NODE_ENV=production` | enables `IS_PRODUCTION` guards in [lib/env.ts](../../lib/env.ts) |
| ✅ | `DEV_AUTH_MODE` | leave UNSET. If accidentally `true` the mock pickers become publicly reachable |
| optional | `DIRECT_URL` | step 1 |
| optional | `MEDIA_STORAGE_PROVIDER` | defaults to `local`; documented but only `local` is implemented today |
| optional | `MEDIA_PUBLIC_BASE_URL` | defaults to `/uploads` |
| optional | `MEDIA_UPLOAD_MAX_MB` | defaults to `8` |

Full list, with where each is read in source: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

`SMS_PROVIDER`, `SMS_API_*`, `INITIAL_ADMIN_*` are present in [.env.example](../../.env.example) but NOT YET READ by any code — set only when Sprint 9F lands.

## 3. Run the build

```sh
npm ci
npm run prisma:generate
npm run build
```

## 4. Migrate the database

See [DATABASE_MIGRATION_RUNBOOK.md](./DATABASE_MIGRATION_RUNBOOK.md). At the time of writing the `prisma/migrations/` directory is empty; the project ran in hybrid fallback mode through Sprint 9E. Before staging deploy:

1. On a developer machine connected to a fresh DB: `npx prisma migrate dev --name init_9e_baseline` — generates the initial migration containing all 9B/9C/9D/9E tables.
2. Commit the generated `prisma/migrations/` directory.
3. On the staging host: `npx prisma migrate deploy`.

## 5. Start the server

```sh
npm start
```

Behind the reverse proxy, expose port `3000` (or whatever `PORT` you set).

## 6. Verify

1. `curl https://<staging-host>/api/health` — must return `status: "ok"` with `environment: "production"` and `devAuthMode: false`. A `503` with `degraded` body means one of the required env vars or the DB is missing.
2. Hit `/admin/login` — must show the placeholder, NOT the mock picker.
3. Hit `/dealer/login` — same.
4. `POST /api/admin/auth/login` with any body — must return `503 AUTH_NOT_AVAILABLE` until Sprint 9F lands.
5. Smoke a sample public route (`/`, `/cars`) — must render without 5xx.

## 7. Bootstrapping the initial admin (deferred to Sprint 9F)

The DB-backed admin sign-in does not exist yet. Until it ships:
- Set `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` in advance so the seed script can pick them up on first run.
- Do NOT enable `DEV_AUTH_MODE=true` in staging as a workaround — it exposes the mock picker.

## 8. Known limitations

- No outbound SMS in staging until Sprint 9F. OTP flow will fail at the send step unless `SMS_PROVIDER=mock` is acceptable for the staging audience and you also temporarily enable `DEV_AUTH_MODE=true` (do not do this if the staging host is publicly reachable).
- Media uploads land on the local filesystem; restarts do not lose them but autoscaling does. Mirror to object storage before user-visible traffic.
- No structured logging — all log output is `console.*`. Hosting provider log aggregator captures it; see [docs/sprint-9j/MONITORING_LOGGING_PLAN.md](../sprint-9j/MONITORING_LOGGING_PLAN.md).
