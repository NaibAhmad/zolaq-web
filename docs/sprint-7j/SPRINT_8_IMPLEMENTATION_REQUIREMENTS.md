# SPRINT_8_IMPLEMENTATION_REQUIREMENTS

## Goal

Concrete punch list of what Sprint 8 must build so the platform can commercially launch. This is the closing doc of the Sprint 7J addendum — it cross-references every other doc in the addendum and converts them into engineering tasks with priorities.

P0 = launch blocker. P0-stretch = needed soon after launch. P1 = scheduled for Sprint 9.

**Round 2 update.** Sprint 8 P0 now includes **two private route groups**: a minimal Master Admin / Internal Admin Panel at `/admin/*` (sections A0 + A–L below, per `ADMIN_PANEL_ROUTE_MAP.md`) AND a minimal Dealer Self-Service Portal at `/dealer/*` (new section M, per `DEALER_PANEL_ROUTE_MAP.md` and `DEALER_SELF_SERVICE_P0_WORKFLOW.md`). Dealer Admin moves from P1 → P0. Advanced analytics, bulk import, API import, subscription billing, automated reports, full CRM, and the full dealer dashboard stay in P1 / P2.

## P0 (launch blockers)

### A0. Admin panel shell — `/admin/*` private route group
- New private route group at `app/admin/**` (Sprint 8). Every route requires admin role per `ADMIN_PANEL_ROUTE_MAP.md`.
- Routes to ship: `/admin/dashboard`, `/admin/catalog`, `/admin/catalog/brands`, `/admin/catalog/models`, `/admin/catalog/trims`, `/admin/catalog/prices`, `/admin/dealers`, `/admin/dealers/[dealerId]`, `/admin/offers`, `/admin/leads`, `/admin/content/news`, `/admin/content/encyclopedia`, `/admin/content/qa`, `/admin/market-pulse`, `/admin/ads`, `/admin/invoices`, `/admin/payments`, `/admin/moderation`, `/admin/users`, `/admin/roles`, `/admin/audit-log`.
- Shared admin layout: top nav, role-scoped sidebar, breadcrumb.
- `/admin/dashboard` widget mix: pending approval counts (offers, dealers, ads, payments, moderation); fresh leads; payment status totals; Bazar Nəbzi topic states.
- The CRUD / approval-queue capability per route is detailed in sections B–L below.

### A. Admin authentication + role guard
- New auth surface separate from Customer OTP ([lib/auth/session.ts](../../lib/auth/session.ts)) **and** separate from the Dealer auth surface in section M0.
- Email + password (or SSO).
- Session bound to one of the roles in `ROLE_PERMISSION_MATRIX.md` (Super Admin / Ops Admin / Content Manager / Sales Manager / Moderator). Never Customer or Dealer Admin.
- Role-guard middleware on every route under `app/admin/**` AND every existing route under `app/api/internal/**` (e.g. [app/api/internal/leads/[leadId]/state/route.ts](../../app/api/internal/leads/[leadId]/state/route.ts)).
- Failed-login logging.

### B. Catalog CRUD (brand / model / trim / specs / images)
- Admin Form for brand / model / trim with slug uniqueness.
- Spec editor per trim with source URL + `verified` boolean.
- Image upload (primary + gallery) with alt text + auto-resize.
- Storage layer: migrate seed-based reads in [lib/cars/types.ts](../../lib/cars/types.ts) consumers from seed to DB.

### C. Dealer CRUD
- CRUD against the [Dealer](../../lib/dealers/types.ts) shape: legal name, display name, brands, city, address, working hours, services ([DealerService](../../lib/dealers/types.ts)), response SLA, source name.
- Verification-status transitions per [DealerVerificationStatus](../../lib/dealers/types.ts): `pending → official_dealer | verified_partner | premium_partner | rejected | expired`.
- Migrate [lib/dealers/seed.ts](../../lib/dealers/seed.ts) readers to DB.

### D. Offer / price CRUD
- Per trim: list + create + edit `PriceRecord`s.
- Fields: `trim_id`, `dealer_id`, price, currency, status, `valid_until`, source, `verified`.
- "Expiring this week" sorted view.
- Force-expire action.
- Conflict detection (two dealers with materially different prices for same trim in overlap window → flag).

### E. Content CRUD (news / encyclopedia / Q&A)
- CRUD per [ContentType](../../lib/content/types.ts) (`news | encyclopedia | qa`).
- News: title, slug, summary, body, image, source name, related_trim_ids, category.
- Encyclopedia: title, slug, summary, body, topic_tags, [EncyclopediaCategory](../../lib/content/types.ts), stats, source.
- Q&A: question, answer, related_trim_ids.
- Draft / publish toggle.
- Migrate [lib/content/seed.ts](../../lib/content/seed.ts) readers to DB.

### F. Bazar Nəbzi topic management
- New table set per `PREDICTION_HISTORY_MODEL.md`: `bazar_topics`, `bazar_options`, `bazar_votes`, `bazar_topic_snapshots`.
- Admin Form: create / edit topic, set options, set start_date / end_date, type (daily / weekly / monthly), sponsored flag + sponsor metadata.
- Approval workflow per `SPONSORED_MARKET_QUESTION_RULES.md`: two-key (organic) / three-key + paid (sponsored).
- Lifecycle actions: activate, force-close, resolve, archive.
- Public vote API with the 6 eligibility checks listed in `COMMUNITY_PREDICTION_RULES.md`.
- Aggregation: live percentages computed from `bazar_votes` (excluding invalidated); snapshot frozen at close.
- Homepage "Bazar nə deyir?" preview block component added after `HomeContentTeaser` in [app/(public)/page.tsx](../../app/(public)/page.tsx).
- `/qa` Bazar Nəbzi tab with daily / weekly / monthly / tarixçə sub-views, reusing [components/content/ContentList.tsx](../../components/content/ContentList.tsx) / [components/content/ContentDetail.tsx](../../components/content/ContentDetail.tsx) with a new adapter for `BazarTopicSnapshot`.

### G. Ad placement management
- New table per `AD_PLACEMENT_MAP.md` schema sketch (`AdPlacement`, `AdSurface`, `AdLabel`, `AdPlacementStatus`).
- Admin Form: create / edit placements, link to Order (`PAYMENT_INVOICE_FLOW.md`), set start/end, label.
- Two-key approval workflow (Content Manager + Sales Manager; Homepage Sponsored Block adds Super Admin third key).
- Activation guard: cannot flip to `active` unless linked Order has `payment_status = paid`.
- Inventory caps per surface (see `AD_PLACEMENT_MAP.md` "Inventory limits").

### H. Manual invoice / payment-status management
- New `Order` table per `PAYMENT_INVOICE_FLOW.md`.
- Status state machine: `pending | invoice_sent | paid | overdue | cancelled`.
- Admin Form: create order, link to placements, record `invoice_number`, `due_at`, `payment_proof_note`, flip status.
- Super Admin co-sign required for `paid` above configurable threshold.
- Audit-log row per transition.

### I. Lead-status management
- The lead state machine ([LEAD_STATES](../../lib/leads/types.ts)) already exists with timeline events. Sprint 8 adds:
  - Role guard on existing endpoints under `app/api/internal/leads/**`.
  - Admin list view (Ops Admin sees all; Sales Manager sees own accounts).
  - PII handling: keep phone as `phone_hash` for non-Ops roles.

### J. Global audit log
- New append-only table.
- Captures: `actor_user_id`, `actor_role`, `action`, `entity_kind`, `entity_id`, `before` (JSON), `after` (JSON), `timestamp`, `ip`.
- Every admin write writes one row — enforced via middleware, not per-handler.
- Read-only admin UI with filter by entity / actor / date.
- Per-lead [LeadTimelineEvent](../../lib/leads/types.ts) stays as a separate lead-scoped feed.

### K. Moderation queue
- Unified inbox view across Q&A submissions, reported content, flagged dealer self-promotion, flagged unlabeled sponsored content, flagged voting patterns.
- Per `COMMUNITY_MODERATION_SCOPE.md` schema sketch: new `ContentReport` table.
- Resolution actions: approve, reject, escalate; writes audit-log row.

### L. Tracking-event additions
- Update [lib/tracking/events.ts](../../lib/tracking/events.ts) to add Bazar Nəbzi events listed in `MARKET_PULSE_MODULE.md` ("Tracking events"):
  - `bazar_topic_viewed`
  - `bazar_vote_started`
  - `bazar_vote_submitted`
  - `bazar_topic_history_opened`
- Add dealer-side tracking events (new in Round 2):
  - `dealer_login_success`
  - `dealer_submission_drafted`
  - `dealer_submission_submitted`
  - `dealer_payment_proof_uploaded`
- Also update `docs/reference/.../TRACKING_EVENTS.json` to stay in sync per the existing convention noted in [lib/tracking/events.ts](../../lib/tracking/events.ts).
- Continue [BANNED_PII_KEYS](../../lib/tracking/events.ts) enforcement on every dealer- and admin-originated event.

### M0. Dealer panel shell — `/dealer/*` private route group
- New private route group at `app/dealer/**` (Sprint 8). Every route requires `role = "dealer_admin"`; queries scoped to session `dealer_id`. See `DEALER_PANEL_ROUTE_MAP.md` for the full inventory.
- Routes to ship: `/dealer/dashboard`, `/dealer/profile`, `/dealer/offers`, `/dealer/offers/new`, `/dealer/offers/[offerId]`, `/dealer/media`, `/dealer/campaigns`, `/dealer/ad-requests`, `/dealer/invoices`, `/dealer/payment-proof`, `/dealer/leads`, `/dealer/test-drives`, `/dealer/submissions`, `/dealer/settings`.
- Shared dealer layout: top nav, sidebar, dealer-name + verification badge in header.
- `/dealer/dashboard` widget mix: pending submissions, active offers, fresh leads, payment status totals (dealer-side view per `PAYMENT_INVOICE_FLOW.md`).

### M1. Dealer authentication
- Third distinct auth surface: separate from Customer OTP ([lib/auth/session.ts](../../lib/auth/session.ts)) and separate from admin auth (section A).
- Email + password.
- First-login forced password reset (issued by Sales Manager at onboarding per `DEALER_SELF_SERVICE_P0_WORKFLOW.md` W1).
- Session bound to `role = "dealer_admin"` and `dealer_id`.
- Failed-login logging.

### M2. `DealerSubmission` table + submission lifecycle
- New table per `DEALER_PORTAL_SCOPE.md` schema sketch:
  - Kinds: `profile_edit | offer_new | offer_update | image_upload | campaign_request | ad_placement_request | payment_proof`.
  - Statuses: `draft | submitted | under_review | needs_revision | approved | published | rejected | expired | cancelled`.
- Server-enforced allowed transitions per `DEALER_SELF_SERVICE_P0_WORKFLOW.md`.
- Every status transition writes one audit-log row (section J).
- `reviewer_note` field is visible to the dealer for `needs_revision` and `rejected` only.
- `published_entity_id` links the approved submission to the live entity (Dealer / PriceRecord / image / AdPlacement / etc.).

### M3. Dealer profile-edit submission (`/dealer/profile`)
- Form for address, working hours ([WorkingHoursRange](../../lib/dealers/types.ts)), services ([DealerService](../../lib/dealers/types.ts)), brands represented, response SLA.
- Submit creates `DealerSubmission.kind = "profile_edit"`.
- Verification status remains admin-only (section C).

### M4. Dealer offer / price submission (`/dealer/offers/*`)
- Form: trim_id, price, currency, `valid_until` (mandatory), stock status, source.
- Submit creates `DealerSubmission.kind = "offer_new"` or `"offer_update"`.
- Form-layer rejection if `valid_until` missing or source empty.
- Approved + published submission produces a `PriceRecord` with `dealer_id` per section D.

### M5. Dealer image upload (`/dealer/media`)
- Form: file + category (car image / dealer image) + alt text (mandatory, Azerbaijani).
- Auto-checks: dimension minimums, file size, MIME type.
- Submit creates `DealerSubmission.kind = "image_upload"`.
- Approved submission attaches the image to the appropriate trim or dealer record per section B / C.

### M6. Dealer campaign / ad request (`/dealer/campaigns`, `/dealer/ad-requests`)
- Form: package selection from `ADS_REVENUE_MODEL.md` catalog, creative, label preference, target window.
- Submit creates `DealerSubmission.kind = "campaign_request"` (non-paid promotional copy) or `"ad_placement_request"` (paid sponsored placement).
- Routes through `/admin/ads` approval flow.
- Triggers Sales Manager invoice issuance per `PAYMENT_INVOICE_FLOW.md` and section G.

### M7. Dealer payment proof (`/dealer/payment-proof`)
- Form: free-text payment reference; P0 has no file attach (P1 adds optional PDF / image upload with virus scan).
- Submit creates `DealerSubmission.kind = "payment_proof"` and surfaces `payment_uploaded` non-canonical indicator (dealer-side view).
- Does **not** change `Order.payment_status` — admin owns that transition (section H).

### M8. Dealer lead list (`/dealer/leads`) — read-only in P0
- List leads where dealer is the matched dealer for the represented brand + trim + city.
- Display: lead_id, trim, state ([LEAD_STATES](../../lib/leads/types.ts)), customer first-name + `preferred_contact` (if shared), time elapsed, last action.
- PII rule preserved: phone is `phone_hash`-anchored; full phone shared off-platform.
- Lead-state transitions remain admin-driven (section I); P1 adds dealer-driven `dealer_opened` / `no_response`.

### M9. Dealer test-drive request view (`/dealer/test-drives`) — read-only in P0
- Subset of leads in `test_drive_requested` / `test_drive_confirmed` states.
- Display: trim, preferred date/time, customer first-name, lead state.
- Confirmation flow still runs through `/admin/leads` in P0; P1 enables direct accept / reschedule / decline.

### M10. Dealer submission tracking (`/dealer/submissions`)
- Unified tracker for all own submissions across kinds.
- Filter by kind / status.
- Click-through to originating form for `draft` / `needs_revision` items.

### M11. Dealer abuse prevention
- Rate limit per `dealer_id` and kind: configurable (defaults: 20 offers/hour, 5 image uploads/hour, 3 ad requests/hour).
- Repeated-rejection escalation: X rejections in Y days flags the dealer for Sales Manager review at `/admin/moderation`.
- Unverified-dealer constraint: dealers with `pending` or `expired` verification can save `draft`s but cannot `submit` for publication.
- Soft-cancel only — submission records never deleted.

## P0-stretch (needed soon after launch — do in Sprint 8 if capacity allows)

- Email delivery for invoices and overdue reminders (no auto-renewal; just templated reminders triggered manually).
- Sponsored-content listing badge automation (ensure every sponsored content_id renders the `Sponsorlu` chip in listing components without per-component code).
- Auto-flag overdue orders via a daily cron (`order_marked_overdue` audit event).
- Auto-close Bazar Nəbzi topics when `end_date` passes (`bazar_topic_closed` audit event).

## P1 (Sprint 9)

Round 2 moved Dealer Admin login + `DealerSubmission` lifecycle + read-only invoice view to P0 (sections M0–M11). The remaining P1 items:

- Optional file attachment for payment proof at `/dealer/payment-proof` (PDF / image with virus scan).
- Dealer-driven test-drive accept / reschedule / decline from `/dealer/test-drives`.
- Dealer can set `dealer_opened` / `no_response` lead states from `/dealer/leads`.
- Withdraw `submitted` submission before review begins at `/dealer/submissions`.
- Email + WhatsApp notifications on submission status changes and on `paid` confirmation.
- Inline conflict warning at `/dealer/offers/new` when a new offer disagrees with an existing verified record.
- Auto-flag overdue orders cron (if not done in P0-stretch).
- Suspicious-voting heuristics surfaced to Moderator queue (per `COMMUNITY_PREDICTION_RULES.md`).
- Public Q&A commenting (per `COMMUNITY_MODERATION_SCOPE.md`).
- Profile "Mənim təxminlərim" section showing the user's Bazar Nəbzi history (per `PREDICTION_HISTORY_MODEL.md`).
- Advertiser self-service surface (symmetric to dealer portal but for non-dealer advertisers).

## Acceptance gates for Sprint 8 (commercial-launch readiness)

Each of these must be true on launch day:

- [ ] A new dealer can be onboarded end-to-end by Ops Admin from `/admin/dealers` without dev intervention.
- [ ] A dealer can log in to `/dealer/dashboard`, see own data, and create a new offer submission at `/dealer/offers/new`.
- [ ] A dealer's offer submission appears in the `/admin/offers` approval queue within seconds.
- [ ] An Ops Admin can approve the offer at `/admin/offers` and have it live on `/cars/[trim_id]` within 10 minutes.
- [ ] A dealer can request an ad package at `/dealer/ad-requests`, upload payment proof at `/dealer/payment-proof`, and see campaign go-live within the same workflow once Sales Manager confirms `paid`.
- [ ] A dealer cannot publish anything to any public surface without admin approval — including offers, images, profile edits, campaigns, and Bazar Nəbzi sponsored topics.
- [ ] A dealer cannot see another dealer's data at any `/dealer/*` route.
- [ ] A news / encyclopedia / Q&A entry can be published from `/admin/content/**` without a code change.
- [ ] A Bazar Nəbzi topic can be created, run, closed, and resolved from `/admin/market-pulse` without a code change.
- [ ] A sponsored placement can be sold, approved (two/three-key), payment-gated, labeled, and gone live without a code change.
- [ ] Every admin **and** dealer write produces one audit-log row at `/admin/audit-log`.
- [ ] Sponsored placements always render with their `Sponsorlu` / `Reklam` / `Premium` label, in every surface where they appear.
- [ ] No sponsored placement can manipulate the Zolaq Recommendation.
- [ ] No private lead data appears in any public surface. Dealer sees own leads only with `phone_hash`-anchored references.
- [ ] The Bazar Nəbzi homepage block respects the cadence and labeling rules.
- [ ] One vote per OTP-verified user per topic is enforced server-side.
- [ ] Vote-invalidation by Moderator triggers aggregate recomputation and audit-log row.
- [ ] Three distinct auth surfaces exist (Customer OTP, admin email+password, dealer email+password) and never cross-contaminate sessions.

## Acceptance gate for Sprint 7J (this addendum, Round 1 + Round 2)

- [x] 17 documents under `docs/sprint-7j/` (Round 1: 14 + Round 2: 3 new).
- [x] No code routes changed.
- [x] No product flow changed.
- [x] No public UI redesign — `/admin/*` and `/dealer/*` are private route groups documented for Sprint 8.
- [x] Clear P0 / P1 / P2 separation.
- [x] Data sources documented per data type with three upload methods (dealer self-service / admin manual / fallback).
- [x] Dealer is data owner; Zolaq is verification/publishing authority.
- [x] Dealer P0 minimal self-service portal scoped with explicit route list and submission lifecycle.
- [x] Master Admin P0 panel scoped with explicit route list and per-route role/data model/approval relation.
- [x] Submission status enum (`draft | submitted | under_review | needs_revision | approved | published | rejected | expired | cancelled`) defined with allowed transitions.
- [x] Approval workflow documented end-to-end: dealer submit → ops review → master admin approve → public.
- [x] Public visibility always requires admin approval.
- [x] Ads / revenue model documented end-to-end with dealer-side request flow.
- [x] Manual invoice / payment flow documented end-to-end with canonical state machine + dealer-side view.
- [x] Bazar Nəbzi documented as non-gambling.
- [x] Prediction history lives under `/qa` (no new public route).
- [x] Daily / weekly / monthly topic structure defined.
- [x] Sprint 8 implementation requirements list is concrete and prioritized (admin panel P0 + dealer panel P0).
- [ ] `npm run lint` / `type` / `build` — not required (no code touched).

## Cross-references (the full addendum — 17 docs after Round 2)

1. `ROLE_PERMISSION_MATRIX.md` — roles + capability matrix (Dealer Admin now P0)
2. `DATA_UPLOAD_WORKFLOW.md` — three upload methods (dealer self-service / admin manual / fallback)
3. `INTERNAL_ADMIN_MVP_SCOPE.md` — admin CRUD requirements + `/admin/*` module map
4. `DEALER_PORTAL_SCOPE.md` — dealer feature tiers (P0 minimal portal / P1 enhancements / P2 dashboard)
5. `PAYMENT_INVOICE_FLOW.md` — manual payment state machine + dealer-side view
6. `ADS_REVENUE_MODEL.md` — 12 packages + dealer-side request flow
7. `AD_PLACEMENT_MAP.md` — placement rules per page (Round 1, unchanged)
8. `COMMUNITY_MODERATION_SCOPE.md` — public/private boundary + moderation (Round 1, unchanged)
9. `MARKET_PULSE_MODULE.md` — Bazar Nəbzi concept (Round 1, unchanged)
10. `COMMUNITY_PREDICTION_RULES.md` — voting rules + status enum (Round 1, unchanged)
11. `PREDICTION_HISTORY_MODEL.md` — schema for topics, votes, snapshots (Round 1, unchanged)
12. `SPONSORED_MARKET_QUESTION_RULES.md` — sponsored-topic integrity (Round 1, unchanged)
13. `MVP_MONETIZATION_SUMMARY.md` — executive summary (Round 1, unchanged)
14. `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md` — this document
15. **`DEALER_SELF_SERVICE_P0_WORKFLOW.md`** — step-by-step workflows + submission status enum (new in Round 2)
16. **`ADMIN_PANEL_ROUTE_MAP.md`** — `/admin/*` route inventory (new in Round 2)
17. **`DEALER_PANEL_ROUTE_MAP.md`** — `/dealer/*` route inventory (new in Round 2)
