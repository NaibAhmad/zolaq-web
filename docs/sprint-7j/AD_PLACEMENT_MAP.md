# AD_PLACEMENT_MAP

## Goal

Map every public page in the app to the ad slots it allows, the slots it prohibits, and the labels required. This document protects the Zolaq Recommendation from being manipulated by paid placements and protects user trust by making sponsored content unmistakable.

`ADS_REVENUE_MODEL.md` is the catalog of packages. This doc is the placement rulebook that constrains where each package may appear.

## Universal rules (apply to every placement)

1. **Sponsored content must be clearly labeled.** `Sponsorlu`, `Reklam`, or `Premium` per `ADS_REVENUE_MODEL.md`. The label is **not** decorative — removing it or making it visually de-emphasized is a launch blocker.
2. **Ads must not manipulate Zolaq Recommendation.** The recommendation algorithm has no awareness of paid placements. The "Zolaq tövsiyəsi" badge appears only on merit-ranked content.
3. **Sponsored offer and Zolaq Recommendation must be visually separate.** Distinct background color, distinct border, distinct position. A user must be able to identify which is which at a glance.
4. **Ads must not hide source / verification status.** [DealerVerificationStatus](../../lib/dealers/types.ts) chips and source attribution remain visible on every sponsored offer/dealer placement.
5. **Sponsored dealer placement must not look like neutral ranking.** Pinned positions are visually distinct and labeled.
6. **User trust is more important than ad revenue.** When a placement design has any ambiguity between commercial benefit and user trust, the design that protects trust wins. Sales Manager cannot override this — Content Manager and Super Admin own this rule.
7. **Bazar Nəbzi rules** (see `SPONSORED_MARKET_QUESTION_RULES.md`): sponsor cannot edit results, cannot remove negative outcomes, cannot hide sponsor name, cannot influence the Zolaq market summary on the closed snapshot.

## Per-page placement map

Each page below lists: **allowed slots**, **prohibited slots**, **labeling**. Implementation lives in Sprint 8 — Sprint 7 changes no public UI.

### Homepage — [app/(public)/page.tsx](../../app/(public)/page.tsx)
- **Allowed:**
  - Homepage Sponsored Block (one slot, between HomeTrustStrip and HomeCatalogTeaser) — `Reklam`.
  - Featured Dealer cards inside HomeDealerTeaser — clearly labeled `Sponsorlu` on the card.
  - Bazar Nəbzi sponsored question inside the "Bazar nə deyir?" preview block (Sprint 8 addition) — `Sponsorlu` chip on the question card.
- **Prohibited:**
  - Ad styling that impersonates HomeDecisionHelper or HomeContentTeaser.
  - Sponsored card inside HomeContentTeaser without a `Sponsorlu` banner identical to package #7 styling.
  - Sponsored Bazar Nəbzi topic shown without label.
- **Labeling:** `Reklam` for the dedicated block; `Sponsorlu` for everything else.

### Catalog — `/cars`
- **Allowed:**
  - Sponsored Catalog Card at a fixed grid position (e.g. position 4 and 12), each with `Reklam` chip + footer "Bu yer sponsorludur".
  - Featured Offer surfacing through a trim card's chip (if the trim has a sponsored offer).
- **Prohibited:**
  - Reordering organic cards based on paid status.
  - Suppressing organic cards in favor of sponsored ones.
  - Sponsored card in position 1 (top of grid).
- **Labeling:** `Reklam` on sponsored cards; `Sponsorlu` on featured-offer chips.

### Car detail — `/cars/[trim_id]`
- **Allowed:**
  - Featured Offer pinned at the top of the offer list with `Sponsorlu` chip.
  - "Tövsiyə olunan diler" block (Featured Dealer placement) in the sidebar with `Sponsorlu` chip.
- **Prohibited:**
  - Hiding the Zolaq tövsiyəsi for that trim because a sponsored offer outbid it.
  - Hiding the `valid_until`, source, or verification chip on a sponsored offer.
  - Inserting a sponsored offer that has no `valid_until` — every offer, sponsored or organic, must have one.
  - Sponsored offer overwriting a `conflict` or `verified` badge.
- **Labeling:** `Sponsorlu` chip on the pinned offer card, with same visual treatment as organic dealer chips but with the sponsored label clearly placed.

### Compare — `/compare`
- **Allowed:**
  - One Compare Sponsored Offer per compared trim — appears as a labeled row in the offer comparison table with `Sponsorlu`.
- **Prohibited:**
  - Sponsored offer influencing the "Zolaq nəticəsi" / recommendation conclusion shown at the top of the page.
  - Reordering compare columns based on paid status.
- **Labeling:** `Sponsorlu` chip on the sponsored offer row.

### Dealer list — `/dealers`
- **Allowed:**
  - Featured Dealer pinned at the top of city/brand filter views, with `Sponsorlu` chip.
  - Premium Dealer Profile cards rendered with enhanced visuals + `Premium` chip.
  - Verified Dealer badge per dealer card (this is part of the verification status, not a sponsored placement).
- **Prohibited:**
  - Reordering organic dealers below the featured one such that organic ranking becomes unclear.
  - Hiding the verification status of an organic dealer to make a sponsored one look more credible.
- **Labeling:** `Sponsorlu` for Featured Dealer; `Premium` for Premium Profile; verification badge per the [DealerVerificationStatus](../../lib/dealers/types.ts) enum for verification level.

### News detail — `/news/[slug]`
- **Allowed:**
  - Content Sponsorship banner at the top: "Bu məqalə [Sponsor adı] tərəfindən dəstəklənir — Sponsorlu".
  - Related-content sidebar may show one sponsored news/encyclopedia entry with `Sponsorlu` chip.
- **Prohibited:**
  - Sponsor editorial control over factual claims.
  - Removing the `Sponsorlu` chip from listings even when the article is shown standalone.
  - Sponsor suppressing references to competitors.
- **Labeling:** Top-of-article banner + `Sponsorlu` chip on the listing card everywhere it appears.

### Encyclopedia detail — `/encyclopedia/[slug]`
- **Allowed:**
  - Same as news: Content Sponsorship banner + sponsored related-content card.
- **Prohibited:**
  - Sponsor editing `stats` or `source` fields ([EncyclopediaEntry](../../lib/content/types.ts)) to favor their product.
  - Hiding the `verified` flag on encyclopedia sources because a sponsor doesn't want the contrast.
- **Labeling:** Same as news.

### Q&A — `/qa` and individual Q&A entries
- **Allowed:**
  - Q&A Sponsored Answer / Expert Answer block per `ADS_REVENUE_MODEL.md` package #9.
  - Bazar Nəbzi tab — sponsored topics labeled `Sponsorlu` (per `SPONSORED_MARKET_QUESTION_RULES.md`).
- **Prohibited:**
  - Sponsored answer above the organic answer when both exist.
  - Sponsored answer presented without sponsor identity.
  - Sponsored Bazar Nəbzi topic that lacks the `Sponsorlu` chip.
- **Labeling:** `Sponsorlu` chip on every sponsored answer / topic.

### Bazar Nəbzi / community prediction block — homepage preview + `/qa` Bazar Nəbzi tab
- **Allowed:**
  - Sponsored topics on the homepage preview, **only with `Sponsorlu` chip**.
  - Sponsored topics in the `/qa` Bazar Nəbzi tab, **only with `Sponsorlu` chip**.
- **Prohibited:**
  - Sponsored topic displayed without label.
  - Sponsor named only in a tooltip or far-from-headline location.
  - Sponsor manipulating the final outcome or Zolaq market summary on the closed snapshot.
  - Sponsored topic counted in "trending topics" rankings as if it were organic.
- **Labeling:** `Sponsorlu` chip on the topic card; sponsor name on the open topic; sponsor name preserved on the closed historical snapshot.

### Profile / Decision Center — `/profile/decisions`, `/profile/leads/[leadId]`, `/profile/saved`, `/profile/viewed`, `/profile/history`
- **Allowed (with strong restraint):**
  - Non-intrusive contextual ads only — e.g. an insurance offer chip on a decision summary view, labeled `Reklam`.
  - No ad placement on `/profile/leads/[leadId]` detail or its child pages (`test-drive`, `whatsapp`) — these are private lead pages.
- **Prohibited:**
  - Any ad in lead detail pages.
  - Any ad that uses user-specific lead data to target placements (in MVP no targeting at all — placements are by surface only).
  - Any ad that interferes with the next-best-action recommendation on the Decision Center.
- **Labeling:** `Reklam` chip if any ad appears.

## Visual-separation rules (applies wherever organic + sponsored content coexist)

- Distinct background (lighter or different hue from organic).
- Distinct border (e.g. dashed or different color).
- Label chip placed in a consistent corner of the card.
- "Bu yer sponsorludur" footer or equivalent secondary label on full-block ads.
- Sponsored placement cannot inherit organic placement's "Zolaq tövsiyəsi" treatment.

## Inventory limits (Sprint 8 — for context only)

- Catalog: max 2 sponsored cards per filter combination.
- Car detail: max 1 Featured Offer per trim.
- `/dealers`: max 3 Featured Dealer pins per city+brand combination.
- Compare: max 1 Compare Sponsored Offer per trim.
- Homepage Sponsored Block: 1 slot total.
- Bazar Nəbzi: max 1 sponsored topic per cadence band (daily / weekly / monthly).

## What a sponsored placement record looks like (schema sketch for Sprint 8)

```ts
// lib/ads/types.ts (Sprint 8)
export const AD_SURFACES = [
  "homepage_sponsored_block",
  "catalog_sponsored_card",
  "car_detail_featured_offer",
  "compare_sponsored_offer",
  "dealers_featured_dealer",
  "dealers_premium_profile",
  "content_news_sponsored",
  "content_encyclopedia_sponsored",
  "qa_sponsored_answer",
  "bazar_nebzi_sponsored_topic",
  "profile_decision_contextual",
] as const;

export type AdSurface = (typeof AD_SURFACES)[number];

export const AD_LABELS = ["Sponsorlu", "Reklam", "Premium"] as const;
export type AdLabel = (typeof AD_LABELS)[number];

export const AD_PLACEMENT_STATUSES = [
  "draft",
  "approved",
  "active",
  "paused",
  "ended",
  "rejected",
] as const;

export type AdPlacementStatus = (typeof AD_PLACEMENT_STATUSES)[number];

export type AdPlacement = {
  placement_id: string;
  surface: AdSurface;
  target_id?: string;            // trim_id / dealer_id / content_id / topic_id, depending on surface
  buyer_kind: "dealer" | "advertiser";
  buyer_id: string;
  order_id: string;              // links to PAYMENT_INVOICE_FLOW.md Order
  label: AdLabel;
  status: AdPlacementStatus;
  start_at: number;
  end_at: number;
  creative_ref?: string;         // file-store ref for image/copy
  approval_content_manager_at?: number;
  approval_sales_manager_at?: number;
  approval_super_admin_at?: number;   // homepage block only
  created_at: number;
  updated_at: number;
};
```

## Cross-references

- Package catalog → `ADS_REVENUE_MODEL.md`
- Payment status gate (campaign activates only on `paid`) → `PAYMENT_INVOICE_FLOW.md`
- Bazar Nəbzi sponsored-topic integrity → `SPONSORED_MARKET_QUESTION_RULES.md`
- Approval roles → `ROLE_PERMISSION_MATRIX.md`
- Admin tooling for placement CRUD → `INTERNAL_ADMIN_MVP_SCOPE.md`

## Not in Sprint 7

- Any placement-rendering component.
- Any reordering of existing organic content.
- Any visual change to the homepage, catalog, car detail, compare, dealers, content, Q&A, or profile pages.
