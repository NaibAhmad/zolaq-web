# Sprint 8G — Regression Checklist

Walk every route below in a fresh browser session. Mark **PASS** / **FAIL** / **SKIP** with a note.

## Public (guest)

| Route | Expected | Status | Note |
|-------|----------|--------|------|
| `/` | Renders hero, search, trust, decision helper, catalog teaser, content teaser, **Bazar nə deyir?** (new), dealer teaser. No layout regression. | | |
| `/cars` | Catalog list renders. Filters work. | | |
| `/cars/[carId]` | Car detail renders with price card and dealer offers. | | |
| `/compare` | Compare landing renders. | | |
| `/dealers` | Dealer list renders. | | |
| `/dealers/[dealerId]` | Dealer profile renders, trust summary visible. | | |
| `/news` | News list renders. | | |
| `/news/[slug]` | News article renders. | | |
| `/encyclopedia` | Encyclopedia list renders. | | |
| `/encyclopedia/[slug]` | Article renders. Logged-in user silently earns `encyclopedia_reader` after one view. | | |
| `/qa` | Default tab `Suallar` renders existing Q&A list — **no regression vs. Sprint 7**. | | |
| `/qa?tab=bazar-nebzi` | Active Bazar Nəbzi topics across cadences. | | |
| `/qa?tab=gunluk` | Daily topics only. | | |
| `/qa?tab=heftelik` | Weekly topics only. | | |
| `/qa?tab=ayliq` | Monthly topics only. | | |
| `/qa?tab=tarixce` | Closed / resolved / archived topics. | | |
| `/qa/[id]` | Existing Q&A item view unchanged. | | |

## Customer (OTP session)

| Route | Expected | Status | Note |
|-------|----------|--------|------|
| `/auth/otp` | OTP request + verify works (mock). | | |
| `/profile` | Decision Center renders. New **Nişanlarım** quick link visible. | | |
| `/profile/history` | Timeline renders. New **Bazar Nəbzi və nişan fəaliyyəti** section appears once user has activity. | | |
| `/profile/saved` | Saved list renders. | | |
| `/profile/viewed` | Viewed list renders. | | |
| `/profile/leads` | Leads list renders. | | |
| `/profile/leads/[leadId]` | Lead detail renders. | | |
| `/profile/decisions` | Decisions list renders. | | |
| `/profile/decisions/[decisionId]` | Decision detail renders. | | |
| `/profile/badges` | **New.** Lists 5 P0 badges with earned/locked sections + point total. | | |

## Admin

| Route | Expected | Status | Note |
|-------|----------|--------|------|
| `/admin/login` | Mock admin picker renders. | | |
| `/admin/dashboard` | Dashboard widgets render. | | |
| `/admin/catalog/brands` | Brand CRUD list renders. | | |
| `/admin/dealers` | Dealer list renders. | | |
| `/admin/offers` | Offer queue renders. | | |
| `/admin/content/news` | News admin renders. | | |
| `/admin/content/encyclopedia` | Encyclopedia admin renders. | | |
| `/admin/content/qa` | Q&A admin renders. | | |
| `/admin/ads` | **New.** Lists ad requests across statuses. | | |
| `/admin/ads/new` | **New.** Internal/dealer-pinned placement form. | | |
| `/admin/ads/[id]` | **New.** Detail with edit + approve/reject/revise/activate. | | |
| `/admin/invoices` | **New.** Invoice list. | | |
| `/admin/invoices/new` | **New.** Invoice creation form. | | |
| `/admin/invoices/[id]` | **New.** Invoice detail + cancel + mark-overdue + linked proofs. | | |
| `/admin/payments` | **New.** Payment proof queue. | | |
| `/admin/payments/[id]` | **New.** Approve/reject proof; flips invoice + ad request. | | |
| `/admin/market-pulse` | **New.** Topic list with cadence + status. | | |
| `/admin/market-pulse/new` | **New.** Topic create form (3-4 options, sponsored flag). | | |
| `/admin/market-pulse/[id]` | **New.** Detail + lifecycle (publish, close, resolve, archive, reject). | | |
| `/admin/audit-log` | Lists 8A-D and 8E/8F events. | | |

## Dealer

| Route | Expected | Status | Note |
|-------|----------|--------|------|
| `/dealer/login` | Mock dealer picker renders. | | |
| `/dealer/dashboard` | Dashboard renders. | | |
| `/dealer/profile` | Profile-edit submission form renders. | | |
| `/dealer/offers` | Own offers list. | | |
| `/dealer/offers/new` | Offer create. | | |
| `/dealer/media` | Media submission form. | | |
| `/dealer/leads` | Own leads. | | |
| `/dealer/test-drives` | Test drive list. | | |
| `/dealer/submissions` | Submission inbox. | | |
| `/dealer/ad-requests` | **New.** Own ad requests. | | |
| `/dealer/ad-requests/new` | **New.** Request form. | | |
| `/dealer/ad-requests/[id]` | **New.** Read-only detail with admin notes. | | |
| `/dealer/invoices` | **New.** Own invoices. | | |
| `/dealer/invoices/[id]` | **New.** Detail + upload payment-proof form (open invoices only). | | |
| `/dealer/payment-proof` | **New.** Own proof uploads with status. | | |

## End-to-end loops

1. **Ad request → invoice → payment → activation.** Dealer submits at `/dealer/ad-requests/new`. Admin approves at `/admin/ads/[id]`. Sales creates invoice at `/admin/invoices/new`. Dealer uploads proof at `/dealer/invoices/[id]`. Admin approves at `/admin/payments/[id]`. Admin activates at `/admin/ads/[id]`. Confirm audit log row at each step.
2. **Bazar Nəbzi vote.** Guest taps option → OTP redirect. After verification, vote succeeds. Second vote on same topic returns 409. Closed topic blocks voting.
3. **Label enforcement.** Attempt to clear label on `active` campaign via the update form — server returns `label_required`.
4. **Three-session isolation.** Customer OTP cookie does not access `/admin/*` or `/dealer/*`. Admin session does not access customer profile endpoints. Dealer sees only own ad requests, invoices, and proofs.
