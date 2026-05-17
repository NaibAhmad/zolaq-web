# Founder Local Demo Review — Sprint 10F

Status: local-only. Vercel/Supabase staging remains frozen by founder decision (see [CLOSED_BETA_GO_NO_GO_DECISION.md](CLOSED_BETA_GO_NO_GO_DECISION.md)). Run everything from a developer laptop; the app reads in-memory TypeScript seed data, no real database needed.

This guide is the founder-facing review checklist for Sprint 10F. Open each section, follow the steps, and note anything that looks off.

---

## 1. Start local dev

```powershell
# from c:\Users\NaibPC\Documents\zolaq-web
npm install
npm run dev
```

Open http://localhost:3000 in a desktop browser. Resize to ~390 px width for the mobile pass.

If `npm run dev` fails, the next.config.ts and tsconfig.json are stable — most likely cause is a missing `.env.local` (see next section).

---

## 2. Required `.env.local`

The repo already ships a working `.env.local`. Verify it contains at minimum:

```
DEV_AUTH_MODE=true
NEXT_PUBLIC_FEATURE_VIN_BETA=true
NEXT_PUBLIC_FEATURE_I18N_BETA=true
SMS_PROVIDER=mock
MEDIA_STORAGE_PROVIDER=local
MEDIA_UPLOAD_MAX_MB=8
```

`DATABASE_URL` and `DIRECT_URL` in `.env` are intentionally placeholders. The app detects this in [lib/db/availability.ts](../../lib/db/availability.ts) and falls back to the in-memory store powered by `lib/*/seed.ts`. Do not point them at real Supabase during this review.

No real SMS or email goes out; all OTP and submission flows are mocked.

---

## 3. URLs to open

### Public
- http://localhost:3000/ — homepage
- http://localhost:3000/cars
- http://localhost:3000/cars?brand=toyota&model=camry
- http://localhost:3000/cars?generation=gen_toyota_camry_xv80
- http://localhost:3000/compare
- http://localhost:3000/dealers
- http://localhost:3000/news
- http://localhost:3000/encyclopedia
- http://localhost:3000/qa

### Admin (mock-login via DEV_AUTH_MODE)
- http://localhost:3000/admin/login
- http://localhost:3000/admin/dashboard
- http://localhost:3000/admin/catalog
- http://localhost:3000/admin/catalog/brands
- http://localhost:3000/admin/catalog/models
- http://localhost:3000/admin/catalog/generations
- http://localhost:3000/admin/catalog/trims
- http://localhost:3000/admin/catalog/prices
- http://localhost:3000/admin/dealers
- http://localhost:3000/admin/offers
- http://localhost:3000/admin/content/news
- http://localhost:3000/admin/content/encyclopedia
- http://localhost:3000/admin/content/qa
- http://localhost:3000/admin/media
- http://localhost:3000/admin/ads
- http://localhost:3000/admin/invoices
- http://localhost:3000/admin/payments
- http://localhost:3000/admin/audit-log
- http://localhost:3000/admin/market-pulse

### Dealer (mock-login via DEV_AUTH_MODE)
- http://localhost:3000/dealer/login
- http://localhost:3000/dealer/dashboard
- http://localhost:3000/dealer/profile
- http://localhost:3000/dealer/offers
- http://localhost:3000/dealer/offers/new
- http://localhost:3000/dealer/media
- http://localhost:3000/dealer/payment-proof
- http://localhost:3000/dealer/submissions
- http://localhost:3000/dealer/leads
- http://localhost:3000/dealer/test-drives

### Profile (OTP-gated; complete the mocked login first)
- http://localhost:3000/profile
- http://localhost:3000/profile/badges
- http://localhost:3000/profile/history

---

## 4. Homepage checklist

On http://localhost:3000/ confirm each block renders:

- Hero — Zolaq pitch, primary CTA, no broken images.
- Quick search card — brand, model, energy_type fields render.
- Trust strip — small icons row, no overflow at 390 px.
- VIN beta card — risk-check pitch, "Beta" badge visible.
- "Bazar nə deyir" / decision helper — readiness summary for the demo user.
- Selected cars — at least 3 cards, each with a price card.
- Content section — news + encyclopedia teasers (the 3 news / 5 encyclopedia / 5 Q&A seeded for 10F should be visible across `/news`, `/encyclopedia`, `/qa`).
- Dealer section — 3 dealer cards (Premium Auto Baku, Nordic Motors Azerbaijan, Caspian Auto Group).
- Footer — language selector visible on the right.

What "off" looks like: blank section, dev-mode error overlay, horizontal scroll at 390 px, untranslated `__KEY__` literal text.

---

## 5. VIN beta test

1. Click the "VIN risk yoxlaması" card on the homepage.
2. The modal opens in place. No new route.
3. Type `12345` → "Yoxla" → error: "VIN 17 simvol olmalıdır".
4. Type `1HGCM82633A123456I` (contains `I`) → error: "VIN yalnız müəyyən hərflərdən ibarətdir".
5. Type `1HGCM82633A123456` → "Yoxla" → success state with placeholder risk summary (no provider call, no persistence).
6. Close the modal — state resets. Re-opening shows an empty input.

No "Free Carfax" wording anywhere. No outbound network calls.

---

## 6. Language selector test (i18n beta)

1. In the header, locate the AZ/RU/EN segmented selector.
2. Click `RU` — header nav labels and the quick search card headings update to Russian.
3. Reload the page — selection persists (localStorage).
4. Click `EN` — labels update to English.
5. Click back to `AZ` — labels return to Azerbaijani.
6. Try a label key that may not exist in EN — it should fall back to AZ text, never show a raw key.

Note: there is no `/ru` or `/en` route. Switching is fully client-side. This is intentional.

---

## 7. Master Admin walkthrough

1. Open http://localhost:3000/admin/login. DEV_AUTH_MODE shows a role picker — pick "Super Admin".
2. Dashboard — verify KPI tiles render (open offers, audit count, pending content).
3. Catalog:
   - `/admin/catalog/brands` → 7 brands listed. Open one, edit `country`, save, return to list — change reflected.
   - `/admin/catalog/models` → ≥ 14 models listed (seed expansion in 10F added new ones).
   - `/admin/catalog/generations` → 10 generations listed.
   - `/admin/catalog/trims` → 20 komplektasiya listed. Create a new one to confirm the form works, then delete it.
   - `/admin/catalog/prices` → ≥ 10 price records, dealer offers and catalog prices interleaved.
4. Dealers — 3 dealers, open each, verify brand/service edits save.
5. Offers — submission queue + full offer list both render.
6. Content:
   - `/admin/content/news` → 3 news. Publish / unpublish toggles work.
   - `/admin/content/encyclopedia` → 5 entries.
   - `/admin/content/qa` → 5 entries.
7. Media — upload a small JPEG via the form, see it appear in the list with status `uploaded`.
8. Ads / Invoices / Payments — create + state transitions work.
9. Audit log — most recent action appears at the top (open + close any item).
10. Market pulse — 8 Bazar Nəbzi topics listed, status badges visible.

---

## 8. Dealer panel walkthrough

1. http://localhost:3000/dealer/login → DEV_AUTH_MODE picker shows the 3 mock dealers. Pick "Premium Auto Baku".
2. Dashboard — KPI tiles (open submissions, active offers, leads, SLA hours).
3. Profile — edit display name, save, return to list, see change.
4. Offers — table lists offers for the chosen dealer. Confirm the "Komplektasiya" column shows `trim_id` (not generation_id).
5. `/dealer/offers/new` — select a komplektasiya, enter amount + currency + valid_until, submit. New offer appears in `/admin/offers` submission queue.
6. Media — upload a small image, see status badge.
7. Payment-proof — upload mock proof, status `pending_review`.
8. Submissions — verify queue shows the offer above.
9. Leads — read-only, filters to dealer's trim_ids.
10. Test-drives — read-only, leads with state containing `test_drive`.

---

## 9. Catalog / search test

1. `/cars` — grid of ≥ 20 trims.
2. Apply quick search: brand = Toyota → grid narrows to Toyota only (Camry, RAV4, Corolla).
3. Apply Nəsil filter: `gen_toyota_camry_xv80` → only Camry entries linked to that generation.
4. Apply Komplektasiya filter: pick a single trim → grid narrows to that one card.
5. Try year_from / year_to range (e.g. 2024–2025).
6. Open one card → `/cars/<trim_id>` detail renders with price card and energy badges.
7. Add two trims to compare via the CarCard "Müqayisə et" button → `/compare` shows side-by-side.

Confirm at 390 px width: no horizontal scroll, cards stack vertically.

---

## 10. Intentionally not ready

These are out of scope for Sprint 10F. Don't treat as bugs:

- Real VIN provider integration. The beta card is illustrative only.
- `/ru` and `/en` public routes. Language switch is client-side.
- Marketplace / private-seller listings.
- Online payment processing.
- WhatsApp Business API. Lead delivery uses mock SMS only.
- Vercel staging deploy.
- Supabase real database. The app uses in-memory seed.
- Public launch announcements.

---

## 11. How to report bugs

Capture: URL, screenshot, exact action sequence, expected vs actual. Mark severity:

- **Blocker** — local dev does not start, or a documented URL above renders a runtime error.
- **High** — feature listed in this guide doesn't behave as described.
- **Medium** — copy unclear or empty state confusing, but workflow completes.
- **Low** — visual nit, polish opportunity.

Reach the engineering owner in the shared docs channel (or per the contact listed in [SPRINT_10_READINESS_REPORT.md](SPRINT_10_READINESS_REPORT.md)).

---

## Sprint 10F demo data summary

The following counts were added or already met during Sprint 10F. All data is editorial/synthetic — no real production claims.

| Entity | Target | Current |
|---|---|---|
| Brands | 5 | 7 |
| Models | 10 | 14 (derived from trims) |
| Generations | 10 | 10 |
| Trims (komplektasiya) | 20 | 20 |
| Trims with advanced specs (power_hp / range_km) | 10 | 20 |
| Catalog prices (PriceRecord entries) | 10 | 12 |
| Dealers | 3 | 3 |
| Dealer offers | 6 | 6+ |
| News | 3 | 3 |
| Encyclopedia | 5 | 5 |
| Q&A | 5 | 5 |
| Bazar Nəbzi topics | 2 | 8 |
| Badges / activity | sane states | working |
