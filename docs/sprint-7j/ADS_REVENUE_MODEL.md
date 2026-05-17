# ADS_REVENUE_MODEL

## Goal

Define the **packages Zolaq can sell** at launch — what each one is, who buys it, where it appears, how long it runs, what label is required on it, and what report the buyer gets back. This doc is the catalog; `AD_PLACEMENT_MAP.md` is the placement-by-page rulebook; `PAYMENT_INVOICE_FLOW.md` is how the money is collected.

In MVP every package is **sold and configured manually** by Sales Manager. Every campaign goes live only after `payment_status = paid`. Every visible placement carries a clear label (`Sponsorlu` / `Reklam` / `Premium`) — see `SPONSORED_MARKET_QUESTION_RULES.md` and `AD_PLACEMENT_MAP.md`.

**Round 2 update.** Sprint 8 ships a **dealer-side request flow** at `/dealer/ad-requests` and `/dealer/campaigns`. The package catalog below is unchanged; what changes is that most ad orders now begin with a dealer submission rather than a Sales-Manager-authored order. Sales Manager still owns approvals, invoice issuance, and final go-live. See "Dealer-side request flow" section below.

## Common rules across all packages

- **Manual payment** in MVP (bank transfer; see `PAYMENT_INVOICE_FLOW.md`).
- **Admin approval required** — two-key approval where applicable: Content Manager for creative/labeling, Sales Manager for financial.
- **Visible label** required on every customer-facing placement: `Sponsorlu` for editorial-adjacent placements, `Reklam` for pure ad slots, `Premium` for dealer profile upgrades that are clearly part of the dealer's profile (not editorial).
- **Zolaq Recommendation independence**: no package can influence the recommendation algorithm. Recommended models stay merit-based. See `AD_PLACEMENT_MAP.md` for the visual-separation rule.
- **No hiding source/verification** — sponsored placements cannot mask a dealer's verification status, source attribution, or `valid_until` on offers.
- **Buyer reports**: every package includes a monthly report (volume / placement metrics; see "deliverable" column).

## Package catalog

### 1. Verified Dealer package
- **Placement:** Dealer's profile carries a "Verified Partner" / "Official Dealer" / "Premium Partner" badge (uses existing [DealerVerificationStatus](../../lib/dealers/types.ts)). Profile is included in `/dealers` listing.
- **Who buys:** Dealer.
- **Duration:** Annual subscription, manually renewed.
- **Label:** Trust badge — not labeled as ad. This is **not a sponsored placement** in the editorial sense; it is a paid verification level. The badge text itself is the label.
- **Approval:** Super Admin sets the verification status after documents are verified.
- **Visibility:** Always visible on dealer profile, dealer listing, and as a chip on offer cards.
- **Deliverable:** Monthly profile-view summary + lead summary (number, by trim, status mix).

### 2. Premium Dealer Profile
- **Placement:** Enhanced dealer profile: larger gallery, extended service description, embedded video block, priority placement within their city/brand filter on `/dealers`.
- **Who buys:** Dealer (typically `verified_partner` or `official_dealer` upgrading).
- **Duration:** Monthly / quarterly / annual.
- **Label:** `Premium` chip on the profile card in listing views.
- **Approval:** Sales Manager (financial) + Content Manager (gallery / copy review).
- **Visibility:** `/dealers`, dealer detail page, dealer chips on trim offer cards.
- **Deliverable:** Monthly Dealer Insight Report (see package 12).

### 3. Featured Dealer placement
- **Placement:** Pinned position on `/dealers` for a specific city, brand, or both. Also appears as a "Tövsiyə olunan diler" block on relevant trim detail pages.
- **Who buys:** Dealer.
- **Duration:** Weekly / monthly. Limited inventory (max N per city per period).
- **Label:** `Sponsorlu` chip on the pinned card.
- **Approval:** Sales Manager + Content Manager.
- **Visibility:** Always visually separated from organic listing (different background, label visible).
- **Deliverable:** Impression and click counts in monthly report.

### 4. Featured Offer
- **Placement:** Dealer's `PriceRecord` for a specific trim is pinned to the top of the offer list on `/cars/[trim_id]` and gets a `Sponsorlu` chip. Does not affect the Zolaq Recommendation displayed elsewhere on the page.
- **Who buys:** Dealer.
- **Duration:** Weekly / monthly per trim. Limited inventory.
- **Label:** `Sponsorlu` chip on the pinned offer card.
- **Approval:** Sales Manager + Content Manager.
- **Visibility:** Mandatory visual separation from organic offers (different border / background). Source and verification badges remain visible. `valid_until` remains visible.
- **Deliverable:** Lead volume attributed to the featured offer, monthly.

### 5. Sponsored Catalog Card
- **Placement:** Inline card slot within `/cars` listing. Looks visually distinct from organic cards.
- **Who buys:** Dealer or Advertiser (e.g. an insurance brand promoting a specific model bundle).
- **Duration:** Weekly / monthly. Limited inventory per filter combination.
- **Label:** `Reklam` chip in the top corner; card has different background and a footer line "Bu yer sponsorludur".
- **Approval:** Sales Manager + Content Manager.
- **Visibility:** Never replaces an organic card; always added. Sponsored card position is **fixed** (e.g. always position 4 in the grid) — never reordered to look like a recommendation.
- **Deliverable:** Impression + click counts, monthly.

### 6. Homepage Sponsored Block
- **Placement:** Dedicated sponsored block on the homepage, after the trust strip and before the catalog teaser — not inside any organic teaser. (Concrete placement coordinate: a new slot in [app/(public)/page.tsx](../../app/(public)/page.tsx), built in Sprint 8.)
- **Who buys:** Dealer / Advertiser / brand campaign.
- **Duration:** Weekly / monthly.
- **Label:** `Reklam` chip; clearly distinct block with "Bu yer sponsorludur" footer.
- **Approval:** Sales Manager + Content Manager + Super Admin.
- **Visibility:** Cannot impersonate organic blocks (HomeDecisionHelper, HomeContentTeaser, HomeDealerTeaser).
- **Deliverable:** Impression + click counts + onward-engagement, monthly.

### 7. Content Sponsorship
- **Placement:** Sponsored news article OR sponsored encyclopedia entry, listed alongside organic content with a banner. Sponsored author byline is shown.
- **Who buys:** Advertiser (e.g. insurance company sponsoring an encyclopedia entry on car insurance).
- **Duration:** Per-piece flat fee, hosted indefinitely with label.
- **Label:** Banner at the top of the article: "Bu məqalə [Sponsor adı] tərəfindən dəstəklənir — Sponsorlu". `Sponsorlu` chip on the listing card.
- **Approval:** Content Manager (editorial integrity, sources, factual accuracy) + Sales Manager (financial). Sponsor cannot suppress negative factual content.
- **Visibility:** Sponsored content carries the `Sponsorlu` chip everywhere it appears (listings, related-content sidebars, search results).
- **Deliverable:** View counts, average time-on-page, related-model click-through, monthly.

### 8. Compare Page Sponsored Offer
- **Placement:** On `/compare`, when the user is comparing trims, one sponsored offer can appear in the offer comparison column with a `Sponsorlu` chip. Does not replace organic offers shown.
- **Who buys:** Dealer.
- **Duration:** Weekly / monthly per trim.
- **Label:** `Sponsorlu` chip on the offer row in the compare table.
- **Approval:** Sales Manager + Content Manager.
- **Visibility:** Sponsored offer is visually separated and never affects the Zolaq Recommendation conclusion shown at the top of the compare result.
- **Deliverable:** Impression + click + lead counts, monthly.

### 9. Q&A Sponsored Answer / Expert Answer
- **Placement:** Specific Q&A entry on `/qa` carries a sponsored answer block from a named expert / sponsor.
- **Who buys:** Dealer / Advertiser / industry expert.
- **Duration:** Per-piece flat fee, hosted indefinitely.
- **Label:** `Sponsorlu` chip on the answer block. Sponsor name and credentials shown.
- **Approval:** Content Manager (factual review, sources) + Sales Manager (financial). Moderator reviews if user-flagged.
- **Visibility:** Organic answer (if any) remains visible. Sponsored answer is below the organic answer with clear visual separation.
- **Deliverable:** View counts, related-model click-through, monthly.

### 10. Bazar Nəbzi Sponsored Question
- **Placement:** One Bazar Nəbzi topic (daily / weekly / monthly) is sponsored, with the sponsor brand mentioned and a `Sponsorlu` chip. See `MARKET_PULSE_MODULE.md` and `SPONSORED_MARKET_QUESTION_RULES.md` for the integrity rules.
- **Who buys:** Dealer / Advertiser.
- **Duration:** One topic cycle (1 day / 1 week / 1 month).
- **Label:** `Sponsorlu` chip on the topic card. Sponsor name on the closed snapshot in history forever.
- **Approval:** Content Manager (wording, integrity) + Moderator (no manipulation) + Sales Manager (financial). Sponsor **cannot** modify final results or remove negative outcomes.
- **Visibility:** Sponsored topic shown on the homepage "Bazar nə deyir?" block only if no organic active topic is available, OR alongside one with clear sponsorship label. Never disguised as neutral content.
- **Deliverable:** Participant count, vote distribution, view counts.

### 11. Qualified Lead Package
- **Placement:** N/A (not a visible placement). Dealer commits to receiving a certain number of leads per month for one or more trims.
- **Who buys:** Dealer.
- **Duration:** Monthly subscription.
- **Label:** N/A.
- **Approval:** Sales Manager.
- **Visibility:** Internal only. Leads continue to flow through the existing [Lead](../../lib/leads/types.ts) state machine; Sales Manager monitors volume against commitment.
- **Deliverable:** Monthly summary: leads delivered, by trim, by `LeadState` distribution, response SLA performance.

### 12. Monthly Dealer Insight Report
- **Placement:** N/A. Emailed / WhatsApp'd to the dealer monthly.
- **Who buys:** Dealer (often bundled with Premium Profile or Featured Dealer).
- **Duration:** Monthly subscription.
- **Label:** N/A.
- **Approval:** Sales Manager.
- **Visibility:** Private to the dealer.
- **Deliverable:** Profile views, lead volume by trim, offer-to-test-drive conversion, response SLA performance, comparison-vs-peer-anonymized.

## Package summary table

| # | Package | Buyer | Cadence | Label | Approval |
|---|---|---|---|---|---|
| 1 | Verified Dealer | Dealer | Annual | Verification badge | Super Admin |
| 2 | Premium Dealer Profile | Dealer | Monthly+ | `Premium` | Sales + Content |
| 3 | Featured Dealer | Dealer | Weekly+ | `Sponsorlu` | Sales + Content |
| 4 | Featured Offer | Dealer | Weekly+ | `Sponsorlu` | Sales + Content |
| 5 | Sponsored Catalog Card | Dealer / Advertiser | Weekly+ | `Reklam` | Sales + Content |
| 6 | Homepage Sponsored Block | Dealer / Advertiser | Weekly+ | `Reklam` | Sales + Content + Super Admin |
| 7 | Content Sponsorship | Advertiser | Per-piece | `Sponsorlu` banner | Content + Sales |
| 8 | Compare Sponsored Offer | Dealer | Weekly+ | `Sponsorlu` | Sales + Content |
| 9 | Q&A Sponsored Answer | Dealer / Advertiser | Per-piece | `Sponsorlu` | Content + Sales |
| 10 | Bazar Nəbzi Sponsored Question | Dealer / Advertiser | Per topic | `Sponsorlu` | Content + Moderator + Sales |
| 11 | Qualified Lead Package | Dealer | Monthly | (internal) | Sales |
| 12 | Monthly Dealer Insight Report | Dealer | Monthly | (private) | Sales |

## Pricing

Pricing is **commercially decided** — not specified here. Sales Manager owns the rate card. The schema in `PAYMENT_INVOICE_FLOW.md` stores `amount` per order without requiring a fixed catalog price.

## Dealer-side request flow (P0, Sprint 8)

Dealers can request paid placements directly from the dealer portal. Packages eligible for dealer-initiated requests:

- Featured Dealer placement (#3)
- Featured Offer (#4)
- Sponsored Catalog Card (#5) — dealer-bought variant
- Homepage Sponsored Block (#6) — dealer-bought variant
- Content Sponsorship (#7) — typically advertiser, but dealer-eligible
- Compare Sponsored Offer (#8)
- Q&A Sponsored Answer (#9) — dealer-bought variant
- Bazar Nəbzi Sponsored Question (#10) — dealer-bought variant

The remaining packages (Verified Dealer #1, Premium Dealer Profile #2, Qualified Lead Package #11, Monthly Dealer Insight Report #12) are subscription / status products initiated by Sales Manager — no dealer-side request flow needed.

### Flow

1. **Dealer submits.** Dealer goes to `/dealer/ad-requests` (or `/dealer/campaigns` for non-paid promotional copy on own surfaces). Selects package, attaches creative + label preference + target window. Submits → `DealerSubmission.kind = "ad_placement_request"`, `status = submitted`.
2. **Sales + Ops review.** Submission appears in `/admin/ads` queue. Sales Manager reviews financial side (inventory availability, pricing); Content Manager reviews creative + label per `AD_PLACEMENT_MAP.md` rules. For Homepage Sponsored Block, Super Admin co-signs.
3. **Invoice issued.** Sales Manager creates the `Order` at `/admin/invoices` linking it to the placement(s). `Order.payment_status = invoice_sent` (see `PAYMENT_INVOICE_FLOW.md`).
4. **Dealer uploads payment proof.** Dealer goes to `/dealer/payment-proof`, references the invoice, submits free-text proof note. Dealer-side view shows `payment_uploaded`; canonical `Order.payment_status` still `invoice_sent`.
5. **Admin confirms.** Sales Manager (Super Admin co-signs above threshold) flips `Order.payment_status = paid` at `/admin/payments` after confirming the bank transfer.
6. **Final approval.** With `paid` + Content Manager creative approval (+ Super Admin for Homepage block), the linked `AdPlacement.status` flips to `active` within the campaign window.
7. **Campaign live.** Public surface renders the placement with the mandatory `Sponsorlu` / `Reklam` / `Premium` label per `AD_PLACEMENT_MAP.md`.

### Audit-log trail (one row per step)

```
ad_request_submitted          (dealer)
ad_request_reviewed            (sales_manager)
ad_request_approved             (content_manager + sales_manager [+ super_admin for #6])
order_created                  (sales_manager)
invoice_sent                   (sales_manager)
payment_proof_uploaded         (dealer)
payment_confirmed               (sales_manager / super_admin)
campaign_activated              (sales_manager)
campaign_deactivated            (sales_manager / super_admin) — at campaign end
```

### What the dealer can and cannot do in this flow

- **Can:** request any of the eligible packages; revise creative on `needs_revision`; cancel a request before invoice is issued; upload payment proof; view own campaign status.
- **Cannot:** approve own request; activate own campaign; remove the `Sponsorlu` / `Reklam` / `Premium` label; bypass the `paid` gate; modify final results of a Bazar Nəbzi sponsored topic; influence the Zolaq Recommendation; appear unlabeled on any sponsored surface.

### Where this is documented

- Submission lifecycle and reviewer-note interaction → `DEALER_SELF_SERVICE_P0_WORKFLOW.md` (workflow W7).
- Route inventory for `/dealer/ad-requests`, `/dealer/campaigns` → `DEALER_PANEL_ROUTE_MAP.md`.
- Admin queue at `/admin/ads` → `ADMIN_PANEL_ROUTE_MAP.md`.
- Placement labeling and surface rules → `AD_PLACEMENT_MAP.md`.
- Sponsored-topic integrity guardrails (applies to package #10) → `SPONSORED_MARKET_QUESTION_RULES.md`.
- Payment state machine and dealer-side view → `PAYMENT_INVOICE_FLOW.md`.

## Cross-references

- Per-page placement rules and prohibited slots → `AD_PLACEMENT_MAP.md`
- How money is collected and the dealer-side payment view → `PAYMENT_INVOICE_FLOW.md`
- Bazar Nəbzi integrity rules → `SPONSORED_MARKET_QUESTION_RULES.md`
- Roles that approve each package → `ROLE_PERMISSION_MATRIX.md`
- Sprint 8 admin tooling for ad-placement management → `INTERNAL_ADMIN_MVP_SCOPE.md`
- Dealer panel routes for ad/campaign requests → `DEALER_PANEL_ROUTE_MAP.md`
- Admin panel route at `/admin/ads` → `ADMIN_PANEL_ROUTE_MAP.md`
- Step-by-step dealer ad-request workflow → `DEALER_SELF_SERVICE_P0_WORKFLOW.md` (W7)

## Not in Sprint 7

- Any ad-serving code.
- Any pricing-table component.
- Any placement-rendering logic.
- The Homepage Sponsored Block component (built in Sprint 8).
