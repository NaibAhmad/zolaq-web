# Staging DB Verification Checklist (Sprint 10B)

After running the migration / seed / bootstrap sequence in
[STAGING_DB_EXECUTION_LOG.md](STAGING_DB_EXECUTION_LOG.md), step through this
checklist on the live staging host. Every row should be PASS before the closed
beta is opened.

Never paste raw query output, secret values, or email addresses into this doc.
Use placeholders like `<staging.zolaq.az>` and check the box.

## A. Schema present

Run via Prisma Studio or psql; verify ≥ 0 rows (just that table exists & is
queryable). Expected models per [prisma/schema.prisma](../../prisma/schema.prisma):

- [ ] `brands`
- [ ] `models`
- [ ] `generations`
- [ ] `trims`
- [ ] `trim_specs`
- [ ] `catalog_prices`
- [ ] `dealers`
- [ ] `dealer_offers`
- [ ] `media_assets`
- [ ] `media_usages`
- [ ] `audit_logs`
- [ ] `admin_users`
- [ ] `admin_user_roles`
- [ ] `admin_sessions`
- [ ] `dealer_sessions`
- [ ] `dealer_users`
- [ ] `otp_attempts`

## B. Seed populated

Expected non-zero counts after `npm run db:seed` (canonical seed from
[lib/cars/seed](../../lib/cars/seed)):

- [ ] `brands` > 0
- [ ] `models` > 0
- [ ] `generations` > 0
- [ ] `trims` > 0
- [ ] `trim_specs` > 0
- [ ] `catalog_prices` > 0
- [ ] `dealers` > 0
- [ ] `dealer_offers` > 0

(Beta seed augmentation from [data/beta-seed/](../../data/beta-seed/) is
separately tracked — see [BETA_DATA_POPULATION_PLAN.md](BETA_DATA_POPULATION_PLAN.md).)

## C. Admin bootstrap

- [ ] `admin_users` contains exactly one super_admin (from `INITIAL_ADMIN_EMAIL`)
- [ ] `admin_user_roles` contains a matching `(admin_id, 'super_admin')` row
- [ ] Admin can log in at `https://staging.zolaq.az/admin/login` with the
      seeded password
- [ ] Admin password is rotated via UI immediately after first login
- [ ] `INITIAL_ADMIN_PASSWORD` is removed from Vercel Staging env after rotation

## D. Round-trip smoke (live staging host)

- [ ] `GET https://staging.zolaq.az/api/health` returns 200 with
      `checks.database.available: true`
- [ ] `GET https://staging.zolaq.az/api/health` body contains NO secret values
      (grep for `BEGIN PRIVATE`, `pwd=`, raw JWT segments — must be absent)
- [ ] `GET https://staging.zolaq.az/cars` returns 200 with seeded brands
- [ ] `GET https://staging.zolaq.az/cars?brand=brand_bmw&model=X5` filters down
- [ ] `POST https://staging.zolaq.az/api/auth/otp/request` returns
      `{ otp_session_id, expires_in_seconds }`. With `SMS_PROVIDER=mock`,
      capture the code from Vercel function logs (`[MOCK-OTP]` prefix).
- [ ] `POST https://staging.zolaq.az/api/auth/otp/verify` accepts the captured
      code and issues a session cookie
- [ ] Dealer login works at `https://staging.zolaq.az/dealer/login` with a
      seeded dealer (one of the dealer users created via admin UI)

## E. Cross-tenant isolation (R6 dealer scope)

- [ ] Logged in as dealer A, fetching dealer B's offers via API returns 403/404
      (NOT 200)
- [ ] Logged in as dealer A, the dealer dashboard never lists dealer B's offers

## F. Media smoke (local fs limitation accepted)

- [ ] Admin can upload an image via the admin media UI; the file appears under
      `/uploads/` on the running Vercel function (will not survive cold-start
      redeploys — see GO_WITH_LIMITATIONS in
      [CLOSED_BETA_GO_NO_GO_DECISION.md](CLOSED_BETA_GO_NO_GO_DECISION.md))
- [ ] `media_assets` row is created with `storage_provider=local`

## G. Noindex protection (staging only)

- [ ] `curl -sI https://staging.zolaq.az/` includes
      `X-Robots-Tag: noindex, nofollow, noarchive`
- [ ] `curl -s https://staging.zolaq.az/robots.txt` contains `Disallow: /`

## Sign-off

When every box above is checked, mark the bottom of
[STAGING_DB_EXECUTION_LOG.md](STAGING_DB_EXECUTION_LOG.md) as
**STAGING_DB_VERIFIED** with operator name and UTC timestamp.
