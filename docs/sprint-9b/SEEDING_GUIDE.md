# Seeding Guide

## What the seed does

[prisma/seed.ts](../../prisma/seed.ts) upserts every row from the existing
TS seed files (`lib/cars/seed.ts`, `lib/cars/generations.ts`,
`lib/dealers/seed.ts`) into Postgres in FK order:

1. Brand → 2. Model (derived from Trim rows) → 3. Generation →
4. Trim → 5. Dealer → 6. CatalogPrice + DealerOffer

**MediaAsset/MediaUsage are intentionally not seeded** — there is no source
data; dev uploads via the new media endpoints are the only path.

## When to run it

After every `prisma migrate` that creates/recreates tables. The script is
**idempotent** — re-running it does not duplicate rows, it just refreshes
existing rows from the TS source.

## Step-by-step

```
# Step 1. Put a real Postgres URL in .env:
#   DATABASE_URL="postgresql://USER:PASS@HOST:5432/zolaq?schema=public"

# Step 2. Generate the Prisma client.
npm run prisma:generate

# Step 3. Apply the schema (creates tables).
npm run prisma:migrate
# When asked for a migration name, use: init_sprint_9b

# Step 4. Load the seed data.
npm run db:seed

# Step 5. Verify in Prisma Studio.
npm run prisma:studio
```

## Safety notes

- The seed never deletes. Re-running is safe.
- It overwrites mutable fields on existing rows with current seed values
  (so if you edit `lib/cars/seed.ts` and re-seed, admin edits made through
  the API can be reverted). In dev this is desirable; in production it
  would be destructive. **Do not run `db:seed` against a production DB.**
- DealerOffer rows are seeded with `offer_status="published"` so the public
  catalog continues to show them after the offer-status filter applies
  (matches the existing in-memory bootstrap at
  [lib/admin/catalog-store.ts:84](../../lib/admin/catalog-store.ts#L84)).

## What if the seed is missing data?

The seed reflects current `lib/cars/seed.ts` content. If new Trims/Brands
are added via the admin panel and you want them persisted in DB mode, the
catalog domain needs to be cut over to DB (see
[REPOSITORY_CUTOVER_STATUS.md](REPOSITORY_CUTOVER_STATUS.md) — catalog is
the last domain in the planned migration order).
