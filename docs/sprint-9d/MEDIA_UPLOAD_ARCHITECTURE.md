# Media Upload Architecture — Sprint 9D

## Components

```
HTML <form enctype="multipart/form-data">
              │
              ▼
/api/admin/media/upload  ──┐                  /api/dealer/media/upload
                            │                                │
                            ▼                                ▼
                   lib/media/validation.ts       (forces owner_type=dealer,
                   (MIME + magic-bytes + size)    owner_id=session.dealerId)
                            │
                            ▼
                   lib/media/storage.ts ─── LocalStorageProvider
                            │                     │
                            │                     └─► /public/uploads/<owner>/<yyyy-mm>/<hash>.<ext>
                            ▼
                   lib/media/repository.ts (hybrid)
                            │
                       ┌────┴────┐
                       ▼         ▼
                  prisma.        globalThis
                  mediaAsset     in-memory
                  (DB mode)      (fallback)
```

## Files

| File | Purpose |
|---|---|
| [lib/media/validation.ts](../../lib/media/validation.ts) | MIME allowlist (jpeg/png/webp), magic-byte check, size cap from `MEDIA_UPLOAD_MAX_MB`. |
| [lib/media/storage.ts](../../lib/media/storage.ts) | `StorageProvider` interface + `LocalStorageProvider`. The one swap point for S3 / R2 / Supabase. |
| [lib/media/repository.ts](../../lib/media/repository.ts) | Hybrid MediaAsset repository (DB if available, globalThis Map otherwise). |
| [app/api/admin/media/upload/route.ts](../../app/api/admin/media/upload/route.ts) | Admin upload — `status="active"` immediately. |
| [app/api/dealer/media/upload/route.ts](../../app/api/dealer/media/upload/route.ts) | Dealer upload — forced owner scope, `status="uploaded"` (pending approval). |
| [app/api/internal/media/[mediaId]/route.ts](../../app/api/internal/media/[mediaId]/route.ts) | Admin status change (approve / reject / archive). |
| [app/admin/(authed)/media/page.tsx](../../app/admin/(authed)/media/page.tsx) | Admin media list + upload + approval buttons. |
| [app/dealer/(authed)/media/page.tsx](../../app/dealer/(authed)/media/page.tsx) | Dealer file upload + URL-paste fallback + own-asset list. |

## Filename strategy

Client filename is **never trusted**. The storage key is built from:

```
sha256(uuid + originalName + Date.now()).slice(0, 16) + "." + ext
```

The extension is derived from the **detected** MIME (via magic bytes), not
the client header. A collision retries once with an added UUID suffix.

## File layout on disk

```
public/uploads/
├── dealer/
│   └── 2026-05/
│       ├── 5fa3e1b9c4d8a7e2.jpg
│       └── ...
├── trim/
│   └── 2026-05/
│       └── ...
└── general/
    └── 2026-05/
        └── ...
```

Served by Next.js at `/uploads/...` (the `MEDIA_PUBLIC_BASE_URL` default).

## Status lifecycle

```
uploaded ─approve─► active ─archive─► archived
   │                  ▲
   └─reject──► rejected
```

Admin uploads skip `uploaded` and go straight to `active`. Dealer uploads
start at `uploaded` and require admin approval.

## DB persistence

In DB mode the `media_assets` table stores the metadata; the file is on
disk regardless. In fallback mode the metadata is in a globalThis Map and
is lost on restart — but the file on disk remains. This means restart in
fallback mode produces orphaned files; clean up `public/uploads/` manually
in dev if needed.
