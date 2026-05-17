# DEALER_PORTAL_SCOPE

## Goal

Split dealer-facing functionality into **what the dealer can do themselves through a minimal self-service portal (P0)**, **what becomes richer dealer features (P1)**, and **what becomes a full self-service dashboard (P2)**. This is the feature-tier doc. The step-by-step procedural flows live in `DEALER_SELF_SERVICE_P0_WORKFLOW.md`. The route inventory lives in `DEALER_PANEL_ROUTE_MAP.md`.

**Round 2 update.** Sprint 8 ships a **minimal Dealer Self-Service Portal** at `/dealer/*`. Round 1 said "no dealer login in MVP" — that decision is reversed. The new model: dealer is the data owner; Zolaq is the verification and publishing authority; every public surface still requires admin approval.

## Three-tier model

### P0 — Sprint 8 minimal dealer self-service portal

Dealer Admin role has a real login at `/dealer/login` (separate auth surface from Customer OTP — see [lib/auth/session.ts](../../lib/auth/session.ts) for the existing Customer surface; admin/dealer auth is built in Sprint 8). Once logged in, Dealer Admin works in the private `/dealer/*` route group.

**P0 routes** (full inventory in `DEALER_PANEL_ROUTE_MAP.md`):

- `/dealer` — landing redirect.
- `/dealer/dashboard` — own dealer summary: pending submissions, active offers, fresh leads, payment status.
- `/dealer/profile` — view own dealer profile; submit profile-edit request (address, working hours, services, brands).
- `/dealer/offers` — list own offers with status badges.
- `/dealer/offers/new` — submit new car/trim offer (trim_id, price, currency, `valid_until`, stock status, source).
- `/dealer/offers/[offerId]` — edit `draft` or `needs_revision` offer.
- `/dealer/media` — upload car images and dealer / showroom images (alt text required).
- `/dealer/campaigns` — create campaign / promotion request.
- `/dealer/ad-requests` — request a sponsored placement package (see `ADS_REVENUE_MODEL.md`).
- `/dealer/invoices` — view own invoices and package orders.
- `/dealer/payment-proof` — upload bank-transfer / payment proof (free-text reference + optional file in P1).
- `/dealer/leads` — view own leads only (PII rule preserved — see `COMMUNITY_MODERATION_SCOPE.md`).
- `/dealer/test-drives` — view own test-drive requests.
- `/dealer/submissions` — track every submission's status across the lifecycle.
- `/dealer/settings` — own account settings and contact persons.

**Submission status enum (P0)** — every dealer-side write goes through this lifecycle:

```
draft → submitted → under_review → approved → published
                                  → needs_revision → (back to draft / submitted)
                                  → rejected
                                  → expired
                                  → cancelled
```

Full enum and allowed transitions in `DEALER_SELF_SERVICE_P0_WORKFLOW.md`.

**P0 constraints (the principle never changes between P0 and P2):**

- This is **not** a full dealer dashboard. It is a self-service submission portal.
- Dealer cannot directly publish anything — every public-impact change requires admin approval.
- Dealer can only see and edit own dealer's data.
- Every submission creates an audit-log row (see `INTERNAL_ADMIN_MVP_SCOPE.md` section O).
- Dealer cannot change `payment_status` to `paid` — only Sales Manager / Super Admin can (`PAYMENT_INVOICE_FLOW.md`).
- Dealer cannot remove `Sponsorlu` / `Reklam` / `Premium` labels.

### P1 — Dealer Portal beta (Sprint 9)

Richer dealer features on top of the P0 portal:

- Optional file attachment for payment proof (PDF / image upload, virus-scanned).
- Read-only invoice history + email reminders for overdue.
- Inline conflict notification when a new offer disagrees with an existing record for the same trim — dealer sees the conflict and can revise.
- Test-drive response action (`accept` / `reschedule` / `decline`) from `/dealer/test-drives`.
- Q&A submission as a sponsored expert answer (still flows through Q&A Sponsored Answer package — `ADS_REVENUE_MODEL.md` #9 — with `Sponsorlu` label).
- Dealer can withdraw a `submitted` submission before review begins.

### P2 — Full dealer dashboard (post-MVP, beyond Sprint 9)

- Dealer self-service offer publishing without per-row Ops approval (policy guardrails: source verified, `valid_until` set, no conflict).
- Analytics dashboard: profile views, lead volume by trim, offer→test-drive conversion, response SLA performance.
- Subscription billing (auto-renew Verified Dealer / Premium Profile / Featured Dealer packages).
- Automated invoice generation and online payment processing.
- API import: dealer pushes inventory via API (CSV / JSON).
- Bulk vehicle upload for stock dealers.
- Campaign performance dashboard: impressions, clicks, leads attributed.

## What dealers can never do (any tier — P0, P1, P2)

- Edit other dealers' data.
- See other dealers' leads.
- Edit catalog (brand / model / trim / spec) — that's platform data, owned by `/admin/catalog/**`.
- Override the Zolaq Recommendation algorithm or its outputs.
- Hide source / verification badges.
- Comment on private lead data.
- Publish editorial content as a neutral source — dealer-authored content is sponsored and labeled `Sponsorlu` / `Reklam` (see `SPONSORED_MARKET_QUESTION_RULES.md`).
- Vote in Bazar Nəbzi on behalf of customers, edit topic options, vote counts, or final outcomes.
- Approve own ad placements or own offers.
- Change `payment_status` to `paid`.
- Remove `Sponsorlu` / `Reklam` / `Premium` labels.

## P0 channels for dealer ↔ Zolaq communication

Even with the portal live, the existing manual channels stay open as **fallbacks** (see `DATA_UPLOAD_WORKFLOW.md` method C):

1. **WhatsApp Business line** — Sales Manager owns. Useful for dealers not yet onboarded to the portal or for high-touch escalations.
2. **Email** — `dealer@zolaq.az` mailbox for documents, monthly reports.
3. **Phone** — for escalations.
4. **Internal Ops admin Form** at `/admin/*` — Ops transcribes fallback submissions on the dealer's behalf.

In MVP the portal is preferred but optional. Dealers are encouraged to migrate to `/dealer/*` once onboarded.

## P0 dealer-side workflows (summary — full versions in `DEALER_SELF_SERVICE_P0_WORKFLOW.md`)

### Onboarding
1. Dealer applies via Sales Manager (any channel).
2. Sales Manager creates a `pending` ([DealerVerificationStatus](../../lib/dealers/types.ts)) record at `/admin/dealers`.
3. Ops collects documents.
4. Super Admin / Ops sets verification status (`official_dealer | verified_partner | premium_partner` or `rejected`).
5. Sales Manager issues first-login credentials to the dealer (initial password reset at first login).
6. Dealer logs into `/dealer/dashboard`.

### Offer / price upload (dealer-driven)
1. Dealer creates a draft at `/dealer/offers/new`: trim_id, price, currency, `valid_until`, source, stock status.
2. Dealer submits → `status = submitted`.
3. Submission appears in the `/admin/offers` approval queue.
4. Ops Admin reviews → `approved` / `needs_revision` (with note) / `rejected`.
5. If `approved`, Super Admin / Ops publishes → `status = published` and offer is live on `/cars/[trim_id]`.

### Lead handling (dealer-visible, dealer-influenced)
1. Customer submits lead → state `submitted`.
2. Lead appears on `/dealer/leads` for the represented dealer.
3. Ops Admin coordinates dealer outreach; lead state transitions via `/admin/leads` through the existing [LEAD_STATES](../../lib/leads/types.ts) machine.
4. Dealer can view the latest state at `/dealer/leads/[leadId]`. In P1 the dealer can act on test-drive requests directly.

### Ad / sponsorship sale (dealer-initiated)
1. Dealer requests a package at `/dealer/ad-requests`.
2. Sales Manager reviews at `/admin/ads`.
3. Sales Manager issues invoice (`pending` → `invoice_sent`).
4. Dealer pays via bank transfer.
5. Dealer uploads payment proof at `/dealer/payment-proof` (non-canonical `payment_uploaded` indicator).
6. Sales Manager confirms and flips `payment_status` to `paid`.
7. Content Manager + Sales Manager approve creative + label at `/admin/ads`.
8. Ad placement goes live.

## Dealer-facing P0 schema sketch (Sprint 8 implementation)

```ts
// lib/dealer-submissions/types.ts (Sprint 8 — promoted from Round 1 P1 sketch)

export const DEALER_SUBMISSION_KINDS = [
  "profile_edit",
  "offer_new",
  "offer_update",
  "image_upload",
  "campaign_request",
  "ad_placement_request",
  "payment_proof",
] as const;

export type DealerSubmissionKind = (typeof DEALER_SUBMISSION_KINDS)[number];

export const DEALER_SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "needs_revision",
  "approved",
  "published",
  "rejected",
  "expired",
  "cancelled",
] as const;

export type DealerSubmissionStatus = (typeof DEALER_SUBMISSION_STATUSES)[number];

export type DealerSubmission = {
  submission_id: string;
  dealer_id: string;
  submitted_by: string;             // dealer_admin user_id
  kind: DealerSubmissionKind;
  payload: Record<string, unknown>; // shape depends on kind; validated server-side
  status: DealerSubmissionStatus;
  reviewer_id?: string;             // ops_admin / sales_manager / content_manager / super_admin user_id
  reviewer_note?: string;           // shown to dealer on needs_revision / rejected
  published_entity_id?: string;     // when approved → published, points at the live entity (dealer_id / offer_id / placement_id / etc.)
  created_at: number;
  updated_at: number;
  decided_at?: number;
  published_at?: number;
};
```

## Not in Sprint 7

- The `/dealer/*` route group (Sprint 8 work).
- Dealer authentication surface (Sprint 8 work).
- Any of the P1 enhancements.
- Any of the P2 dashboard / API / billing automation.

## Cross-references

- Role capabilities and the Dealer Admin "cannot do" list → `ROLE_PERMISSION_MATRIX.md`
- Step-by-step workflows for every P0 dealer action → `DEALER_SELF_SERVICE_P0_WORKFLOW.md`
- Route-by-route inventory of `/dealer/*` → `DEALER_PANEL_ROUTE_MAP.md`
- Admin counterpart routes → `ADMIN_PANEL_ROUTE_MAP.md`
- Three upload methods (dealer self-service / admin manual / fallback) → `DATA_UPLOAD_WORKFLOW.md`
- Ad packages dealers can request → `ADS_REVENUE_MODEL.md`
- Manual invoice flow + dealer-side view → `PAYMENT_INVOICE_FLOW.md`
- Sprint 8 P0 implementation list (admin panel + dealer panel) → `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md`
