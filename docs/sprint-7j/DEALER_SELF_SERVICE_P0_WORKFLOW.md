# DEALER_SELF_SERVICE_P0_WORKFLOW

## Goal

Step-by-step procedural workflows for the **minimal Dealer Self-Service Portal** at `/dealer/*` that Sprint 8 ships. Feature tier (P0 / P1 / P2) is in `DEALER_PORTAL_SCOPE.md`. Route inventory is in `DEALER_PANEL_ROUTE_MAP.md`. Role boundaries are in `ROLE_PERMISSION_MATRIX.md`. This doc covers **how it works end-to-end**: onboarding, login, every submission lifecycle, approval / revision / rejection, audit logging, and abuse prevention.

## Core principle

> **Dealer is the data owner. Zolaq is the verification and publishing authority.**

Every public-impact change a dealer makes goes through an admin approval queue before going live. There is no shortcut.

## Submission status enum

The lifecycle every dealer-side write moves through:

```ts
// lib/dealer-submissions/types.ts (Sprint 8)

export const DEALER_SUBMISSION_STATUSES = [
  "draft",              // dealer is still editing; not yet visible to admin
  "submitted",          // dealer pressed submit; in admin queue
  "under_review",       // admin reviewer claimed the item; in active triage
  "needs_revision",     // admin sent back with a reviewer_note; dealer can edit
  "approved",           // admin approved; awaiting publish action
  "published",          // live on public surface
  "rejected",           // terminal; dealer can re-submit a fresh draft
  "expired",            // terminal; offer / campaign window passed before publish
  "cancelled",          // dealer or admin withdrew before resolution
] as const;

export type DealerSubmissionStatus = (typeof DEALER_SUBMISSION_STATUSES)[number];
```

### Allowed transitions

```
draft        → submitted | cancelled
submitted    → under_review | cancelled | expired
under_review → approved | needs_revision | rejected | cancelled | expired
needs_revision → draft | submitted | cancelled        (dealer-driven)
approved     → published | cancelled | expired
published    → (terminal — corrections go through a fresh submission cycle)
rejected     → (terminal — dealer can re-submit a new draft)
expired      → (terminal)
cancelled    → (terminal)
```

Any other transition is rejected at the API layer.

### Status visibility

- Every status is visible to the dealer at `/dealer/submissions` and inline on the originating form (e.g. `/dealer/offers/[offerId]`).
- `needs_revision` always shows the reviewer's note (free-text from `/admin/*`).
- `rejected` always shows the reviewer's reason.

## Workflows

### W1. Dealer onboarding

1. Dealer makes initial contact via WhatsApp / email / phone (this is fallback channel C from `DATA_UPLOAD_WORKFLOW.md`).
2. Sales Manager creates a `pending` ([DealerVerificationStatus](../../lib/dealers/types.ts)) record at `/admin/dealers`.
3. Ops Admin collects documents (legal name, brands represented, address, working hours, services per [DealerService](../../lib/dealers/types.ts), response SLA target).
4. Ops Admin or Super Admin sets verification status: `official_dealer | verified_partner | premium_partner | rejected | expired`.
5. Sales Manager issues first-login credentials. Email + temporary password (random, expires within 7 days).
6. Audit log: `dealer_created`, `dealer_verification_set`, `dealer_login_invited`.

### W2. Dealer verification

Verification is **always admin-owned**. Dealer cannot self-verify. The flow:

1. Dealer profile starts at `pending`.
2. Internal Ops collects and validates documents off-platform.
3. Super Admin or authorized Ops Admin transitions verification status at `/admin/dealers/[dealerId]`.
4. Audit log entry written.
5. Public dealer profile reflects the new status badge ([DealerVerificationStatus](../../lib/dealers/types.ts) → label per [lib/dealers/labels.ts](../../lib/dealers/labels.ts)).

P1 enhancement: dealer can upload supporting documents at `/dealer/profile` to attach to the record (admin still decides).

### W3. Dealer login

The Dealer auth surface is **separate from Customer OTP** ([lib/auth/session.ts](../../lib/auth/session.ts)). Sprint 8 builds it; Sprint 7 does not.

1. Dealer visits `/dealer/login`.
2. Enters email + password.
3. First-login forces password reset.
4. Session bound to `role = dealer_admin` and `dealer_id`.
5. Every request to `/dealer/*` checks session.role and confines queries to `dealer_id`.
6. Failed-login attempts logged.

Out of scope for P0: SSO, social login, 2FA. Add in P1 if needed.

### W4. Dealer profile update request

1. Dealer goes to `/dealer/profile`.
2. Edits address / working hours / services / brands / response SLA.
3. Submits → `DealerSubmission.kind = "profile_edit"`, `status = submitted`.
4. Submission appears in `/admin/dealers` review queue.
5. Ops Admin reviews. If reasonable → `approved` → published → live [Dealer](../../lib/dealers/types.ts) record updated.
6. If unclear → `needs_revision` with note ("Working hours format invalid"); dealer edits and resubmits.
7. Audit log: `submission_submitted`, `submission_reviewed`, `submission_published`.

### W5. Offer / price upload

1. Dealer goes to `/dealer/offers/new` (or `/dealer/offers/[offerId]` for revision).
2. Fills: trim_id, price, currency, `valid_until`, stock status, source.
3. Submits → `DealerSubmission.kind = "offer_new"` (or `"offer_update"`), `status = submitted`.
4. Submission appears in `/admin/offers` queue.
5. Ops Admin reviews:
   - Source verification: confirms price against the source (`verified = true` if confirmed).
   - Conflict detection: if another verified offer for the same trim disagrees materially within the overlap window, flag `conflict` per the price taxonomy.
   - If clean → `approved` → published → `PriceRecord` created/updated.
   - If issue → `needs_revision` with note ("valid_until missing", "price seems wrong vs MSRP"); dealer revises.
6. Audit log: `offer_submitted`, `offer_reviewed`, `offer_published`.

Trigger note: every offer must have a `valid_until`. Submissions without it are rejected at the form layer.

### W6. Image upload (car / dealer / showroom)

1. Dealer goes to `/dealer/media`.
2. Selects category: car image (per trim_id) or dealer/showroom image.
3. Uploads file. Alt text **required** (Azerbaijani).
4. Submits → `DealerSubmission.kind = "image_upload"`, `status = submitted`.
5. Auto-checks: dimension minimums, file size, MIME type.
6. Submission appears in `/admin/dealers/[dealerId]` (for dealer images) or `/admin/catalog/trims` (for car images).
7. Ops Admin + Content Manager review: brand-safe check, no watermarks from competitors, alt text quality.
8. On approve → published → image enters the public gallery + appears on public surfaces.
9. Audit log: `image_submitted`, `image_reviewed`, `image_published`.

### W7. Campaign / ad request

1. Dealer goes to `/dealer/ad-requests` or `/dealer/campaigns`.
2. Selects package from `ADS_REVENUE_MODEL.md` catalog: Featured Dealer / Featured Offer / Sponsored Catalog Card / Homepage Sponsored Block / Content Sponsorship / Compare Sponsored Offer / Bazar Nəbzi Sponsored Question.
3. Provides creative (image / copy) + target window + label preference (`Sponsorlu` / `Reklam` — final choice by Content Manager).
4. Submits → `DealerSubmission.kind = "ad_placement_request"`, `status = submitted`.
5. Submission appears in `/admin/ads` queue.
6. Sales Manager reviews financial side; Content Manager reviews creative + label; for Homepage Sponsored Block, Super Admin co-signs.
7. Sales Manager issues invoice → `Order.payment_status = invoice_sent` (see `PAYMENT_INVOICE_FLOW.md`).
8. Dealer is notified to upload payment proof at `/dealer/payment-proof` (workflow W8).
9. After `payment_status = paid` and all approvals signed → `AdPlacement.status = active` → campaign live within its window.
10. Audit log: `ad_request_submitted`, `ad_request_reviewed`, `invoice_sent`, `payment_confirmed`, `campaign_activated`.

### W8. Payment proof upload

1. Dealer goes to `/dealer/payment-proof`.
2. Sees list of open invoices linked to their dealer_id.
3. For an open invoice, enters a free-text payment reference (e.g. "Bank statement ref #12345, 2026-06-12"). P1 adds optional file attach.
4. Submits → `DealerSubmission.kind = "payment_proof"`, `status = submitted`. Order `payment_status` view-only flips to `payment_uploaded` (non-canonical signal — see `PAYMENT_INVOICE_FLOW.md`).
5. Submission appears in `/admin/payments` queue.
6. Sales Manager confirms with finance team.
7. Sales Manager flips `Order.payment_status = paid` (Super Admin co-sign for above-threshold amounts).
8. Dealer sees `paid` on `/dealer/invoices`.
9. Audit log: `payment_proof_uploaded`, `payment_confirmed`.

Dealer **never** owns the final `payment_status` value. Dealer's upload is only a signal.

### W9. Lead view

1. Dealer goes to `/dealer/leads`.
2. Sees list of leads where the dealer is the matched dealer (per the represented brand + trim + city).
3. Each row shows: lead_id, trim, state ([LEAD_STATES](../../lib/leads/types.ts)), the customer's `preferred_contact` and `name` if shared, time elapsed, last action.
4. PII rule: customer phone is `phone_hash`-only ([BANNED_PII_KEYS](../../lib/tracking/events.ts)). The full phone number is shared off-platform by Ops when handing the lead to the dealer.
5. Dealer reads — does **not** write. State transitions remain admin-driven in P0 via `/admin/leads`. P1 may allow the dealer to set `dealer_opened` / `no_response` themselves.

### W10. Test-drive request view

1. Dealer goes to `/dealer/test-drives`.
2. Sees pending test-drive requests for their dealership.
3. Each entry shows: trim, preferred date/time, customer first-name and preferred_contact, lead state.
4. In P0 the dealer **reads only** — confirmation flows via Ops Admin at `/admin/leads` (`test_drive_confirmed` state transition).
5. P1 enhancement: dealer can directly accept / reschedule / decline.

### W11. Approval / revision / rejection workflow

A submission moves through admin review like this:

1. `submitted` → admin reviewer at `/admin/*` claims the item → `under_review`. Audit log: `submission_claimed`.
2. Reviewer reads payload, checks against existing data.
3. Three possible outcomes:
   - **Approve**: reviewer confirms data is publishable. `status = approved`. Audit: `submission_approved`.
   - **Needs revision**: reviewer leaves a note explaining what to fix. `status = needs_revision`. Audit: `submission_returned_to_dealer`. Dealer sees note in `/dealer/submissions`.
   - **Reject**: reviewer determines the submission cannot be published (spam, policy violation, factually wrong). `status = rejected` with reason. Audit: `submission_rejected`.
4. On `approved`: a publish action by Master Admin / authorized Ops moves `status = published` and creates/updates the live entity (Dealer, PriceRecord, ContentEntry, AdPlacement, etc.). Audit: `submission_published`.
5. On `needs_revision`: dealer edits the original submission record → status returns to `draft` (re-editable) or `submitted` (re-queued). No new submission_id; the same record cycles.
6. On `rejected`: terminal. Dealer can create a fresh draft for the same content.

Reviewer notes are visible to dealer **only** for `needs_revision` and `rejected`. Internal triage notes (`under_review` annotations) stay admin-internal.

### W12. Publish rules

Publishing means moving a `DealerSubmission` from `approved` to `published` and reflecting the data on the public surface.

- Publish action is restricted to: Super Admin, Ops Admin (for routine submissions), Content Manager (for content / sponsored content), Sales Manager (for ad placements after `paid`).
- Dealer Admin cannot publish.
- Publishing without `paid` is forbidden for paid placements (ad / sponsored content / Bazar Nəbzi sponsored topic).
- Publishing writes the audit-log row `submission_published` with the actor and the resulting `published_entity_id`.

### W13. Audit log entries per dealer action

Every dealer-driven event writes one audit-log row at `/admin/audit-log`. Standard verbs:

| Verb | Trigger |
|---|---|
| `dealer_login_success` | `/dealer/login` ok |
| `dealer_login_failure` | invalid credentials |
| `submission_drafted` | dealer saved a `draft` |
| `submission_submitted` | dealer pressed Submit |
| `submission_cancelled` | dealer or admin withdrew |
| `submission_claimed` | admin entered `under_review` |
| `submission_approved` | admin approved |
| `submission_returned_to_dealer` | admin `needs_revision` |
| `submission_rejected` | admin rejected |
| `submission_published` | published to public surface |
| `submission_expired` | offer window passed before publish |
| `payment_proof_uploaded` | `/dealer/payment-proof` submit |
| `payment_confirmed` | admin flipped to `paid` |
| `dealer_password_reset` | dealer reset own password |

### W14. Abuse prevention

Sprint 8 P0 must include the following guardrails on `/dealer/*`:

- **Rate limit per dealer_id:** max N submissions per kind per hour (configurable; default 20 for offers, 5 for image uploads, 3 for ad requests).
- **Repeated-rejection escalation:** if a dealer accumulates X rejected submissions in Y days, the moderation queue at `/admin/moderation` flags the dealer for Sales Manager review.
- **Unverified-dealer constraint:** dealers with `pending` or `expired` verification status can save `draft`s but cannot `submit` for publication. They can still upload images and view their own leads.
- **Mandatory `valid_until`:** offer submissions without it are rejected at the form layer (no audit-log noise).
- **Source field required:** offer and image submissions must declare a source string.
- **Payment-proof spam check:** if a dealer uploads payment proof for an invoice without `invoice_sent` status, the form rejects.
- **No deletion of historical submissions:** soft-cancel only. Records stay for audit.

### W15. P0 / P1 / P2 split per workflow

| Workflow | P0 (Sprint 8) | P1 (Sprint 9) | P2 (post-MVP) |
|---|---|---|---|
| Onboarding | manual via Sales + admin | self-service application form on public site | automated verification API |
| Verification | admin-driven | dealer can upload supporting docs | third-party identity / document verification |
| Login | email + password | SSO option | 2FA, audit-grade session policies |
| Profile edit | submit-for-review | inline diff preview before submit | auto-approve trivial edits |
| Offer / price | submit-for-review | inline conflict warning before submit; withdraw before review | self-publish with policy guardrails |
| Image upload | submit-for-review; alt text required | auto-tagging suggestions | CDN sync + auto-crop |
| Campaign / ad request | submit-for-review | richer creative editor | self-serve inventory check |
| Payment proof | free-text reference | optional file attach (PDF / image) | online payment integration |
| Lead view | read-only | act on test-drive directly | direct chat with customer (off-platform handoff today) |
| Test-drive view | read-only | accept / reschedule / decline | automated calendar invite + reschedule |
| Approval / revision | manual queue | dealer notifications on status change | predictive triage |
| Publish | admin-driven | one-click "approve & publish" for routine items | auto-publish on policy match |
| Audit log | append-only, internal-only | dealer-visible audit slice for own submissions | tamper-evident chain |
| Abuse prevention | rate limits + repeated-rejection flag + verification gate | velocity heuristics → moderation queue | ML-based anomaly detection |

## Not in Sprint 7

- All of the above — every workflow is built in Sprint 8.
- Dealer authentication surface.
- The `/dealer/*` route group.
- `DealerSubmission` table.
- Abuse-prevention middleware.

## Cross-references

- Role boundaries and the Dealer Admin "cannot do" list → `ROLE_PERMISSION_MATRIX.md`
- Feature tier P0/P1/P2 → `DEALER_PORTAL_SCOPE.md`
- Route-by-route inventory of `/dealer/*` → `DEALER_PANEL_ROUTE_MAP.md`
- Admin counterpart routes and approval queues → `ADMIN_PANEL_ROUTE_MAP.md`, `INTERNAL_ADMIN_MVP_SCOPE.md`
- Three upload methods (this workflow is method A) → `DATA_UPLOAD_WORKFLOW.md`
- Ad packages dealers can request → `ADS_REVENUE_MODEL.md`
- Payment status state machine + dealer-side view → `PAYMENT_INVOICE_FLOW.md`
- Sprint 8 P0 implementation list → `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md`
