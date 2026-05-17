# DATA_UPLOAD_WORKFLOW

## Goal

Explain — for every data type in the platform — **who** puts it there, **how** it gets in, and **who approves** it before users see it. Used by `INTERNAL_ADMIN_MVP_SCOPE.md` to size the admin tooling, by `DEALER_PORTAL_SCOPE.md` to size dealer self-service, and by `ADMIN_PANEL_ROUTE_MAP.md` / `DEALER_PANEL_ROUTE_MAP.md` to map data flows to private routes.

**Round 2 update.** Sprint 8 introduces a dealer-driven upload model. Round 1 said "P0 data is managed by internal admin" — that decision is reversed. The new principle: **dealer is the data owner, Zolaq is the verification and publishing authority**. Three upload methods coexist; the dealer self-service path is preferred. Public visibility always requires admin approval.

A second MVP rule holds unchanged: **content is data-driven, not hardcoded in UI components.** New news / encyclopedia / Q&A / Bazar Nəbzi items must be created by writing data (seed file in MVP, database in Sprint 8) — never by editing a React component.

## Three upload methods (Sprint 8)

### A. Dealer self-service upload — preferred MVP path

Used for: dealer profile edits, offers / prices, car & dealer images, campaign / ad requests, payment proofs.

1. Dealer logs in to `/dealer/*` (see `DEALER_PANEL_ROUTE_MAP.md`).
2. Dealer creates a draft via the relevant `/dealer/**` form (e.g. `/dealer/offers/new`, `/dealer/profile`, `/dealer/media`).
3. Dealer submits → `DealerSubmission.status = submitted` (see `DEALER_PORTAL_SCOPE.md` schema sketch and `DEALER_SELF_SERVICE_P0_WORKFLOW.md` for the full lifecycle).
4. Submission appears in the appropriate `/admin/*` approval queue: `/admin/offers`, `/admin/dealers`, `/admin/ads`, `/admin/payments`, or `/admin/moderation`.
5. Internal Ops reviews → `approved` / `needs_revision` (with note) / `rejected`.
6. On `approved`, Master Admin (or authorized Ops) publishes → `status = published` and the data is live on the matching public surface.
7. On `needs_revision`, dealer sees the reviewer note in `/dealer/submissions` and revises.

Every status transition writes one audit-log row at `/admin/audit-log` (see `INTERNAL_ADMIN_MVP_SCOPE.md` section O).

### B. Admin manual upload

Used for: catalog data (brand / model / trim / specs / catalog prices), content (news, encyclopedia, Q&A), Bazar Nəbzi topics, ad placements (independent of dealer requests), invoices, dealer records (for dealers not yet on the portal), and any data the dealer cannot or should not own.

1. Master Admin / Internal Ops navigates to the relevant `/admin/*` route.
2. Creates or edits the record directly.
3. Publishes inline (or via Content Manager approval for editorial content) — no submission queue needed because the admin user is the source.
4. Audit-log row written.

### C. Fallback upload (WhatsApp / Email / Phone)

Used when: dealer is not yet onboarded to the portal, has portal access issues, or the relationship is too high-touch for self-service.

1. Dealer reaches Sales Manager via WhatsApp Business line / `dealer@zolaq.az` / phone.
2. Sales Manager transcribes the data into the admin Form (method B) **on the dealer's behalf**, attributing the submission to the dealer in the audit log.
3. From there it follows method B's flow (admin manual upload, published directly).

This is the only path that bypasses the dealer-submitted approval queue, and it exists because the manpower cost of refusing to accept WhatsApp data is higher than the cost of transcribing it. The audit log preserves attribution so Sales Manager can later encourage the dealer to migrate to method A.

## Per-data-type matrix

Columns: which method is **valid** for that data type. ✅ = primary; ☑ = supported; — = not applicable.

| Data type | A. Dealer self-service | B. Admin manual | C. Fallback | Reviewer | Approver | Public surface |
|---|---|---|---|---|---|---|
| Brand | — | ✅ | — | Ops Admin | Super Admin | catalog filters |
| Model | — | ✅ | — | Ops Admin | Super Admin | catalog filters |
| Trim | — | ✅ | — | Ops Admin | Super Admin | `/cars/[trim_id]` |
| Car specs | — | ✅ | — | Ops Admin | Super Admin | `/cars/[trim_id]` |
| Catalog price (`estimated` / `catalog_price`) | — | ✅ | — | Ops Admin | Super Admin | `/cars/[trim_id]` |
| Dealer profile (initial onboarding) | — | ✅ | ☑ | Ops Admin | Super Admin | `/dealers/[dealer_id]` |
| Dealer profile (edit) | ✅ | ☑ | ☑ | Ops Admin | Super Admin | `/dealers/[dealer_id]` |
| Dealer offer (`PriceRecord` with `dealer_id`) | ✅ | ☑ | ☑ | Ops Admin | Ops Admin | `/cars/[trim_id]`, `/dealers/[dealer_id]` |
| Car images (dealer-supplied) | ✅ | ☑ | ☑ | Ops Admin | Content Manager | car detail, catalog cards |
| Car images (manufacturer / editorial) | — | ✅ | — | Ops Admin | Content Manager | car detail, catalog cards |
| Dealer / showroom images | ✅ | ☑ | ☑ | Ops Admin | Content Manager | dealer detail |
| News article | — | ✅ | — | Ops Admin | Content Manager | `/news/[slug]` |
| Encyclopedia entry | — | ✅ | — | Ops Admin | Content Manager | `/encyclopedia/[slug]` |
| Q&A entry (editorial) | — | ✅ | — | Moderator | Content Manager | `/qa` |
| Q&A entry (customer-submitted) | — | — (customer flow) | — | Moderator | Content Manager | `/qa` |
| Q&A sponsored answer | ☑ (dealer ad-request) | ✅ | ☑ | Content Manager + Sales Manager | Content Manager | `/qa` |
| Bazar Nəbzi topic (organic) | — | ✅ | — | Moderator | Content Manager | `/qa` Bazar Nəbzi tab |
| Bazar Nəbzi topic (sponsored) | ☑ (dealer ad-request) | ✅ | ☑ | Content Manager + Moderator + Sales Manager | Content Manager | `/qa` Bazar Nəbzi tab |
| Bazar Nəbzi vote | — (Customer in-app) | — | — | — | — | aggregates only |
| Ad placement (organic-internal sales) | — | ✅ | — | Sales Manager | Content Manager + Sales Manager | per `AD_PLACEMENT_MAP.md` |
| Ad placement (dealer-requested) | ✅ | ☑ | ☑ | Sales Manager | Content Manager + Sales Manager | per `AD_PLACEMENT_MAP.md` |
| Sponsored placement creative + label | ✅ (uploaded with ad request) | ☑ | ☑ | Content Manager | Content Manager + Sales Manager | per placement surface |
| Campaign material | ✅ | ☑ | ☑ | Content Manager | Content Manager | per placement surface |
| Invoice | — | ✅ | — | Sales Manager | Sales Manager | `/dealer/invoices` (dealer-visible) |
| Payment proof | ✅ | ☑ | ☑ | Sales Manager | Sales Manager | none (internal) |
| Payment status transition (→ `paid`) | — | ✅ | — | Sales Manager | Sales Manager / Super Admin (high-value) | `/dealer/invoices` (dealer-visible) |
| Lead state transitions | — (Customer drives) | ✅ (Ops admin internal) | — | — | — | `/profile/leads/[leadId]` |
| Test-drive request | — (Customer creates) | ☑ (Ops can adjust) | — | Ops Admin | Ops Admin | `/profile/leads/[leadId]/test-drive`, `/dealer/test-drives` |

## P0 / P1 / P2 split by upload method

- **P0 (Sprint 8 launch):**
  - Method A: full `/dealer/*` portal with profile-edit, offer submission, image upload, campaign / ad request, payment-proof upload.
  - Method B: full `/admin/*` route group with all CRUD plus approval queues for method A submissions.
  - Method C: WhatsApp / Email / phone fallback continues; Sales Manager transcribes into method B.

- **P1 (Sprint 9):**
  - Dealer can withdraw `submitted` submissions before review.
  - Optional file-attachment for payment proof (PDF / image with virus scan).
  - Inline conflict notification for offer submissions (dealer sees same-trim price disagreements).
  - Email + WhatsApp notification on submission status changes.

- **P2 (post-MVP):**
  - Bulk import API for catalog + offers.
  - OEM datasheet sync.
  - Automated price refresh.
  - Programmatic ad-creative ingestion.
  - Dealer-side analytics on submission turnaround.

## Dealer onboarding flow (P0)

1. Dealer contacts Zolaq (call / email / WhatsApp).
2. Sales Manager creates record at `/admin/dealers`. Status = `pending` ([DealerVerificationStatus](../../lib/dealers/types.ts)).
3. Sales Manager collects: legal name, brands represented, address, working hours, services ([DealerService](../../lib/dealers/types.ts)), response SLA target.
4. Ops Admin verifies documents.
5. Super Admin / Ops Admin sets verification status to `official_dealer | verified_partner | premium_partner` or `rejected`.
6. Sales Manager issues first-login credentials to the dealer (initial password reset at first login).
7. Dealer logs in at `/dealer/login` → `/dealer/dashboard`.
8. Dealer profile is now public on `/dealers` and on each represented trim.

Full procedural detail in `DEALER_SELF_SERVICE_P0_WORKFLOW.md`.

## Dealer offer submission flow (P0 — method A)

1. Dealer goes to `/dealer/offers/new`.
2. Fills: trim_id, price, currency, `valid_until`, source, stock status.
3. Submits → `DealerSubmission.kind = "offer_new"`, `status = submitted`.
4. Submission appears in `/admin/offers` queue.
5. Ops Admin reviews → approves / `needs_revision` / rejects.
6. On approve → Ops or Super Admin publishes → `PriceRecord` created with `dealer_id`, `verified` flag set per source check. Submission `status = published`.

## Content publication flow (P0 — method B)

1. Editorial team creates draft at `/admin/content/news`, `/admin/content/encyclopedia`, or `/admin/content/qa`.
2. Ops Admin reviews factual accuracy.
3. Content Manager approves and publishes (`published_at` set).
4. For sponsored content: Sales Manager confirms invoice `paid` and Content Manager attaches `Sponsorlu` / `Reklam` label before publish.

## Bazar Nəbzi topic flow

See `MARKET_PULSE_MODULE.md` for the module concept, `PREDICTION_HISTORY_MODEL.md` for the schema, and `COMMUNITY_PREDICTION_RULES.md` for the status machine. Topic creation is method B (`/admin/market-pulse`). Sponsored topics may originate as a method A dealer ad-request that escalates to Sales Manager + Content Manager for topic authoring at `/admin/market-pulse`.

## "Where does it live" — quick reference

| Data | MVP file (Sprint 7) | Sprint 8 destination |
|---|---|---|
| Cars / trims / prices | `lib/cars/seed.ts`, `lib/cars/types.ts` | DB |
| Dealers | [lib/dealers/seed.ts](../../lib/dealers/seed.ts) | DB |
| Leads | [lib/leads/seed.ts](../../lib/leads/seed.ts) | DB |
| Content | [lib/content/seed.ts](../../lib/content/seed.ts) | DB |
| Decisions | derived from cars + leads | DB |
| Bazar Nəbzi topics | _(does not exist yet)_ | DB (new tables) |
| Ad placements | _(does not exist yet)_ | DB (new table) |
| Invoices / payments | _(does not exist yet)_ | DB (new table) |
| Audit log | per-lead timeline only ([LeadTimelineEvent](../../lib/leads/types.ts)) | DB (new global table) |
| Dealer submissions | _(does not exist yet)_ | DB (new table — `DealerSubmission` per `DEALER_PORTAL_SCOPE.md`) |

## Cross-references

- Approval roles per data type → `ROLE_PERMISSION_MATRIX.md`
- What internal admin must build to support these flows → `INTERNAL_ADMIN_MVP_SCOPE.md`
- Admin panel route inventory → `ADMIN_PANEL_ROUTE_MAP.md`
- Dealer panel route inventory + step-by-step flows → `DEALER_PANEL_ROUTE_MAP.md`, `DEALER_SELF_SERVICE_P0_WORKFLOW.md`
- Invoice status state machine + dealer-side view → `PAYMENT_INVOICE_FLOW.md`
- Ad-package catalog and dealer-side request flow → `ADS_REVENUE_MODEL.md`
- Bazar Nəbzi schema → `PREDICTION_HISTORY_MODEL.md`

## Not in Sprint 7

- Any of the three upload methods (admin panel, dealer portal, fallback transcription) — all built in Sprint 8.
- Bulk import or API import.
- Automated price refresh.
- Dealer-side analytics on submission turnaround.
