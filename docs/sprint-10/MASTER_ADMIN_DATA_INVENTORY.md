# Master Admin Data Inventory (Sprint 10D)

Scan-friendly catalog of every Master Admin section so the founder can plan
which data to fill via the existing admin panel today vs. which rows should
wait until staging Phase C completes.

**Reading guide:**
- `READY` — full CRUD UI exists, safe to use in local dev.
- `PARTIAL` — list exists but no edit/create yet, or vice versa.
- `PLACEHOLDER` — route exists but renders an empty / coming-soon state.
- `MISSING` — no route yet.
- `Needs real staging DB?` — `yes` means the in-memory dev fallback drops
  changes on restart and a real DB is required to persist; `no` means the
  fallback is good enough for demo data entry today.

All Master Admin routes are gated by `app/admin/(authed)/layout.tsx` (real
password). Local dev unlocks the mock RoleSwitcher via `DEV_AUTH_MODE=true`.

---

## Catalog

| Section          | Route                                                          | Status | Needs real staging DB? |
| ---------------- | -------------------------------------------------------------- | ------ | ---------------------- |
| Brands           | `/admin/catalog/brands`                                        | READY  | yes (for persistence)  |
| Models           | `/admin/catalog/models`                                        | READY  | yes                    |
| Generations      | `/admin/catalog/generations`                                   | READY  | yes                    |
| Trims (komplektasiya) | `/admin/catalog/trims`                                    | READY  | yes                    |
| Advanced trim specs   | `/admin/catalog/trims/[trimId]` (embedded collapsible)    | READY  | yes                    |
| Catalog prices   | `/admin/catalog/prices`                                        | READY  | yes                    |

API surface: `/api/internal/{brands,models,generations,trims,prices}`. All
endpoints are admin-only and write to the catalog repository which persists to
Postgres when `DATABASE_URL` is set; falls back to `globalThis` in-memory
otherwise.

---

## Dealers

| Section            | Route                                  | Status   | Needs real staging DB? |
| ------------------ | -------------------------------------- | -------- | ---------------------- |
| Dealers list/edit  | `/admin/dealers`, `/admin/dealers/[dealerId]` | READY | yes                    |
| Dealer profile     | `/admin/dealers/[dealerId]` (same page) | READY    | yes                    |
| Verification status | embedded in dealer detail             | READY    | yes                    |
| Offer review queue | `/admin/offers`                        | READY    | yes                    |
| Offer detail       | `/admin/offers/[offerId]`              | READY    | yes                    |
| Submission queue   | `/admin/offers/sub/[submissionId]`     | PARTIAL  | yes                    |

API surface: `/api/internal/dealers`, `/api/internal/offers/{offerId}/{approve,reject,request-revision}`.

---

## Content

| Section             | Route                          | Status | Needs real staging DB? |
| ------------------- | ------------------------------ | ------ | ---------------------- |
| News                | `/admin/content/news`          | READY  | yes                    |
| Encyclopedia        | `/admin/content/encyclopedia`  | READY  | yes                    |
| Q&A                 | `/admin/content/qa`            | READY  | yes                    |
| Bazar Nəbzi (market pulse) | `/admin/market-pulse`   | READY  | yes                    |

All four sections support draft/published/rejected lifecycle.

---

## Commercial

| Section               | Route             | Status | Needs real staging DB? |
| --------------------- | ----------------- | ------ | ---------------------- |
| Ads / sponsored       | `/admin/ads`      | READY  | yes                    |
| Invoices              | `/admin/invoices` | READY  | yes                    |
| Payment proof review  | `/admin/payments` | READY  | yes                    |
| Audit log (read-only) | `/admin/audit-log`| READY  | yes (writes only persist with real DB) |

---

## Media

| Section               | Route          | Status | Needs real staging DB? |
| --------------------- | -------------- | ------ | ---------------------- |
| Admin media upload    | `/admin/media` | READY  | partial — files land on the Vercel ephemeral fs (L1 limitation); metadata persists to DB |
| Dealer media moderation | `/admin/media` (filter `owner_type=dealer`) | READY | partial |

Note: media storage provider is `local` for closed beta (Sprint 10B
limitation L1). Real Supabase Storage / Vercel Blob is a P0 for public
launch, not for Sprint 10D.

---

## System

| Section                  | Route                | Status   | Needs real staging DB? |
| ------------------------ | -------------------- | -------- | ---------------------- |
| Admin users CRUD         | `/admin/users`       | PARTIAL  | yes — Sprint 8E territory; today read-only list |
| Roles & permission matrix | `/admin/roles`      | READY    | no (derived from `lib/auth/permissions.ts`) |
| Audit log                | `/admin/audit-log`   | READY    | yes (writes only persist with real DB) |

---

## What Sprint 10D explicitly did NOT change

- No new admin code. Every section above shipped in earlier sprints; Sprint
  10D's deliverable here is this inventory doc, nothing else.
- No `/admin/users` CRUD form work. That's Sprint 8E.
- No empty-state polish — exploration found no broken empty states.

## What the founder can do today (local dev)

1. `DEV_AUTH_MODE=true` in `.env.local`.
2. Sign in at `/admin/login` via the mock RoleSwitcher.
3. Visit any READY section above and create data. Without a real
   `DATABASE_URL`, changes survive only until the dev server restarts (the
   in-memory `globalThis` fallback). With a real local Postgres pointed at
   `DATABASE_URL`, data persists across restarts.

## What to defer until staging Phase C

Every row marked `Needs real staging DB? = yes`. Data filled locally cannot
be replayed onto staging — it would need to be re-entered after Phase C
completes. Reason: there is no export/import script between the dev fallback
and the real DB, and exploration confirmed Sprint 10D's no-new-code rule
forbids adding one this sprint.
