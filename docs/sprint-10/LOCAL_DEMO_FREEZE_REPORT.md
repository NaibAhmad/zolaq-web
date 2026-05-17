# Local Demo Freeze Report — Sprint 10H

Pins the current local demo build as the founder-review baseline. No code
changes were made for this freeze — this document is a snapshot only.

Scope: **local demo only**. Staging/Vercel/Supabase remain frozen by founder
decision (see [CLOSED_BETA_GO_NO_GO_DECISION.md](CLOSED_BETA_GO_NO_GO_DECISION.md)).

---

## Freeze identity

| Field | Value |
|---|---|
| Freeze date | 2026-05-18 |
| Sprint | 10H |
| Branch | `master` |
| Top commit SHA | `8a0fafb74c4dac3c24b1d4c3027ed5ac9e66aa88` |
| Top commit subject | `Sprint 10F/G: master admin walkthrough, data-fill SOP, demo flow, founder QA sheet` |
| Remote | `origin` → `https://github.com/NaibAhmad/zolaq-web.git` |
| Upstream | `origin/master` (in sync, no ahead/behind) |
| Suggested tag | `demo-freeze-2026-05-18` |
| Tag message | `Zolaq Sprint 10 local demo freeze` |

---

## Build-gate results (2026-05-18, local)

| Gate | Command | Result |
|---|---|---|
| Working tree | `git status --short` | clean |
| Remote sync | `git status -sb` | `## master...origin/master` |
| Schema | `npx prisma validate` | **valid** (deprecation warning only — `package.json#prisma` block; non-blocking) |
| Lint | `npm run lint` | **pass** (no output) |
| Type-check | `npx tsc --noEmit` | **pass** (no output) |
| Production build | `npm run build` | **pass** — Next.js 16.2.6 Turbopack, compiled in 5.7s, 109/109 static pages generated |

No blockers.

---

## Local demo flags

Read from `.env.local` (gitignored — not committed). The committed
[.env.example](../../.env.example) documents these.

| Flag | Value | Purpose |
|---|---|---|
| `DEV_AUTH_MODE` | `true` | Enables admin/dealer DEV role picker at `/admin/login` and `/dealer/login`. Local-only. |
| `NEXT_PUBLIC_FEATURE_VIN_BETA` | `true` | Renders VIN risk-check card on `/`. UI-only, no provider call. |
| `NEXT_PUBLIC_FEATURE_I18N_BETA` | `true` | Renders AZ/RU/EN header selector. Client-side strings only — no `/ru` or `/en` routes. |
| `SMS_PROVIDER` | `mock` | OTP flows log to console; no SMS sent. |
| `MEDIA_STORAGE_PROVIDER` | `local` | Media uploads land on local disk under the project folder. |
| `MEDIA_UPLOAD_MAX_MB` | `8` | Upload cap for media admin. |

`DATABASE_URL` / `DIRECT_URL` in `.env` are placeholders. App detects this in
[lib/db/availability.ts](../../lib/db/availability.ts:18) and falls back to
the in-memory store. Do not point them at Supabase for this review.

Observation (non-blocking): `.env.local` currently lists each flag twice
(lines 1–6 and 7–12 are identical). Last assignment wins under Next.js env
loading, so runtime behavior is identical to a single block. Cleaning this is
a low-priority backlog item — not a freeze blocker.

---

## What is included in this freeze

Editorial/synthetic data only. No real production claims.

- 7 brands, 14 models (derived from trims), 10 generations, 20 trims (all
  with advanced specs: `power_hp`, `range_km`), 12 catalog prices.
- 3 dealers (Premium Auto Baku, Nordic Motors Azerbaijan, Caspian Auto
  Group) with 6+ dealer offers.
- 3 news, 5 encyclopedia entries, 5 Q&A.
- 8 Bazar Nəbzi (community pulse) topics with future expiry.
- Profile badges + activity history scaffolding (per-user; empty for fresh
  user is expected).
- Admin console: catalog (brands → trims), dealers, offers, content (news /
  encyclopedia / Q&A), media, ads, invoices, payments, audit log, market
  pulse.
- Dealer panel: dashboard, profile, offers (list + new), media,
  payment-proof, submissions, leads, test-drives.
- Public: `/`, `/cars` (with Nəsil + Komplektasiya filters), `/cars/[trim]`,
  `/compare`, `/dealers`, `/dealers/[slug]`, `/news`, `/encyclopedia`,
  `/qa`.
- VIN risk-check beta card (validation + mock response).
- AZ/RU/EN client-side i18n selector.
- Mobile 390 px layout pass; light/dark theme.

---

## What is intentionally out of scope

Not bugs — do not file. From
[FOUNDER_LOCAL_DEMO_REVIEW.md §10](FOUNDER_LOCAL_DEMO_REVIEW.md):

- Real VIN provider integration.
- `/ru` and `/en` public routes (i18n is client-side toggle only).
- Marketplace / private-seller listings.
- Online payment processing.
- WhatsApp Business API (lead delivery uses mock SMS).
- Vercel staging deploy.
- Supabase real database (uses in-memory seed).
- Public launch / press / SEO.

---

## Known limitations

- VIN beta returns a mock risk summary. No outbound calls, no persistence.
- i18n selector falls back to AZ when a key is missing in RU/EN. Coverage is
  partial by design.
- `TrimSpec` rows can be partial on some trims (still acceptable for demo).
- DEV role picker on `/admin/login` and `/dealer/login` is local-only and
  must never reach staging/prod (gated by `DEV_AUTH_MODE`).
- In-memory seed resets on server restart; admin edits during a demo do not
  persist across `npm run dev` restarts.

---

## Route checklist (founder review surface)

Already enumerated in
[FOUNDER_LOCAL_DEMO_REVIEW.md §3](FOUNDER_LOCAL_DEMO_REVIEW.md) and the
21-row table in
[FOUNDER_LOCAL_QA_SHEET.md](FOUNDER_LOCAL_QA_SHEET.md). The founder
walks every row of the QA sheet; the 18-step demo flow is in
[LOCAL_DEMO_PRESENTATION_FLOW.md](LOCAL_DEMO_PRESENTATION_FLOW.md).

Coverage summary against Sprint 10H scope:

| Area | Doc reference |
|---|---|
| Homepage | QA #1, Flow §1 |
| VIN beta card / modal | QA #2, Flow §3 |
| AZ/RU/EN selector | QA #3, Flow §4 |
| `/cars` search | QA #4, Flow §5 |
| Nəsil | QA #5, Flow §6 |
| Komplektasiya | QA #6, Flow §7 |
| Car detail | QA #7, Flow §8 |
| Compare | QA #8, Flow §9 |
| Admin panel | QA #16–18, Flow §16–17 |
| Dealer panel | QA #19, Flow §18 |
| Profile badges | QA #14, Flow §14 |
| Activity history | QA #15, Flow §15 |
| News / Encyclopedia / Q&A | QA #10–12, Flow §12 |
| Mobile 390 px | QA #20 |
| Light / dark theme | QA #21 |

All 15 scope items are covered.

---

## Founder review instructions

1. `npm install && npm run dev` from `c:\Users\NaibPC\Documents\zolaq-web`.
2. Open http://localhost:3000.
3. Walk every row in
   [FOUNDER_LOCAL_QA_SHEET.md](FOUNDER_LOCAL_QA_SHEET.md), recording
   Actual + Status. Pair with
   [LOCAL_DEMO_PRESENTATION_FLOW.md](LOCAL_DEMO_PRESENTATION_FLOW.md) for
   the script.
4. For deeper admin/dealer walkthroughs, follow
   [FOUNDER_LOCAL_DEMO_REVIEW.md](FOUNDER_LOCAL_DEMO_REVIEW.md) §7 and §8.
5. Triage anything found into
   [CLOSED_BETA_BUG_TRIAGE.md](CLOSED_BETA_BUG_TRIAGE.md) using the
   Blocker / High / Medium / Low severity scheme.
6. **Fix only Blocker / High issues during the freeze window.** Medium and
   Low go to backlog and do not block the demo tag.

---

## Tag commands (prepared, not yet executed)

```
git tag -a demo-freeze-2026-05-18 -m "Zolaq Sprint 10 local demo freeze"
git push origin demo-freeze-2026-05-18
```

Both require explicit founder approval before execution.

---

## Acceptance status

| Criterion | Status |
|---|---|
| Working tree clean | ✓ |
| Build gates pass (Prisma + lint + tsc + build) | ✓ |
| Founder review docs exist and cover full scope | ✓ |
| Local demo freeze report exists | ✓ (this file) |
| No staging dependency | ✓ |
| No migration dependency | ✓ (in-memory seed fallback) |
| No secrets exposed | ✓ (no `.env`/`.env.local` tracked; grep clean) |
| Tag prepared but not pushed | ✓ (pending approval) |

**Sprint 10H: READY TO TAG** — pending explicit founder approval of the tag
command above.
