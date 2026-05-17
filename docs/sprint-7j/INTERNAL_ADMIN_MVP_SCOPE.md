# INTERNAL_ADMIN_MVP_SCOPE

## Goal

Define the **minimum internal admin / data operations capability** that must exist before the platform can launch commercially. Sprint 7 does not build a pixel-perfect admin UI — but Sprint 8 must ship every item on this list. Without it, dealers cannot be onboarded, prices cannot be updated, content cannot be published, ads cannot be sold, and there is no operational record of what changed.

**Round 2 update.** Sprint 8 ships a concrete **`/admin/*` private route group** rather than a collection of ad-hoc Forms. The admin panel is paired with a new **`/dealer/*` self-service portal** (see `DEALER_PORTAL_SCOPE.md` and `DEALER_PANEL_ROUTE_MAP.md`) — most data now arrives as **dealer submissions** that admin reviews and approves. Per-route inventory with role guards and approval relations lives in `ADMIN_PANEL_ROUTE_MAP.md`.

## Scope summary

| Area | P0 (Sprint 8 blocker) | P1 (Sprint 9) | P2 (post-MVP) |
|---|---|---|---|
| Admin auth | Email + password + role guard | SSO | 2FA / SAML |
| Catalog | Brand / model / trim CRUD | Bulk import | OEM sync |
| Specs | CRUD per trim | Bulk import | OEM sync |
| Images | Upload + alt text + resize | CDN sync | Auto-tagging |
| Dealers | CRUD + verification status transitions | Dealer Admin login | Dealer Portal |
| Offers / prices | CRUD + `valid_until` + source + verification | Conflict resolution UI | Auto-refresh |
| Leads | Status update (read-only on PII) | Internal CRM dashboard | Auto-routing |
| Content | News / Encyclopedia / Q&A CRUD | Editorial workflow | Localization tooling |
| Bazar Nəbzi | Topic CRUD + close + resolve | Auto-close cron | Analytics |
| Ads | Placement CRUD + label enforcement | Self-serve buyer portal | Performance dashboard |
| Sponsored placements | Approval flow + Sponsorlu label | Inventory reservation | Programmatic |
| Payment / invoice | Manual status update | Online payment | Subscription billing |
| Audit log | Global append-only event log | Filter / search UI | Export / compliance |
| Moderation | Basic queue + flag review | Auto-flag heuristics | ML moderation |

## Private admin route group (`/admin/*`)

Sprint 8 ships `/admin/*` as a private route group with role-guard middleware. Every route requires an authenticated admin user (Super Admin / Ops Admin / Content Manager / Sales Manager / Moderator) — never a Customer or Dealer Admin. Full per-route inventory with role guards and approval relations lives in `ADMIN_PANEL_ROUTE_MAP.md`; the table below is the high-level module map.

| Route | Purpose | Linked data model | Approval queue source |
|---|---|---|---|
| `/admin` | landing redirect to `/admin/dashboard` | — | — |
| `/admin/dashboard` | overview: pending approvals, leads, dealer submissions, ads, payments | aggregates | — |
| `/admin/catalog` | catalog landing | — | — |
| `/admin/catalog/brands` | brand CRUD | brand records | admin manual |
| `/admin/catalog/models` | model CRUD | model records | admin manual |
| `/admin/catalog/trims` | trim + specs CRUD + image management | trim records | admin manual |
| `/admin/catalog/prices` | catalog prices (`estimated` / `catalog_price`), source, verification, `valid_until` | `PriceRecord` | admin manual |
| `/admin/dealers` | list + create + edit dealer profiles + verification status transitions | [Dealer](../../lib/dealers/types.ts), [DealerVerificationStatus](../../lib/dealers/types.ts) | dealer `profile_edit` submissions |
| `/admin/dealers/[dealerId]` | dealer detail edit + verification status, working hours, services, source name | [Dealer](../../lib/dealers/types.ts) | dealer `profile_edit` submissions |
| `/admin/offers` | approve / reject dealer offers and prices; `valid_until` management; conflict flags | `PriceRecord` (with `dealer_id`) | dealer `offer_new` / `offer_update` submissions |
| `/admin/leads` | list + update lead state across all leads | [Lead](../../lib/leads/types.ts), [LEAD_STATES](../../lib/leads/types.ts), [LeadTimelineEvent](../../lib/leads/types.ts) | — |
| `/admin/content/news` | news CRUD + publish | [NewsArticle](../../lib/content/types.ts) | admin manual |
| `/admin/content/encyclopedia` | encyclopedia CRUD with stats, source, related model | [EncyclopediaEntry](../../lib/content/types.ts) | admin manual |
| `/admin/content/qa` | Q&A CRUD; review user-submitted questions; sponsored-answer integration | [QAEntry](../../lib/content/types.ts) | moderation queue + sponsored-answer requests |
| `/admin/market-pulse` | Bazar Nəbzi topic create / edit / close / resolve (daily / weekly / monthly) | `BazarTopic`, `BazarOption`, `BazarVote`, `BazarTopicSnapshot` (see `PREDICTION_HISTORY_MODEL.md`) | sponsored-topic requests |
| `/admin/ads` | sponsored placements + campaign requests + two-key approval | `AdPlacement` (see `AD_PLACEMENT_MAP.md`) | dealer `ad_placement_request` / `campaign_request` submissions |
| `/admin/invoices` | create manual invoices / contracts; link to orders | `Order` (see `PAYMENT_INVOICE_FLOW.md`) | — |
| `/admin/payments` | update manual payment status, record payment proof reference | `PaymentStatus` (see `PAYMENT_INVOICE_FLOW.md`) | dealer `payment_proof` submissions |
| `/admin/moderation` | unified queue: Q&A submissions, reports, flagged sponsored content, vote-manipulation flags | `ContentReport` (see `COMMUNITY_MODERATION_SCOPE.md`) | customer reports + system flags |
| `/admin/users` | list customers, dealers, admins; basic account actions (disable, reset password) | user / role tables | — |
| `/admin/roles` | grant / revoke roles per `ROLE_PERMISSION_MATRIX.md` (Super Admin only) | `RoleAssignment` | — |
| `/admin/audit-log` | append-only global change log; filter by entity / actor / date | audit log table | — |

Every write in `/admin/*` writes one row to the global audit log (section O below). Approval queues at `/admin/offers`, `/admin/dealers`, `/admin/ads`, `/admin/payments`, `/admin/moderation` consume dealer-side submissions from `DealerSubmission` (see `DEALER_PORTAL_SCOPE.md` schema sketch).

## P0 capabilities in detail (Sprint 8 must ship)

### A. Admin authentication + role guard
- Separate from Customer OTP ([lib/auth/session.ts](../../lib/auth/session.ts)).
- Login with email + password (or SSO if available).
- Session-bound to one of the roles defined in `ROLE_PERMISSION_MATRIX.md`.
- Every existing route under `app/api/internal/**` gets a role guard. Right now those routes are unguarded internal-only endpoints (e.g. [app/api/internal/leads/[leadId]/state/route.ts](../../app/api/internal/leads/[leadId]/state/route.ts)).
- Failed admin login attempts logged.

### B. Catalog CRUD
- Brand: create, rename, deprecate (soft delete).
- Model: link to brand, set name, set energy type.
- Trim: link to model, year, full spec set, image refs, default `PriceRecord`.
- Slug uniqueness enforced.

### C. Specs CRUD
- Per trim: range, charging, battery, performance, dimensions, interior, safety.
- Source URL required; `verified` boolean per spec block.
- Last-updated timestamp displayed on `/cars/[trim_id]`.

### D. Image upload / management
- Drag-and-drop upload; one primary image per trim plus gallery.
- Alt text required (Azerbaijani).
- Automatic resize to known render sizes.
- Per-dealer logo and gallery (max 10).

### E. Dealer CRUD
- Create / edit / deactivate dealer record matching the [Dealer](../../lib/dealers/types.ts) shape.
- Verification status transitions: `pending → official_dealer | verified_partner | premium_partner | rejected | expired`.
- Working hours editor, services multi-select ([DealerService](../../lib/dealers/types.ts)).
- Source name field captured for trust display.

### F. Offer / price CRUD
- Per trim: list all `PriceRecord` entries.
- Add new offer: trim_id, dealer_id, price, currency, status (`estimated | catalog_price | dealer_offer`), `valid_until`, source, `verified` flag.
- Edit `valid_until` and force-expire offers.
- Mark conflicts: when two dealers give materially different prices for the same trim within an overlap window, flag for review.
- All edits create an audit-log entry.

### G. `valid_until` management
- Sortable view of offers expiring in the next 7 days.
- Bulk "extend by N days" action.
- Auto-flag expired offers as `status = expired` on next read.

### H. Source / verification / last_updated
- Every catalog, spec, and offer row stores: `source_name`, `verified` boolean, `updated_at`.
- Admin UI surfaces unverified records and stale records first.

### I. Lead status update
- List view across all leads (Ops Admin sees all, Sales Manager sees their accounts only).
- Transitions valid per `LEAD_STATES` in [lib/leads/types.ts](../../lib/leads/types.ts).
- Every transition writes a [LeadTimelineEvent](../../lib/leads/types.ts) with `actor = "internal_operator"`.
- Customer PII (`name`, `note`) editable only for typo correction; phone is `phone_hash`-only as today.

### J. Content CRUD (news / encyclopedia / Q&A)
- Per the [ContentType](../../lib/content/types.ts) enum (`news | encyclopedia | qa`).
- News: title, slug, summary, body, image, source name, related_trim_ids, category.
- Encyclopedia: title, slug, summary, body, topic_tags, category ([EncyclopediaCategory](../../lib/content/types.ts)), stats, source (`name`, `source_count`, `verified`).
- Q&A: question, answer, related_trim_ids.
- Save as draft / publish toggle.

### K. Bazar Nəbzi topic create / edit / close
- Create topic: title, type (`daily | weekly | monthly`), options (3–4), start/end date, related model, related category, sponsored flag.
- Edit while `status = draft`. Lock title and options once `status = active`.
- Close action: flips to `closed`, freezes vote count.
- Resolve action: Content Manager writes final outcome + Zolaq market summary, flips to `resolved`.
- Sponsored topics: hold at `sponsored_pending_approval` until Sales Manager confirms `paid`.

### L. Ad placement create / edit
- Per-slot inventory: homepage block, catalog sidebar/inline, car detail sidebar, compare sponsored offer slot, content sponsorship slot, Q&A sponsored answer slot, Bazar Nəbzi sponsored topic slot.
- Each placement: package type, advertiser/dealer, start/end date, label (`Sponsorlu` / `Reklam` / `Premium`), invoice_id, status.
- See `AD_PLACEMENT_MAP.md` for placement rules.

### M. Sponsored placement approval
- Two-key approval: Content Manager approves creative + labeling; Sales Manager confirms invoice `paid`.
- Cannot go live unless both keys are present.

### N. Payment / invoice manual status update
- Status field: `pending | invoice_sent | paid | overdue | cancelled` (see `PAYMENT_INVOICE_FLOW.md`).
- Free-text notes for payment proof reference.
- Status transitions write audit-log entries.

### O. Audit log
- Append-only global log table.
- Captures: actor user_id, actor role, action verb, entity type, entity_id, before/after diff (for updates), timestamp, IP.
- Every write in admin (dealer edit, offer edit, content publish, payment status flip, role grant, ad placement go-live) writes one row.
- Read-only UI; filter by entity / actor / date.
- This is the **only new global audit table** — per-lead timeline events ([LeadTimelineEvent](../../lib/leads/types.ts)) remain a separate, lead-scoped feed.

### P. Moderation queue
- One inbox view across: reported Q&A questions, reported Bazar Nəbzi votes, flagged dealer self-promotion, flagged unlabeled sponsored content.
- Actions per item: approve, reject, escalate.
- Resolution writes audit-log entry.

## Existing endpoints to harden (not rewrite)

The codebase already has internal routes that admins will use. Sprint 8 wraps them with role guards rather than rebuilding them:

- `app/api/internal/leads/[leadId]/state/route.ts` — lead state transitions.
- `app/api/internal/leads/[leadId]/timeline/route.ts` — timeline appending.
- Future: `app/api/internal/dealers/[dealerId]`, `app/api/internal/offers/[offerId]`, `app/api/internal/content/[contentId]`, `app/api/internal/bazar-nebzi/[topicId]`, `app/api/internal/ad-placements/[placementId]`, `app/api/internal/invoices/[invoiceId]`, `app/api/internal/audit-log` (Sprint 8 adds).

## Not in Sprint 7

- Building admin UI screens.
- Wiring auth or role guards.
- Audit-log table.
- Any of the P1 / P2 items in the table above.

## Acceptance for Sprint 8 launch readiness

- A new dealer can be onboarded end-to-end by Ops Admin from `/admin/dealers` without dev intervention.
- A dealer can log in to `/dealer/*`, submit a new offer at `/dealer/offers/new`, and see it appear in the `/admin/offers` approval queue immediately.
- An admin can approve the dealer's offer at `/admin/offers` and have it live on `/cars/[trim_id]` within 10 minutes.
- A news / encyclopedia / Q&A entry can be published from `/admin/content/**` without code change.
- A Bazar Nəbzi topic can be created, run, closed, and resolved from `/admin/market-pulse` without code change.
- A dealer can request an ad package at `/dealer/ad-requests`; Sales Manager can approve, gate by `paid`, label, and go live from `/admin/ads` without code change.
- A dealer can upload payment proof at `/dealer/payment-proof`; Sales Manager sees it at `/admin/payments` and can flip `payment_status` to `paid`.
- Every admin write produces an audit-log row visible at `/admin/audit-log`.
