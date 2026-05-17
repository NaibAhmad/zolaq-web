# Media QA Checklist — Sprint 9D

Run against both fallback and DB modes.

## Happy path

1. **Admin upload.** Log in as `super_admin`. Sidebar **Dilerlər → Media**.
2. Pick a JPG/PNG/WebP file under 8 MB. Submit. Asset card appears with
   "Aktiv" badge.
3. File lives on disk at `public/uploads/general/<yyyy-mm>/<hash>.<ext>`.
4. **Dealer upload.** Log in as a dealer. Sidebar **Media**.
5. Upload a JPG/PNG/WebP. Asset card appears with "Yoxlamada" badge under
   "Yüklənmiş şəkilləriniz".
6. **Approve.** Switch back to admin → `/admin/media` → find the dealer's
   asset → "Təsdiq". Status → "Aktiv". Audit row `media.approve`.

## Validation

| Input | Expected |
|---|---|
| `.svg` file | **415** "Yalnız JPEG / PNG / WebP şəkilləri qəbul edilir." |
| `.exe` renamed to `.jpg` | **415** (magic-byte mismatch) |
| 20 MB file (with default 8 MB cap) | **413** "Fayl çox böyükdür..." |
| 0-byte file | **400** "Boş fayl." |
| Form without `file` field | **400** "Fayl tapılmadı." |
| Non-multipart body | **400** "Multipart body tələb olunur." |

## Auth

| Attempt | Expected |
|---|---|
| Unauth `POST /api/admin/media/upload` | redirect to `/admin/login` or 401 JSON |
| Unauth `POST /api/dealer/media/upload` | redirect to `/dealer/login` or 401 JSON |
| Dealer A sends `owner_id=dealerB` | Ignored — handler forces `owner_id` to A's session. |
| Dealer tries `PATCH /api/internal/media/:id` | 401 / 403 |

## Public display

- **No change** in `/cars/[carId]` etc. — existing components consume
  `image_url` strings; the new upload just produces those strings.
- Missing `image_url` still shows the brand placeholder
  (`components/catalog/CarImage.tsx`). No broken-image risk.

## Audit

After the above:

```
/admin/audit-log
```

Should show:
- `media.upload` (admin) entity_type=media
- `media.upload` (dealer) entity_type=media
- `media.approve` entity_type=media
- Plus `media.reject` / `media.archive` if you exercised those buttons.

## Restart behaviour

- **Fallback mode.** Restart `npm run dev` → `media_assets` Map is empty
  again. Files on disk remain (orphaned).
- **DB mode.** Restart → asset metadata persists. Files on disk remain.

## Production sanity (do not run against prod)

- `public/uploads/` is gitignored. ✓
- `.env.example` documents `MEDIA_*` vars. ✓
- App-level abstraction in `lib/media/storage.ts` means production swap
  is a single file change. ✓
