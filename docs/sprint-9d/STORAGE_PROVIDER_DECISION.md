# Storage Provider Decision — Sprint 9D

## What we shipped

Only **LocalStorageProvider** is implemented this sprint. Files land under
`public/uploads/<owner>/<yyyy-mm>/`. Suitable for local dev only.

## What production needs

The local provider relies on a persistent, writable filesystem. Serverless
platforms (Vercel, Netlify) don't provide that — uploads vanish on the next
cold start. A real object store is required.

## Candidates

| Provider | Pros | Cons |
|---|---|---|
| **AWS S3** | Industry standard, mature SDKs, signed URLs, cheap. | Most setup; needs IAM + bucket policy. |
| **Cloudflare R2** | S3-compatible API, no egress fees, simple billing. | Slightly newer SDK ecosystem. |
| **Supabase Storage** | Bundled with Supabase (which fits Sprint 9B Postgres), built-in RLS, signed URLs. | Vendor coupling. |
| **DigitalOcean Spaces** | S3-compatible. | Less feature-rich than R2/S3. |

## Recommendation

If the production DB lives on **Supabase** (likely if the team chooses
Supabase for the Postgres in Sprint 9B), use **Supabase Storage** — one
vendor, RLS integrates with the existing user model, signed URLs work out
of the box. Otherwise, **Cloudflare R2** for cost (no egress) and the
S3-compatible API (easy to swap with `@aws-sdk/client-s3`).

## How to swap

1. Add a new `class S3StorageProvider implements StorageProvider` (or
   `R2StorageProvider`) in [lib/media/storage.ts](../../lib/media/storage.ts).
   Same `save(input)` signature; returns the same `SaveResult` shape.
2. Wire it into `getStorageProvider()` for the `s3` / `r2` / `supabase`
   provider name.
3. Add the relevant SDK to `dependencies`.
4. Add env vars to `.env.example` (`S3_BUCKET`, `S3_REGION`,
   `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, or the R2/Supabase
   equivalents).
5. Set `MEDIA_STORAGE_PROVIDER=s3` (or r2/supabase) in the deployed env.
6. Set `MEDIA_PUBLIC_BASE_URL` to the public bucket URL (or your CDN
   origin).
7. Migrate any existing uploads from `public/uploads/` (in dev only —
   production never had them).

No other file in the codebase changes. The repository, validation, and
upload routes are provider-agnostic.

## Private path (deferred)

Payment proofs (and any future private docs) need a SECOND provider that
signs URLs and never serves files publicly. The `StorageProvider`
interface can be extended with a `saveProtected()` method when that lands.
