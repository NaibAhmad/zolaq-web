# ADMIN_PANEL_ROUTE_MAP

## Goal

Pure route inventory for the **`/admin/*` private route group** that Sprint 8 ships. For each route: purpose, required role, allowed actions, linked data model, approval relation to dealer submissions, and public impact after approval. This doc is the engineering reference for building the admin panel; module-level scope and CRUD requirements live in `INTERNAL_ADMIN_MVP_SCOPE.md`.

## Constraints (apply to every route)

- `/admin/*` is a **private route group**. Every route requires an authenticated admin user with one of the roles defined in `ROLE_PERMISSION_MATRIX.md` (Super Admin, Internal Ops Admin, Content Manager, Sales Manager, Moderator). Customer and Dealer Admin sessions never reach `/admin/*`.
- Admin auth is **separate** from Customer OTP ([lib/auth/session.ts](../../lib/auth/session.ts)) and separate from Dealer auth — three distinct auth surfaces.
- Every write writes one row to the global audit log at `/admin/audit-log` (see `INTERNAL_ADMIN_MVP_SCOPE.md` section O).
- PII rule applies platform-wide: admin sees `phone_hash`, not raw phone numbers ([BANNED_PII_KEYS](../../lib/tracking/events.ts)).

## Route inventory

### `/admin`
- **Purpose:** landing redirect to `/admin/dashboard`.
- **Required role:** any admin role.
- **Allowed actions:** none — redirect only.
- **Linked data model:** —
- **Approval relation:** —
- **Public impact:** none.

### `/admin/dashboard`
- **Purpose:** at-a-glance overview of pending approvals, fresh leads, recent dealer submissions, active ad placements, payment status totals, and Bazar Nəbzi topic states.
- **Required role:** any admin role (role-scoped widgets — Sales Manager sees commercial widgets; Content Manager sees editorial widgets; Moderator sees moderation queue counts).
- **Allowed actions:** view; click-through to detail routes.
- **Linked data model:** aggregates from `DealerSubmission`, [Lead](../../lib/leads/types.ts), `AdPlacement`, `Order` ([PAYMENT_INVOICE_FLOW.md](./PAYMENT_INVOICE_FLOW.md)), `BazarTopic` ([PREDICTION_HISTORY_MODEL.md](./PREDICTION_HISTORY_MODEL.md)).
- **Approval relation:** read-only summary of all queues.
- **Public impact:** none.

### `/admin/catalog`
- **Purpose:** catalog landing — links to brands / models / trims / prices.
- **Required role:** Ops Admin, Super Admin (read for everyone else).
- **Allowed actions:** navigate.
- **Linked data model:** catalog hierarchy from `lib/cars/types.ts`.
- **Approval relation:** —
- **Public impact:** none directly.

### `/admin/catalog/brands`
- **Purpose:** brand CRUD (create, rename, deprecate / soft delete). Slug uniqueness enforced.
- **Required role:** Ops Admin, Super Admin.
- **Allowed actions:** view, create, update, soft-delete.
- **Linked data model:** brand records.
- **Approval relation:** none (method B — admin manual upload per `DATA_UPLOAD_WORKFLOW.md`).
- **Public impact:** populates catalog filters, dealer-represented-brands selectors, breadcrumbs across `/cars`, `/dealers`.

### `/admin/catalog/models`
- **Purpose:** model CRUD: name, energy type, parent brand link.
- **Required role:** Ops Admin, Super Admin.
- **Allowed actions:** view, create, update, soft-delete.
- **Linked data model:** model records.
- **Approval relation:** none.
- **Public impact:** populates trim listings under each brand on `/cars`.

### `/admin/catalog/trims`
- **Purpose:** trim + specs CRUD + image management per trim. Year, full spec set, default image, gallery.
- **Required role:** Ops Admin, Super Admin (Content Manager for image approval).
- **Allowed actions:** view, create, update, soft-delete; image attach with alt text.
- **Linked data model:** trim records + spec sub-objects + image references.
- **Approval relation:** consumes approved image submissions from `DealerSubmission.kind = "image_upload"` (car category).
- **Public impact:** drives `/cars/[trim_id]`, catalog card data, compare result content.

### `/admin/catalog/prices`
- **Purpose:** catalog prices — `PriceRecord` entries with `status = "estimated" | "catalog_price"`. Source URL, `verified` flag, `valid_until`, last-updated timestamp.
- **Required role:** Ops Admin, Super Admin.
- **Allowed actions:** view, create, update, force-expire.
- **Linked data model:** `PriceRecord` from `lib/cars/types.ts`.
- **Approval relation:** none (admin-authored). Dealer-authored prices flow through `/admin/offers`.
- **Public impact:** baseline price shown on `/cars/[trim_id]` price card; "Zolaq qiymət göstəricisi" calculations.

### `/admin/dealers`
- **Purpose:** list + create + edit dealer profiles; trigger verification status transitions.
- **Required role:** Sales Manager, Ops Admin, Super Admin.
- **Allowed actions:** view, create, update, set verification status, deactivate.
- **Linked data model:** [Dealer](../../lib/dealers/types.ts), [DealerVerificationStatus](../../lib/dealers/types.ts), [DealerService](../../lib/dealers/types.ts).
- **Approval relation:** consumes `DealerSubmission.kind = "profile_edit"` from `/dealer/profile`.
- **Public impact:** drives `/dealers`, `/dealers/[dealer_id]`, dealer chips on trim offer cards, dealer verification badge per [lib/dealers/labels.ts](../../lib/dealers/labels.ts).

### `/admin/dealers/[dealerId]`
- **Purpose:** dealer detail edit: legal name, display name, brands, address, working hours, services, response SLA, source name, verification status.
- **Required role:** Sales Manager, Ops Admin, Super Admin (verification transition requires Ops Admin or Super Admin).
- **Allowed actions:** view, update, set verification status, attach documents (P1).
- **Linked data model:** [Dealer](../../lib/dealers/types.ts) record by `dealer_id`.
- **Approval relation:** consumes `DealerSubmission.kind = "profile_edit"` and `"image_upload"` (dealer image category) for this dealer.
- **Public impact:** `/dealers/[dealer_id]` profile page; verification badge across all surfaces.

### `/admin/offers`
- **Purpose:** approve / reject dealer offers and prices. `valid_until` management, conflict flags, force-expire.
- **Required role:** Ops Admin, Super Admin.
- **Allowed actions:** view, approve, reject, `needs_revision`, force-expire; sort by expiring soon.
- **Linked data model:** `PriceRecord` (with `dealer_id`) from `lib/cars/types.ts`.
- **Approval relation:** primary consumer of `DealerSubmission.kind = "offer_new" | "offer_update"`.
- **Public impact:** offer cards on `/cars/[trim_id]` and `/dealers/[dealer_id]`; "Zolaq qiymət göstəricisi" stats; compare-page offer rows.

### `/admin/leads`
- **Purpose:** list all leads; update lead state through the [LEAD_STATES](../../lib/leads/types.ts) machine. Filter by state, dealer, trim.
- **Required role:** Ops Admin, Sales Manager (own-account scope), Super Admin.
- **Allowed actions:** view, transition state, append timeline event ([LeadTimelineEvent](../../lib/leads/types.ts) with `actor = "internal_operator"`).
- **Linked data model:** [Lead](../../lib/leads/types.ts), [LeadTimelineEvent](../../lib/leads/types.ts).
- **Approval relation:** none — leads are not dealer submissions. (Dealer reads own leads from `/dealer/leads`.)
- **Public impact:** customer sees state update on `/profile/leads/[leadId]`; dealer sees state update on `/dealer/leads`.

### `/admin/content/news`
- **Purpose:** news CRUD with draft / publish toggle. Title, slug, summary, body, image, source name, category, related_trim_ids.
- **Required role:** Content Manager, Ops Admin (drafts), Super Admin.
- **Allowed actions:** view, create draft, update, attach image, publish, unpublish.
- **Linked data model:** [NewsArticle](../../lib/content/types.ts).
- **Approval relation:** none (admin-authored). Sponsored news is method B with Content Manager + Sales Manager two-key approval per `ADS_REVENUE_MODEL.md` #7.
- **Public impact:** `/news`, `/news/[slug]`, HomeContentTeaser, related-content sidebars.

### `/admin/content/encyclopedia`
- **Purpose:** encyclopedia CRUD with topic tags, [EncyclopediaCategory](../../lib/content/types.ts), stats, source ([EncyclopediaSource](../../lib/content/types.ts)).
- **Required role:** Content Manager, Ops Admin (drafts), Super Admin.
- **Allowed actions:** view, create draft, update, attach image, publish, unpublish.
- **Linked data model:** [EncyclopediaEntry](../../lib/content/types.ts).
- **Approval relation:** none (admin-authored). Sponsored encyclopedia same as news.
- **Public impact:** `/encyclopedia`, `/encyclopedia/[slug]`, related-content sidebars.

### `/admin/content/qa`
- **Purpose:** Q&A CRUD; review user-submitted questions; integrate sponsored answers.
- **Required role:** Moderator (review), Content Manager (publish), Ops Admin, Super Admin.
- **Allowed actions:** view, approve user-submitted question, create answer, update, publish, attach sponsored-answer block per `ADS_REVENUE_MODEL.md` #9.
- **Linked data model:** [QAEntry](../../lib/content/types.ts).
- **Approval relation:** consumes Customer Q&A submissions via the moderation queue at `/admin/moderation`; sponsored answers from `DealerSubmission.kind = "ad_placement_request"` for the Q&A surface.
- **Public impact:** `/qa` and HomeContentTeaser Q&A slot.

### `/admin/market-pulse`
- **Purpose:** Bazar Nəbzi topic create / edit / close / resolve / archive. Daily / weekly / monthly cadence per `COMMUNITY_PREDICTION_RULES.md`.
- **Required role:** Content Manager, Moderator (review), Sales Manager (financial side of sponsored topics), Super Admin.
- **Allowed actions:** view, create topic, set options + start/end, transition through `draft → sponsored_pending_approval | active → closed → resolved → archived`, force-close, write final outcome + Zolaq market summary.
- **Linked data model:** `BazarTopic`, `BazarOption`, `BazarVote`, `BazarTopicSnapshot` (see `PREDICTION_HISTORY_MODEL.md`).
- **Approval relation:** consumes `DealerSubmission.kind = "ad_placement_request"` for Bazar Nəbzi Sponsored Question (package #10).
- **Public impact:** homepage "Bazar nə deyir?" preview block; `/qa` Bazar Nəbzi tab + history sub-views per `MARKET_PULSE_MODULE.md`.

### `/admin/ads`
- **Purpose:** sponsored placements + campaign requests; two-key approval (Content Manager + Sales Manager); three-key for Homepage Sponsored Block (adds Super Admin).
- **Required role:** Sales Manager (financial + activation), Content Manager (creative + labeling), Super Admin (Homepage block).
- **Allowed actions:** view, create placement, link to `Order`, set start/end, attach label, transition through `draft → approved → active → paused | ended | rejected`. Activation gated by `Order.payment_status = paid`.
- **Linked data model:** `AdPlacement`, `AdSurface`, `AdLabel`, `AdPlacementStatus` (see `AD_PLACEMENT_MAP.md` schema sketch).
- **Approval relation:** consumes `DealerSubmission.kind = "ad_placement_request"` and `"campaign_request"` from `/dealer/ad-requests` and `/dealer/campaigns`.
- **Public impact:** every surface listed in `AD_PLACEMENT_MAP.md` per-page placement table.

### `/admin/invoices`
- **Purpose:** create manual invoices / contracts; link to orders and placements.
- **Required role:** Sales Manager, Super Admin.
- **Allowed actions:** view, create `Order`, record `invoice_number` and `due_at`, link to `AdPlacement[]`, cancel.
- **Linked data model:** `Order`, `OrderKind` (see `PAYMENT_INVOICE_FLOW.md`).
- **Approval relation:** outputs feed `/dealer/invoices` and `/dealer/payment-proof` for the dealer.
- **Public impact:** none directly; gates campaign activation downstream.

### `/admin/payments`
- **Purpose:** update manual payment status; record payment proof reference; flip to `paid`.
- **Required role:** Sales Manager (most transitions), Super Admin (co-sign above threshold).
- **Allowed actions:** view, transition `pending → invoice_sent → paid | overdue | cancelled` per `PAYMENT_INVOICE_FLOW.md`.
- **Linked data model:** `Order.payment_status`.
- **Approval relation:** consumes `DealerSubmission.kind = "payment_proof"` from `/dealer/payment-proof`; surfaces `payment_uploaded` indicator before admin confirms.
- **Public impact:** dealer sees `/dealer/invoices` status update; campaign activation at `/admin/ads` unlocks on `paid`.

### `/admin/moderation`
- **Purpose:** unified moderation inbox — reported Q&A entries, reported Bazar Nəbzi topics, flagged dealer self-promotion, flagged unlabeled sponsored content, suspicious vote patterns.
- **Required role:** Moderator (primary), Content Manager, Super Admin.
- **Allowed actions:** view, approve, reject, escalate; vote-invalidation with reason; suspend placement.
- **Linked data model:** `ContentReport`, `ReportTarget`, `ReportReason`, `ReportStatus` (see `COMMUNITY_MODERATION_SCOPE.md` schema).
- **Approval relation:** consumes Customer reports + system flags; can re-flag dealer submissions via `/admin/dealers`.
- **Public impact:** invalidated votes recompute Bazar Nəbzi aggregates; suspended placements removed from public surfaces.

### `/admin/users`
- **Purpose:** list and basic account actions for customers, dealers (and dealer admins), and admins.
- **Required role:** Super Admin (full); Sales Manager (read dealer accounts only); Ops Admin (read customer accounts for support).
- **Allowed actions:** view, disable account, force password reset, link/unlink dealer_id to dealer_admin user.
- **Linked data model:** user records + `RoleAssignment` (see `ROLE_PERMISSION_MATRIX.md`).
- **Approval relation:** none.
- **Public impact:** disabled customers cannot OTP-verify; disabled dealer admins cannot log in to `/dealer/*`.

### `/admin/roles`
- **Purpose:** grant / revoke roles per the role enum in `ROLE_PERMISSION_MATRIX.md`.
- **Required role:** Super Admin only.
- **Allowed actions:** view, grant role to user, revoke role.
- **Linked data model:** `RoleAssignment`.
- **Approval relation:** none.
- **Public impact:** changes who can access which `/admin/*` and `/dealer/*` routes.

### `/admin/audit-log`
- **Purpose:** append-only global log of every admin/dealer write. Filter by entity, actor, date, action verb.
- **Required role:** Super Admin (full); other admin roles see scoped slices.
- **Allowed actions:** view, filter, export (P1).
- **Linked data model:** audit log table (new — see `INTERNAL_ADMIN_MVP_SCOPE.md` section O).
- **Approval relation:** —
- **Public impact:** none. Per-lead timeline events ([LeadTimelineEvent](../../lib/leads/types.ts)) remain a separate, lead-scoped feed.

## Role → routes quick-reference

| Role | Primary routes |
|---|---|
| Super Admin | every route, including `/admin/roles`, `/admin/audit-log`, role overrides |
| Internal Ops Admin | `/admin/catalog/**`, `/admin/dealers`, `/admin/offers`, `/admin/leads`, `/admin/content/**` (drafts), `/admin/moderation` (escalations) |
| Content Manager | `/admin/content/**` (publish), `/admin/market-pulse`, `/admin/ads` (creative + labeling), `/admin/moderation` |
| Sales / Lead Manager | `/admin/dealers`, `/admin/leads` (own accounts), `/admin/ads`, `/admin/invoices`, `/admin/payments` |
| Moderator | `/admin/moderation`, `/admin/content/qa` (review), `/admin/market-pulse` (sponsored review) |

## Not in Sprint 7

- Any `/admin/*` route (Sprint 8 work).
- Admin authentication surface (Sprint 8).
- Role-guard middleware (Sprint 8).
- The audit-log table (Sprint 8).

## Cross-references

- Role definitions and capability matrix → `ROLE_PERMISSION_MATRIX.md`
- Module-level CRUD requirements per route → `INTERNAL_ADMIN_MVP_SCOPE.md`
- Dealer panel mirror → `DEALER_PANEL_ROUTE_MAP.md`
- Dealer-submission lifecycle → `DEALER_SELF_SERVICE_P0_WORKFLOW.md`
- Three upload methods → `DATA_UPLOAD_WORKFLOW.md`
- Ads catalog → `ADS_REVENUE_MODEL.md`
- Placement rules per surface → `AD_PLACEMENT_MAP.md`
- Payment flow → `PAYMENT_INVOICE_FLOW.md`
- Sprint 8 implementation list → `SPRINT_8_IMPLEMENTATION_REQUIREMENTS.md`
