# Sprint 9B — DB Implementation Notes

## What landed

- **Prisma 6 (LTS)** + `@prisma/client` installed. Provider `postgresql`.
  Schema: [prisma/schema.prisma](../../prisma/schema.prisma). 11 models
  covering the catalog/dealer/offer/media/audit vertical slice (see
  [DATABASE_SCHEMA_DRAFT.md](../sprint-9a/DATABASE_SCHEMA_DRAFT.md) for the
  full 40-table target — the rest is deferred to per-domain cutover PRs).
- **Prisma singleton**: [lib/db/prisma.ts](../../lib/db/prisma.ts). HMR-guarded
  via `globalThis.__zlq_prisma` (mirrors the in-memory store pattern at
  [lib/admin/audit.ts:13](../../lib/admin/audit.ts#L13)).
- **Hybrid switch**: [lib/db/availability.ts](../../lib/db/availability.ts).
  `isDatabaseAvailable()` returns `true` only if `DATABASE_URL` is set,
  non-empty, not the placeholder host, AND a one-time `SELECT 1` probe
  succeeds. Cached for process lifetime. Falls back to in-memory store on
  any failure — the app never crashes for missing DB.
- **AuditLog cut over** to DB via [lib/audit/repository.ts](../../lib/audit/repository.ts).
  All other domains stay on the existing stores (see
  [REPOSITORY_CUTOVER_STATUS.md](REPOSITORY_CUTOVER_STATUS.md)).
- **Repository seams** (re-export shims) added for catalog/generations/dealers/
  offers/media so future cutovers are a one-file change per domain.
- **Seed loader**: [prisma/seed.ts](../../prisma/seed.ts). Idempotent upserts
  in FK order from the existing TS seed files.
- **`.env.example`** documents the four env vars used by 9B/9D.

## Required environment variables

| Var | Purpose | Sprint |
|---|---|---|
| `DATABASE_URL` | Postgres connection string. Empty/unset → fallback mode. | 9B |
| `DIRECT_URL` | Optional non-pooled URL for `prisma migrate`. | 9B |
| `MEDIA_STORAGE_PROVIDER` | `local` (only impl). Future: `s3`, `r2`, `supabase`. | 9D |
| `MEDIA_UPLOAD_MAX_MB` | Max upload size; default 8. | 9D |
| `MEDIA_PUBLIC_BASE_URL` | URL prefix where files are served; default `/uploads`. | 9D |

A real `.env` is gitignored. `.env.example` is the committed template.

## Running migrations locally

```
# 1. Start a Postgres instance and put its URL in .env (DATABASE_URL=).
# 2. Generate the client (also runs automatically after install).
npm run prisma:generate
# 3. Create the migration + apply.
npm run prisma:migrate
# 4. Seed data from the TS source files.
npm run db:seed
# 5. Browse data.
npm run prisma:studio
```

## Why Prisma 6, not 7

Prisma 7.0 moved `datasource.url` out of the schema and into a
`prisma.config.ts` file, with non-trivial API changes for the client
adapter pattern. Sprint 9B chose Prisma 6 (LTS) for stability and to match
the 9A architecture docs which assume the classic schema-based config. Upgrade
to Prisma 7 is a future infrastructure ticket — track in
[STORAGE_PROVIDER_DECISION.md](../sprint-9d/STORAGE_PROVIDER_DECISION.md) and
its companion when it lands.

## Out of scope this sprint

Per the user-approved foundation-only slice, these are explicitly deferred:

- `User`, `Lead`, `LeadEvent`, `Decision`, `DecisionHistoryEvent`,
  `SavedCar`, `ViewedCar`
- `Ad*`, `Invoice`, `Payment*`, `PaymentStatusHistory`
- `MarketPulse*`
- `UserBadge`, `PointGrant`, `ActivityEvent`
- `News`, `Encyclopedia`, `QAQuestion`, `QAAnswer`, `ContentRead`
- `OTPVerification`
- `AdminUser`, `Role`, `AdminUserRole` (auth is still mock cookies)
- `DealerSubmission`, `DealerVerificationHistory` (submission workflow stays
  on its own in-memory store at `lib/dealer/submissions/store.ts`)

Each will be added by its per-domain cutover PR per
[SEED_TO_DATABASE_MIGRATION_PLAN.md](../sprint-9a/SEED_TO_DATABASE_MIGRATION_PLAN.md).
