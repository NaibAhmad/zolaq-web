# SPRINT_BACKLOG.md

## Sprint 1 — Foundation / routes / layout / auth

### Tasks
- Next.js route structure
- Public layout
- Profile protected layout
- Brand asset integration
- Theme tokens
- Auth shell
- Mock OTP provider
- API client structure
- Error/loading/empty state shell

### Acceptance
- All final routes open.
- Protected routes redirect to OTP/login.
- Mock OTP works.
- Header/mobile nav matches terminology.
- `/encyclopedia` is used, not `/wiki`.

## Sprint 2 — Catalog + car detail

### Tasks
- Catalog listing
- Filter query params
- Car detail page
- PriceCard statuses
- Source / last_updated / verification display
- Car image fallback
- CatalogPrice integration

### Acceptance
- `/cars` works with mock trims.
- Each car opens `/cars/[carId]`.
- `carId` maps to `trim_id`.
- Price status renders correctly.
- Catalog CTA = `Ətraflı bax` / `Maşını aç`.

## Sprint 3 — Compare + lead / OTP

### Tasks
- Compare page
- 2–3 trim comparison
- Lead form
- Guest lead
- OTP verification
- Lead creation
- Lead status route

### Acceptance
- Guest can submit lead.
- OTP unlocks lead status.
- Lead state starts as `submitted`.
- No raw phone in analytics.

## Sprint 4 — Dealer + offers

### Tasks
- Dealer listing
- Dealer profile
- Dealer offers
- Official dealer badge
- DealerOfferData integration
- Offer valid_until handling
- signed_pdf_url optional behavior

### Acceptance
- `/dealers` and `/dealers/[dealerId]` work.
- Offer cards show source and validity.
- PDF button hidden when `signed_pdf_url` is null.
- Dealer without working_hours cannot have active verified offer.

## Sprint 5 — Decision Center + history

### Tasks
- `/profile`
- `/profile/history`
- `/profile/saved`
- `/profile/viewed`
- `/profile/decisions`
- `/profile/decisions/[decisionId]`
- Readiness score display
- Next best action
- Decision events timeline

### Acceptance
- Backend returns `readiness_score`.
- Frontend does not calculate score.
- Decision workspace links leads, offers and trims.
- Next best action is clickable.

## Sprint 6 — Content + tracking + QA

### Tasks
- News
- Encyclopedia
- Q&A
- Related model links
- Tracking events
- QA acceptance run
- Basic SEO metadata
- Sitemap draft

### Acceptance
- Content pages open.
- Related model click works.
- Tracking payloads are PII-safe.
- QA checklist passes.
