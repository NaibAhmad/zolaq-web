# ROLE_PERMISSION_MATRIX

## Goal

Define every actor that touches the Zolaq platform — from Master Admin to public Customer — and the exact set of capabilities each one holds. This document is the foundation for every other Sprint 7J doc: `INTERNAL_ADMIN_MVP_SCOPE.md`, `DEALER_PORTAL_SCOPE.md`, `PAYMENT_INVOICE_FLOW.md`, `COMMUNITY_MODERATION_SCOPE.md` and `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md` all reference role names from here.

Sprint 7 ships with **OTP-based Customer auth only** ([lib/auth/session.ts](../../lib/auth/session.ts)). All other roles are documented here for **Sprint 8 implementation**, not built now.

**Round 2 update.** Per CTO direction, Dealer Admin is now **P0 in Sprint 8** — not P1. The platform model is "dealer is data owner, Zolaq is verification and publishing authority": dealers submit their own profile / offers / images / campaigns through `/dealer/*` (see `DEALER_PANEL_ROUTE_MAP.md`), and Master Admin / Internal Ops review and approve via `/admin/*` (see `ADMIN_PANEL_ROUTE_MAP.md`). Public visibility always requires approval.

## Roles

1. **Super Admin / Master Admin** — Zolaq platform owner. Final authority on everything. Owns `/admin/*`.
2. **Internal Ops Admin** — Day-to-day operations: dealer-submission review, lead status updates, content management. Works in `/admin/*`.
3. **Content Manager** — Owns news, encyclopedia, Q&A, Bazar Nəbzi editorial calendar. Works in `/admin/content/**` and `/admin/market-pulse`.
4. **Sales / Lead Manager** — Manages dealer accounts, ad sales, invoices, campaign go-live. Works in `/admin/ads`, `/admin/invoices`, `/admin/payments`.
5. **Dealer Admin (P0)** — Dealer-side user with a real login. Submits and updates own dealer profile, offers, prices, images, campaign / ad requests, and payment proof from `/dealer/*`. Sees own leads and own test-drive requests. **Cannot publish anything to public site without admin approval.**
6. **Advertiser / Sponsor** — Buys ad/sponsorship packages. In MVP this is handled by Sales Manager on the advertiser's behalf — no advertiser login (advertiser self-service is P1).
7. **Customer** — Public OTP-verified user. Searches, compares, saves, opens leads, votes in Bazar Nəbzi.
8. **Moderator** — Reviews user-generated content (Q&A questions, Bazar Nəbzi answers, reports) and unlabeled sponsored content. Can be the same person as Content Manager in MVP but is a separate capability set. Works in `/admin/moderation`.

## Capability matrix

Columns: **V** = view, **C** = create, **U** = update, **A** = approve, **P** = publish, **$** = manage payments/invoices, **Ads** = manage ad placements, **M** = moderate community/Q&A.

| Role | V | C | U | A | P | $ | Ads | M |
|---|---|---|---|---|---|---|---|---|
| Super Admin | all | all | all | all | all | yes | yes | yes |
| Internal Ops Admin | all | catalog / dealers / offers / leads / content | catalog / dealers / offers / leads / content | leads / dealers | content drafts → published (with Content Mgr) | view only | view | flag only |
| Content Manager | all content + Bazar Nəbzi | news / encyclopedia / Q&A / Bazar Nəbzi topics | own content | sponsored content placement | yes (content + topics) | no | no | yes (community) |
| Sales / Lead Manager | dealers / offers / leads / invoices / ads | ad orders / invoices / sponsored placements | dealer accounts / invoice status / campaign status | invoice → `paid`, campaign go-live | ads / sponsored placements | yes | yes | no |
| Dealer Admin (P0) | own dealer profile / own offers / own leads / own test-drives / own invoices / own campaigns | profile-edit requests / offer submissions / image uploads / campaign + ad requests / payment proof | own drafts and `needs_revision` submissions | no | **no — cannot publish** | upload payment proof only | request only | no |
| Advertiser / Sponsor (P1) | own campaign status / own invoices | campaign request | own campaign drafts | no | no | no | request only | no |
| Customer | public content + own private data (leads, saved, decisions, viewed history) | leads / decisions / Bazar Nəbzi votes / Q&A questions | own profile / own leads (close only) | no | no | no | no | report only |
| Moderator | all community content + reports | moderation notes | post status (approve/reject) | community content | community content | no | no | yes |

## Capability detail per role

### Super Admin / Master Admin
- Works from the `/admin/*` private route group (see `ADMIN_PANEL_ROUTE_MAP.md`).
- Owns all platform data and approvals. Can view, create, update, delete anything.
- Approves or rejects dealer submissions arriving from `/dealer/*` (offers, prices, images, profile edits, ad requests, payment proofs).
- Publishes / unpublishes content (news, encyclopedia, Q&A, Bazar Nəbzi topics, dealer offers).
- Manages users and roles via `/admin/users` and `/admin/roles`.
- Manages payments/invoices via `/admin/invoices` and `/admin/payments` — final `payment_status` belongs here.
- Manages ads / sponsored placements via `/admin/ads`.
- Manages Bazar Nəbzi via `/admin/market-pulse`.
- Reads `/admin/audit-log`; only role that can override an audit-log entry (and the override is itself logged).
- Can override Internal Ops decisions (e.g. reverse a rejection, expedite an approval).
- **Cannot do:** read raw PII — the platform stores `phone_hash` only ([BANNED_PII_KEYS](../../lib/tracking/events.ts)) for every role including Super Admin.

### Internal Ops Admin
- Works from `/admin/*` (most routes).
- Creates and updates catalog data (brand / model / trim / specs / catalog prices / images) via `/admin/catalog/**`.
- **Reviews dealer submissions** in the approval queues at `/admin/offers`, `/admin/dealers`, `/admin/ads`, `/admin/moderation`. Can approve/reject if permitted; can mark `needs_revision` with a note back to the dealer.
- Manages offers/prices via `/admin/offers` — includes the `valid_until`, `source`, `verified` controls.
- Manages content via `/admin/content/**` (draft → publish workflow with Content Manager).
- Manages moderation queue at `/admin/moderation`.
- Updates lead state via `/admin/leads` through the existing state machine ([LEAD_STATES](../../lib/leads/types.ts)).
- Transitions dealer verification status (`pending → official_dealer | verified_partner | premium_partner | rejected | expired`) via the [DealerVerificationStatus](../../lib/dealers/types.ts) enum at `/admin/dealers/[dealerId]`.
- **Cannot do:** change system-level roles (only Super Admin), confirm payments to `paid` above the configurable co-sign threshold, override audit-log entries.

### Content Manager
- Owns `ContentType` of `news`, `encyclopedia`, `qa` (see [lib/content/types.ts](../../lib/content/types.ts)).
- Owns Bazar Nəbzi topic editorial calendar (see `MARKET_PULSE_MODULE.md`).
- Approves sponsored content placement on a per-piece basis (works with Sales Manager who approves the financial side).
- Moderates community Q&A and Bazar Nəbzi votes/reports.
- **Cannot do:** touch leads, dealers, offers, invoices, or ad slot inventory.

### Sales / Lead Manager
- Owns the commercial pipeline. Creates invoices, marks payment status (`pending | invoice_sent | paid | overdue | cancelled` — see `PAYMENT_INVOICE_FLOW.md`).
- Activates campaigns only after `payment_status = paid`.
- Approves ad placements and sponsored placements (works with Content Manager for editorial approval).
- Owns dealer relationship escalations and lead status escalations.
- **Cannot do:** publish editorial content, change platform data model, write Q&A answers.

### Dealer Admin (P0 — Sprint 8 ships this)
- Works from the `/dealer/*` private route group (see `DEALER_PANEL_ROUTE_MAP.md`). Authentication is a **separate surface** from Customer OTP ([lib/auth/session.ts](../../lib/auth/session.ts)) — see `DEALER_SELF_SERVICE_P0_WORKFLOW.md` for the login flow.
- **Can do — own dealer scope only:**
  - View own dealer profile, own offers, own leads, own test-drive requests, own invoices, own campaigns.
  - Submit profile-edit request (`/dealer/profile`).
  - Upload new offer / price submission (`/dealer/offers/new`) with trim_id, price, currency, `valid_until`, stock status, source.
  - Edit own `draft` and `needs_revision` offer submissions.
  - Upload car images and dealer / showroom images at `/dealer/media` (with alt text required).
  - Create campaign / promotion request at `/dealer/campaigns`.
  - Create sponsored placement (ad) request at `/dealer/ad-requests`.
  - Upload payment proof at `/dealer/payment-proof` (free-text reference; optional file attach in P1).
  - View own leads list at `/dealer/leads` — PII rule preserved: `phone_hash` only, plus the contact fields the customer chose to share.
  - View own test-drive requests at `/dealer/test-drives`.
  - Track every submission status at `/dealer/submissions` through the submission lifecycle: `draft → submitted → under_review → approved | rejected | needs_revision → published | expired | cancelled` (see `DEALER_SELF_SERVICE_P0_WORKFLOW.md`).
  - See approval / rejection status with reviewer notes.
- **Dealer Admin cannot do:**
  - Publish anything directly to the public site — every submission requires admin approval.
  - Verify own dealer record (only Super Admin / authorized Ops can set [DealerVerificationStatus](../../lib/dealers/types.ts)).
  - Change the Zolaq Recommendation algorithm or its outputs.
  - Edit other dealers' data or see other dealers' offers/leads.
  - See other dealers' leads.
  - Change `payment_status` to `paid` (only admin owns the final state — see `PAYMENT_INVOICE_FLOW.md`).
  - Remove `Sponsorlu` / `Reklam` / `Premium` labels on own placements.
  - Approve own ad placements or own offers.
  - Comment on Q&A as a "neutral expert" — dealer-authored expert content is sold via the Q&A Sponsored Answer package (`ADS_REVENUE_MODEL.md` #9) and carries the `Sponsorlu` label.
  - Modify Bazar Nəbzi topic options, vote counts, or final outcomes.
  - Access `/admin/*` routes.

### Advertiser / Sponsor (P1)
- Symmetric to Dealer Admin but for non-dealer advertisers (insurance, financing, accessories, brand sponsorships).
- Reads own campaign status, own invoices.
- Submits campaign creative drafts.
- **Cannot do:** appear as a neutral content source. Every sponsored placement must be labeled `Sponsorlu` / `Reklam` (see `AD_PLACEMENT_MAP.md`).

### Customer
- OTP-verified ([lib/auth/session.ts](../../lib/auth/session.ts)).
- Creates: leads ([lib/leads/types.ts](../../lib/leads/types.ts)), decisions ([lib/decisions/types.ts](../../lib/decisions/types.ts)), saved cars, viewed cars, Bazar Nəbzi votes, Q&A questions.
- Reads only own private data (own leads, own decisions, own profile).
- **Cannot do:** see other users' leads, comment on private leads, manage anything admin/payments/ads, vote more than once per Bazar Nəbzi topic, publish content.

### Moderator
- Reviews Q&A questions before publish.
- Reviews Bazar Nəbzi sponsored topic copy before go-live (works with Sales Manager for paid side).
- Reviews user reports (spam, dealer self-promotion, manipulation).
- **Cannot do:** edit catalog, dealers, offers, invoices, ads, or non-community content.

## Role enum sketch (for Sprint 8)

```ts
// lib/roles/types.ts (to be created in Sprint 8)
export const PLATFORM_ROLES = [
  "super_admin",
  "ops_admin",
  "content_manager",
  "sales_manager",
  "dealer_admin",       // P0 — minimal self-service portal at /dealer/*
  "advertiser",         // P1
  "customer",
  "moderator",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export type RoleAssignment = {
  user_id: string;
  role: PlatformRole;
  dealer_id?: string;       // only for dealer_admin
  advertiser_id?: string;   // only for advertiser
  assigned_by: string;      // user_id of the super_admin who granted it
  assigned_at: number;
  revoked_at?: number;
};
```

## Cross-references

- Per-data-type "who can create/update" and the three upload methods → `DATA_UPLOAD_WORKFLOW.md`
- Admin panel modules and route inventory → `INTERNAL_ADMIN_MVP_SCOPE.md`, `ADMIN_PANEL_ROUTE_MAP.md`
- Dealer panel feature tier (P0/P1/P2) → `DEALER_PORTAL_SCOPE.md`
- Dealer panel route inventory and submission workflow → `DEALER_PANEL_ROUTE_MAP.md`, `DEALER_SELF_SERVICE_P0_WORKFLOW.md`
- Payment status state machine + dealer-side view → `PAYMENT_INVOICE_FLOW.md`
- Community moderation rules → `COMMUNITY_MODERATION_SCOPE.md`

## Not in Sprint 7

- Role guard middleware.
- Admin authentication (separate from Customer OTP — Sprint 8).
- Dealer authentication (separate from Customer OTP — Sprint 8).
- Permission checks on `app/api/internal/**` routes.
- `/admin/*` and `/dealer/*` route groups.

All of the above is **P0 for Sprint 8** (see `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md`).
