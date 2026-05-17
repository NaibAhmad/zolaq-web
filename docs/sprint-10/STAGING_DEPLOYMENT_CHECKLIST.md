# Sprint 10 — Staging Deployment Checklist

**Status:** Sprint 10 readiness doc.
**Date:** 2026-05-17
**Use:** Run through this checklist for every staging deploy during closed beta.

## A. Pre-deploy (run from local dev shell)

- [ ] `git status` clean on the branch being deployed.
- [ ] `git pull` to ensure local copy is up to date with the deploy branch.
- [ ] `npx prisma validate` — schema valid.
- [ ] `npx prisma format` — schema formatting unchanged.
- [ ] `npx prisma generate` — client generated without errors.
- [ ] `npm run lint` — zero errors.
- [ ] `npx tsc --noEmit` — zero errors.
- [ ] `npm run build` — green.
- [ ] No new files under `prisma/migrations/` that haven't been reviewed.
- [ ] `.env*` files NOT staged for commit (verify `.gitignore`).
- [ ] All secrets referenced by [.env.example](../../.env.example) are present in Vercel env settings — see [STAGING_ENVIRONMENT_SETUP.md](./STAGING_ENVIRONMENT_SETUP.md) §3.

## B. Pre-deploy (Vercel side)

- [ ] Vercel project `zolaq-staging` is connected to the correct VCS branch.
- [ ] All required env vars set under Preview/Production scope.
- [ ] No `DEV_AUTH_MODE` env var present (it must be unset, NOT set to `false`-as-string and NOT set to `true`).
- [ ] `staging.zolaq.az` domain attached with valid TLS cert.
- [ ] Previous deployment is healthy (so rollback target exists).

## C. Database (first-time deploy only)

If this is the very first staging deploy, run the full DB bootstrap from a local shell with the staging `DATABASE_URL` exported:

- [ ] `npx prisma migrate deploy` — applies migrations to staging Postgres.
- [ ] `npm run db:seed` — populates baseline catalog + dealer seed data.
- [ ] `npm run bootstrap:admin` — creates the initial super_admin from `INITIAL_ADMIN_*`.
- [ ] Verify tables exist via `psql` or Vercel Postgres console: `\dt` should list `AdminUser`, `AdminUserRole`, `AdminSession`, `DealerUser`, `DealerSession`, `OtpAttempt`, `Brand`, `Model`, `Generation`, `Trim`, `TrimSpec`, `CatalogPrice`, `Dealer`, `DealerOffer`, `MediaAsset`, `MediaUsage`, `AuditLog`.

Full procedure: [DB_MIGRATION_AND_SEED_RUNBOOK.md](./DB_MIGRATION_AND_SEED_RUNBOOK.md).

## D. Deploy

- [ ] Trigger deploy: push to the connected branch, or click "Redeploy" in Vercel.
- [ ] Watch the build log for warnings or non-zero exit codes.
- [ ] Wait until the deploy is marked **Ready** in Vercel.

## E. Post-deploy smokes

Run each against `https://staging.zolaq.az`:

### E.1 Infrastructure
- [ ] `curl -i https://staging.zolaq.az/api/health` → HTTP 200, `status: "ok"`, all check flags green, body contains zero secret values.
- [ ] Confirm `X-Robots-Tag: noindex, nofollow` header is present on every HTML response (see [PERFORMANCE_SEO_BETA_CHECKLIST.md](./PERFORMANCE_SEO_BETA_CHECKLIST.md)).
- [ ] `curl https://staging.zolaq.az/robots.txt` returns deny-all.

### E.2 Public route inventory
- [ ] `/` — renders.
- [ ] `/cars` — renders with results from seed data.
- [ ] `/cars/[carId]` — first detail page renders.
- [ ] `/compare` — renders empty state.
- [ ] `/dealers` — renders.
- [ ] `/news` — renders.
- [ ] `/encyclopedia` — renders.
- [ ] `/qa` — renders.

### E.3 Auth
- [ ] `/admin/login` — shows real password form only (no mock picker).
- [ ] `/dealer/login` — shows real password form only.
- [ ] Sign in with `INITIAL_ADMIN_EMAIL` + `INITIAL_ADMIN_PASSWORD` — lands on admin dashboard.
- [ ] Sign out — session cleared, redirected to public route.

### E.4 OTP (mock provider)
- [ ] Customer login → enter test phone number → mock provider logs `[MOCK-OTP]` with the code in Vercel logs.
- [ ] Enter the logged code → verify lands on profile.
- [ ] Detailed scenarios: [OTP_STAGING_TEST_PLAN.md](./OTP_STAGING_TEST_PLAN.md).

### E.5 Catalog search
- [ ] `/cars?brand=...` filter returns results.
- [ ] Nəsil (generation) filter narrows results.
- [ ] Komplektasiya (trim) filter narrows results.

### E.6 Media upload (admin)
- [ ] Sign in as admin → upload a JPEG to the media manager → succeeds.
- [ ] Upload an SVG → rejected.
- [ ] Upload a file > `MEDIA_UPLOAD_MAX_MB` → rejected.

### E.7 Mobile + theme
- [ ] DevTools at 390px width → no horizontal scroll on `/`, `/cars`, `/cars/[carId]`, `/dealers`.
- [ ] Toggle light/dark theme → no flash of unstyled content, no contrast regressions.

## F. Sign-off

- [ ] All pre-deploy gates passed.
- [ ] All post-deploy smokes passed.
- [ ] Deploy logged in the team channel with the Vercel deploy URL and commit SHA.
- [ ] Operator on duty acknowledged.

If any item fails, **do not announce the deploy to beta users**. Triage via [CLOSED_BETA_BUG_TRIAGE.md](./CLOSED_BETA_BUG_TRIAGE.md). If unrecoverable, follow [STAGING_ROLLBACK_PLAN.md](./STAGING_ROLLBACK_PLAN.md).
