# Media Security Rules — Sprint 9D

## What we accept

| Type | MIME | Magic bytes |
|---|---|---|
| JPEG | `image/jpeg` | `FF D8 FF` |
| PNG | `image/png` | `89 50 4E 47 0D 0A 1A 0A` |
| WebP | `image/webp` | `RIFF` + `WEBP` at offset 8 |

Anything else → **415 Unsupported Media Type**.

## What we reject

- **SVG.** Can carry script payloads. No exceptions this sprint.
- **PDF.** Deferred. The payment-proof flow is untouched and continues to use
  its existing `app/api/dealer/payment-proof/route.ts` route. When PDF is
  added in a future sprint, validation will need separate magic-byte logic
  and a private storage path (payment proofs MUST NOT be public).
- **Executables, archives, anything else** — anything that doesn't match a
  known image magic byte sequence is rejected.

## Size cap

Configurable via `MEDIA_UPLOAD_MAX_MB` (default 8 MB). Enforced in
`lib/media/validation.ts:maxUploadBytes()`. Rejected with **413**.

## Filename safety

Client filename is **never** used as the on-disk filename or storage key.
The repository generates a sha256-based 16-char hex name plus the
detected-MIME extension. Original filename is stored in
`MediaAsset.original_file_name` for the UI only.

## Auth scoping

| Endpoint | Auth | Owner scope |
|---|---|---|
| `POST /api/admin/media/upload` | `requireAdmin(super_admin, internal_ops_admin, content_manager)` | Any `owner_type` / `owner_id` (admin can target any owner). |
| `POST /api/dealer/media/upload` | `requireDealer` | **Forced** `owner_type="dealer"`, `owner_id=session.dealerId`. Dealer cannot upload as another dealer. |
| `PATCH /api/internal/media/:id` | `requireAdmin(...)` | Admin-only status change. Dealer cannot self-approve. |

Dealer media listings on `/dealer/media` filter to
`listMediaAssets({ owner_type: "dealer", owner_id: session.dealerId })` so
a dealer never sees another dealer's uploads.

## Public visibility

`status="active"` is the only state public pages should render. The admin
approval workflow (`uploaded → active`) gates dealer uploads. The
repository does not enforce this on `listMediaAssets()` — callers must
filter — but the convention is that public components only request
`{ status: "active" }`.

## Payment-proof carve-out

Payment proofs (`app/api/dealer/payment-proof/route.ts`) are NOT moved to
the new upload pipeline this sprint. Reason: payment proofs must be
**private** (never publicly served), and the local `/public/uploads/`
provider serves files publicly via Next's static handler. A dedicated
private-storage path is required — tracked as a follow-up.

## Production deployment notes

`/public/uploads/` is gitignored. **Do not** deploy to a serverless platform
(Vercel, Netlify) with the local provider — those file systems are
ephemeral. Swap to S3 / R2 / Supabase Storage first. See
[STORAGE_PROVIDER_DECISION.md](STORAGE_PROVIDER_DECISION.md).
