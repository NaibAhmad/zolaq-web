# Local Demo Presentation Flow — Sprint 10G

Founder-facing script for the local demo. Walk the room through 18 steps in
order. Each step has the URL, what to click, what to say, what should be
visible, and what is intentionally beta/placeholder.

Scope: **local demo only**. Staging/Vercel/Supabase remain frozen. No public
launch, no `/ru` or `/en` routes.

Run `npm run dev` first. Demo seed in place: 7 brands, 14 models, 10
generations, 20 trims, 12 catalog prices, 3 dealers, 6+ dealer offers,
3 news, 5 encyclopedia, 5 Q&A, 8 Bazar Nəbzi topics.

---

### 1. Homepage
- **URL:** `/`
- **Click:** Nothing. Let the hero load.
- **Say:** "This is Zolaq — Azerbaijan's car-decision platform. Search,
  compare, decide."
- **Visible:** Hero, quick search, featured brands, news strip, Bazar Nəbzi
  module.
- **Beta/placeholder:** None.

### 2. Quick Search
- **URL:** `/` (hero)
- **Click:** Type a brand or model, hit Enter.
- **Say:** "Single search box, brand- and model-aware."
- **Visible:** Suggestions, redirect into `/cars?...`.
- **Beta/placeholder:** None.

### 3. VIN beta card
- **URL:** `/` (below hero, gated by `NEXT_PUBLIC_FEATURE_VIN_BETA=true`).
- **Click:** "VIN yoxlama" → enter 17-character VIN.
- **Say:** "VIN check is in beta — UI only, no real provider yet."
- **Visible:** Form, mock risk-check response.
- **Beta/placeholder:** **No real VIN provider.** No persistence.

### 4. AZ / RU / EN selector
- **URL:** Header dropdown (gated by `NEXT_PUBLIC_FEATURE_I18N_BETA=true`).
- **Click:** Switch RU, then EN, then back to AZ.
- **Say:** "Multilingual is in beta — client-side switch only."
- **Visible:** Strings flip in-place.
- **Beta/placeholder:** **Client-side localStorage only**. No `/ru` or
  `/en` routes. SEO still AZ.

### 5. Catalog — `/cars`
- **URL:** `/cars`
- **Click:** Open the catalog page.
- **Say:** "Full catalog with side filters. 20 komplektasiya seeded."
- **Visible:** Filter rail, car grid, pagination.
- **Beta/placeholder:** None.

### 6. Nəsil filter
- **URL:** `/cars?generation=xv80`
- **Click:** Nəsil filter → pick a generation.
- **Say:** "Generation filter — Nəsil — narrows trims to one model family."
- **Visible:** Grid filtered, chip pinned at top.
- **Beta/placeholder:** None.

### 7. Komplektasiya filter
- **URL:** `/cars?brand=toyota&model=camry`
- **Click:** Brand → Toyota, Model → Camry. Then expand komplektasiya.
- **Say:** "Trim-level browsing. Each trim is a distinct row with its own
  specs and price."
- **Visible:** Trim list with power_hp, range_km, energy_type.
- **Beta/placeholder:** None.

### 8. Car detail
- **URL:** any `/cars/[trim-slug]`
- **Click:** Open a card.
- **Say:** "Trim detail with reference catalog price, dealer offers, and
  full specs."
- **Visible:** Hero image, PriceCard (catalog + dealer offers), spec
  table, related models.
- **Beta/placeholder:** TrimSpec rows may be partial for some trims —
  fine for demo.

### 9. Compare
- **URL:** `/compare`
- **Click:** Add two or three trims to compare.
- **Say:** "Side-by-side trim comparison."
- **Visible:** Spec rows aligned across selected trims.
- **Beta/placeholder:** None.

### 10. Dealer profile
- **URL:** `/dealers` → click a dealer.
- **Say:** "Dealer profiles with verification, response SLA, and live
  offers."
- **Visible:** Trust summary, verification badge, offer list, contact CTA.
- **Beta/placeholder:** None.

### 11. Dealer offer
- **URL:** A dealer offer card on `/dealers/[slug]`.
- **Click:** Open the offer.
- **Say:** "Offer references a specific trim. Price, stock, validity."
- **Visible:** Trim link, dealer link, price, stock_status,
  valid_until.
- **Beta/placeholder:** No online checkout. Inquiry is lead-only.

### 12. News / Encyclopedia / Q&A
- **URL:** `/news`, `/encyclopedia`, `/qa`
- **Click:** Visit each, open one entry.
- **Say:** "Editorial layer — news, encyclopedia, and Q&A — all
  admin-managed."
- **Visible:** Lists + detail pages, related model links.
- **Beta/placeholder:** None.

### 13. Bazar Nəbzi
- **URL:** Module on `/` (and dedicated section if linked from header).
- **Click:** Open a topic.
- **Say:** "Community pulse — polls and short topics with expiry."
- **Visible:** 8 seeded topics.
- **Beta/placeholder:** None.

### 14. Profile badges
- **URL:** `/profile/badges`
- **Say:** "Engagement badges — viewed, compared, decided, saved."
- **Visible:** Badge grid.
- **Beta/placeholder:** None.

### 15. Activity history
- **URL:** `/profile/history`
- **Say:** "Per-user activity history — viewed cars, decisions, leads."
- **Visible:** Timeline.
- **Beta/placeholder:** None.

### 16. Admin dashboard
- **URL:** `/admin/login` → `/admin/dashboard`
- **Click:** Use the DEV role picker (local only).
- **Say:** "Master Admin console — pending queues, draft content, audit
  feed."
- **Visible:** KPI cards + recent audit events.
- **Beta/placeholder:** None.

### 17. Admin catalog entry
- **URL:** `/admin/catalog/trims` (or `/admin/catalog/generations`).
- **Click:** Open the trim list, drill into a trim, show the advanced
  spec section.
- **Say:** "This is where all komplektasiya data is added. The trim_id is
  the canonical reference downstream."
- **Visible:** Trim form, generation dropdown, optional TrimSpec section.
- **Beta/placeholder:** None.

### 18. Dealer dashboard
- **URL:** `/dealer/login` → `/dealer/dashboard`
- **Click:** Use the DEV role picker, then `/dealer/offers/new`.
- **Say:** "Dealer self-service — they submit offers tied to a specific
  trim. Admin reviews via `/admin/offers`."
- **Visible:** Offer list, new-offer form with trim selector.
- **Beta/placeholder:** No online payment, no WhatsApp Business API.

---

## Demo wrap-up
- Close on `/admin/audit-log` — shows the trail of everything entered
  during the demo.
- Hand the founder
  [FOUNDER_LOCAL_QA_SHEET.md](FOUNDER_LOCAL_QA_SHEET.md) to record
  observations.
