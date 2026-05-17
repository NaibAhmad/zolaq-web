# DEALER_PANEL_ROUTE_MAP

## Goal

Pure route inventory for the **`/dealer/*` private route group** that Sprint 8 ships. For each route: purpose, required role, allowed actions, submission statuses surfaced, approval dependency, and what the dealer can and cannot do at that route. This doc is the engineering reference for building the dealer self-service portal; step-by-step procedural flows live in `DEALER_SELF_SERVICE_P0_WORKFLOW.md`.

## Constraints (apply to every route)

- `/dealer/*` is a **private route group**. Every route requires an authenticated user with `role = "dealer_admin"` (see `ROLE_PERMISSION_MATRIX.md`).
- Every query is scoped to the session's `dealer_id` — a dealer cannot read or write any other dealer's data, ever.
- Dealer auth is a **separate surface** from Customer OTP ([lib/auth/session.ts](../../lib/auth/session.ts)) and from admin auth.
- Dealer Admin **cannot publish directly** at any route. Every public-impact write enters the `DealerSubmission` lifecycle (see `DEALER_SELF_SERVICE_P0_WORKFLOW.md`) and waits for admin approval.
- PII rule: dealer sees `phone_hash`-style customer references and only the contact fields the customer chose to share ([BANNED_PII_KEYS](../../lib/tracking/events.ts)).

## Submission statuses surfaced in the dealer panel

Every dealer-side submission moves through the lifecycle defined in `DEALER_SELF_SERVICE_P0_WORKFLOW.md`:

```
draft | submitted | under_review | needs_revision | approved | published | rejected | expired | cancelled
```

The status badge appears inline on every detail route and aggregated at `/dealer/submissions`.

## Route inventory

### `/dealer`
- **Purpose:** landing redirect to `/dealer/dashboard` (or `/dealer/login` if no session).
- **Required role:** `dealer_admin`.
- **Allowed actions:** none — redirect only.
- **Submission statuses surfaced:** —
- **Approval dependency:** —
- **Dealer can:** be redirected. **Dealer cannot:** anything else.

### `/dealer/dashboard`
- **Purpose:** dealer summary — pending submissions, active offers, fresh leads, payment status, recent ad/campaign state.
- **Required role:** `dealer_admin`.
- **Allowed actions:** view aggregates; click-through to detail routes.
- **Submission statuses surfaced:** counts of `submitted | under_review | needs_revision`.
- **Approval dependency:** read-only summary across all queues.
- **Dealer can:** view own dashboard; navigate. **Dealer cannot:** change any data here.

### `/dealer/profile`
- **Purpose:** view own dealer profile; submit profile-edit requests (address, working hours, services, brands represented, response SLA).
- **Required role:** `dealer_admin`.
- **Allowed actions:** view; create / submit / cancel `profile_edit` submission; view review note on `needs_revision`.
- **Submission statuses surfaced:** `draft | submitted | under_review | needs_revision | approved | published`.
- **Approval dependency:** `/admin/dealers/[dealerId]` review queue. Verification status changes remain admin-only.
- **Dealer can:** edit own profile fields and submit for review; attach supporting documents (P1). **Dealer cannot:** self-verify, change own [DealerVerificationStatus](../../lib/dealers/types.ts), edit source name, edit `dealer_id`.

### `/dealer/offers`
- **Purpose:** list own offers with submission status and `valid_until` countdown.
- **Required role:** `dealer_admin`.
- **Allowed actions:** view, filter, click-through to detail.
- **Submission statuses surfaced:** all nine.
- **Approval dependency:** `/admin/offers` review queue.
- **Dealer can:** view own offers. **Dealer cannot:** see other dealers' offers; change status directly.

### `/dealer/offers/new`
- **Purpose:** submit a new car / trim offer.
- **Required role:** `dealer_admin`.
- **Allowed actions:** select trim_id, enter price, currency, `valid_until`, stock status, source; save as `draft` or `submit`.
- **Submission statuses surfaced:** the freshly created submission (`draft` or `submitted`).
- **Approval dependency:** flows into `/admin/offers` on `submit`.
- **Dealer can:** create new offer submissions; cancel a `draft` or `submitted` before review. **Dealer cannot:** publish; set `verified = true` (admin owns this on approve); skip `valid_until` (form rejects); set conflict resolution (Ops Admin handles via the price taxonomy).

### `/dealer/offers/[offerId]`
- **Purpose:** view or edit an existing own offer submission. Editable only if `status = draft` or `needs_revision`.
- **Required role:** `dealer_admin`.
- **Allowed actions:** view, edit (when allowed), re-submit, cancel.
- **Submission statuses surfaced:** the specific submission's status + reviewer note if applicable.
- **Approval dependency:** flows back into `/admin/offers` on re-submit.
- **Dealer can:** revise per reviewer note; cancel before review completes. **Dealer cannot:** edit `approved` or `published` offers (must create a new `offer_update` submission); edit other dealers' offers.

### `/dealer/media`
- **Purpose:** upload car images (for trims the dealer represents) and dealer / showroom images. Alt text required.
- **Required role:** `dealer_admin`.
- **Allowed actions:** upload, edit alt text, submit, cancel; view current gallery (own only).
- **Submission statuses surfaced:** per-image submission status.
- **Approval dependency:** flows into `/admin/catalog/trims` (for car images) or `/admin/dealers/[dealerId]` (for dealer images).
- **Dealer can:** upload images with alt text; delete own `draft` uploads. **Dealer cannot:** remove published images directly (must request via admin); upload images for trims not represented; replace another dealer's image.

### `/dealer/campaigns`
- **Purpose:** create campaign / promotion request (non-paid promotions; promotional copy for own profile or offers).
- **Required role:** `dealer_admin`.
- **Allowed actions:** view own campaigns, create new `campaign_request` submission, edit `draft` / `needs_revision`, cancel.
- **Submission statuses surfaced:** all nine.
- **Approval dependency:** flows into `/admin/ads` queue for Sales Manager + Content Manager review.
- **Dealer can:** propose campaigns; provide creative + window. **Dealer cannot:** activate a campaign; remove labeling; choose placement surface (Sales/Content Manager decide).

### `/dealer/ad-requests`
- **Purpose:** request a paid sponsored placement package from the `ADS_REVENUE_MODEL.md` catalog (Featured Dealer / Featured Offer / Sponsored Catalog Card / Homepage Sponsored Block / Content Sponsorship / Compare Sponsored Offer / Bazar Nəbzi Sponsored Question / Q&A Sponsored Answer).
- **Required role:** `dealer_admin`.
- **Allowed actions:** view own ad requests, create new `ad_placement_request` submission, attach creative + label preference + target window, cancel a request before invoice issuance.
- **Submission statuses surfaced:** all nine + linked Order `payment_status` (see `PAYMENT_INVOICE_FLOW.md` dealer-side view).
- **Approval dependency:** flows into `/admin/ads`. Sales Manager issues invoice on accept; campaign activates only after `Order.payment_status = paid` per `PAYMENT_INVOICE_FLOW.md`.
- **Dealer can:** request packages; revise per reviewer note. **Dealer cannot:** approve own ads; activate campaign; remove `Sponsorlu` / `Reklam` label; bypass the `paid` gate.

### `/dealer/invoices`
- **Purpose:** view own invoices and package orders.
- **Required role:** `dealer_admin`.
- **Allowed actions:** view, filter by status, click-through to upload payment proof for `invoice_sent` invoices.
- **Submission statuses surfaced:** `Order.payment_status` (dealer-side view): `pending | invoice_sent | payment_uploaded | paid | approved | active | expired | rejected` — see `PAYMENT_INVOICE_FLOW.md`.
- **Approval dependency:** read-only on Order; writes happen at `/admin/payments`.
- **Dealer can:** view own order history; download invoice PDF (P1). **Dealer cannot:** change `payment_status`; see other dealers' orders.

### `/dealer/payment-proof`
- **Purpose:** upload payment proof against an open invoice. Free-text reference in P0; file attach in P1.
- **Required role:** `dealer_admin`.
- **Allowed actions:** select an `invoice_sent` order, enter `payment_proof_note` reference, submit; cancel before admin confirms.
- **Submission statuses surfaced:** the `payment_proof` submission's status; the linked Order's `payment_status` reads `payment_uploaded` (non-canonical indicator) until admin confirms.
- **Approval dependency:** flows into `/admin/payments`. Sales Manager confirms with finance, then flips to `paid`.
- **Dealer can:** upload reference for own invoices only. **Dealer cannot:** upload proof for invoices not yet `invoice_sent`; flip status to `paid`; modify the reference after submit (must cancel + re-submit).

### `/dealer/leads`
- **Purpose:** view own leads list — leads where the dealer is the matched dealer.
- **Required role:** `dealer_admin`.
- **Allowed actions:** view, filter by state ([LEAD_STATES](../../lib/leads/types.ts)), open detail.
- **Submission statuses surfaced:** — (leads are not dealer submissions). Lead state visible.
- **Approval dependency:** lead-state transitions live at `/admin/leads`. In P1 dealer may set `dealer_opened` / `no_response`.
- **Dealer can:** view own leads; read customer-shared contact fields (`name` if shared, `preferred_contact`). **Dealer cannot:** see raw `phone` (only `phone_hash`-anchored references — full phone shared off-platform by Ops); see other dealers' leads; change lead state in P0; comment on the lead.

### `/dealer/test-drives`
- **Purpose:** view own test-drive requests (subset of leads in `test_drive_requested` / `test_drive_confirmed` states).
- **Required role:** `dealer_admin`.
- **Allowed actions:** view, see preferred date/time, see customer first name + preferred_contact.
- **Submission statuses surfaced:** lead state; in P1, test-drive-response submission status.
- **Approval dependency:** confirmation flow runs through `/admin/leads` in P0. P1 enables direct accept / reschedule / decline from this route.
- **Dealer can:** view own pending test drives. **Dealer cannot:** confirm in P0 (Ops Admin does it); see customer's full phone number (off-platform handoff).

### `/dealer/submissions`
- **Purpose:** unified tracker for all own submissions across kinds (`profile_edit`, `offer_new`, `offer_update`, `image_upload`, `campaign_request`, `ad_placement_request`, `payment_proof`).
- **Required role:** `dealer_admin`.
- **Allowed actions:** view, filter by kind / status, click-through to the originating form for `draft` / `needs_revision` items.
- **Submission statuses surfaced:** all nine for every kind.
- **Approval dependency:** read-only aggregate over all admin queues; no direct write here.
- **Dealer can:** see lifecycle of every own submission with timestamps and reviewer notes (for `needs_revision` / `rejected`). **Dealer cannot:** edit or transition status from this route — actions happen in the originating form.

### `/dealer/settings`
- **Purpose:** own dealer account settings — contact persons, email, password reset, notification preferences (P1).
- **Required role:** `dealer_admin`.
- **Allowed actions:** view, edit own contact info, reset own password.
- **Submission statuses surfaced:** — (account changes do not require admin approval).
- **Approval dependency:** none for password / contact persons. Contact-person changes that affect the public dealer profile (display contact) route through `/dealer/profile` instead.
- **Dealer can:** reset own password; update own internal contact persons. **Dealer cannot:** change own role; link own account to a different dealer_id; deactivate the dealer record (Sales/Super Admin only).

## Allowed-actions summary by route

| Route | Kind of submission created | Target admin queue |
|---|---|---|
| `/dealer/profile` | `profile_edit` | `/admin/dealers/[dealerId]` |
| `/dealer/offers/new` | `offer_new` | `/admin/offers` |
| `/dealer/offers/[offerId]` | `offer_update` (or revision of `offer_new`) | `/admin/offers` |
| `/dealer/media` | `image_upload` | `/admin/catalog/trims` (car images) or `/admin/dealers/[dealerId]` (dealer images) |
| `/dealer/campaigns` | `campaign_request` | `/admin/ads` |
| `/dealer/ad-requests` | `ad_placement_request` | `/admin/ads` |
| `/dealer/payment-proof` | `payment_proof` | `/admin/payments` |
| `/dealer/leads` | — (read only in P0) | — |
| `/dealer/test-drives` | — (read only in P0) | — |
| `/dealer/invoices` | — (read only) | — |
| `/dealer/submissions` | — (aggregate read) | — |
| `/dealer/settings` | — (no admin approval) | — |
| `/dealer/dashboard` | — (read only) | — |

## What dealers can never do (any route)

- See other dealers' data.
- Publish anything directly to public surface.
- Self-verify or change own [DealerVerificationStatus](../../lib/dealers/types.ts).
- Change `Order.payment_status` to `paid`.
- Remove `Sponsorlu` / `Reklam` / `Premium` labels.
- Override the Zolaq Recommendation algorithm.
- Vote in Bazar Nəbzi on behalf of customers; modify topic options, vote counts, or final outcomes.
- Approve own ads, offers, or sponsored placements.
- Access `/admin/*` routes.

## Not in Sprint 7

- Any `/dealer/*` route (Sprint 8 work).
- Dealer authentication surface (Sprint 8 work).
- `DealerSubmission` table (Sprint 8 work).
- Direct accept/reschedule/decline of test-drives from `/dealer/test-drives` (P1).
- File-attach for payment proof (P1).

## Cross-references

- Role definitions and Dealer Admin "cannot do" list → `ROLE_PERMISSION_MATRIX.md`
- Feature tier P0/P1/P2 → `DEALER_PORTAL_SCOPE.md`
- Step-by-step workflows + submission status enum → `DEALER_SELF_SERVICE_P0_WORKFLOW.md`
- Admin counterpart routes and approval queues → `ADMIN_PANEL_ROUTE_MAP.md`, `INTERNAL_ADMIN_MVP_SCOPE.md`
- Three upload methods → `DATA_UPLOAD_WORKFLOW.md`
- Ad packages dealers can request → `ADS_REVENUE_MODEL.md`
- Payment flow + dealer-side view → `PAYMENT_INVOICE_FLOW.md`
- Sprint 8 implementation list → `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md`
