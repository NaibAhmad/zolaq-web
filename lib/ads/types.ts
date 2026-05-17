// Sprint 8E ad-request domain. Dealer or admin opens an AdRequest; admin
// reviews; once approved, an Invoice (lib/invoices) is issued; once paid, the
// campaign is activated. Ads must carry a visible label (`Sponsorlu | Reklam |
// Premium`) and cannot manipulate Zolaq Recommendation, official price, or
// Dealer Verification.

export const AD_PACKAGE_TYPES = [
  "verified_dealer_package",
  "premium_dealer_profile",
  "featured_dealer_placement",
  "featured_offer",
  "sponsored_catalog_card",
  "homepage_sponsored_block",
  "content_sponsorship",
  "compare_sponsored_offer",
  "qa_sponsored_answer",
  "bazar_nebzi_sponsored_question",
  "qualified_lead_package",
  "monthly_dealer_insight_report",
] as const;
export type AdPackageType = (typeof AD_PACKAGE_TYPES)[number];

export const AD_PLACEMENT_AREAS = [
  "homepage",
  "catalog",
  "car_detail",
  "compare",
  "dealer_list",
  "dealer_detail",
  "news_detail",
  "encyclopedia_detail",
  "qa",
  "market_pulse",
] as const;
export type AdPlacementArea = (typeof AD_PLACEMENT_AREAS)[number];

export const AD_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "invoice_required",
  "invoice_sent",
  "payment_uploaded",
  "paid",
  "approved",
  "active",
  "paused",
  "expired",
  "rejected",
  "cancelled",
] as const;
export type AdStatus = (typeof AD_STATUSES)[number];

export const AD_LABELS = ["Sponsorlu", "Reklam", "Premium"] as const;
export type AdLabel = (typeof AD_LABELS)[number];

export type AdRequest = {
  ad_request_id: string;
  dealer_id: string | null; // null for internal admin-initiated placements
  initiated_by: "dealer" | "admin";
  submitted_by: string; // contactName or admin name
  package_type: AdPackageType;
  placement: AdPlacementArea;
  label: AdLabel | null;
  status: AdStatus;
  campaign_note?: string;
  start_date?: string; // ISO yyyy-mm-dd
  end_date?: string; // ISO yyyy-mm-dd
  invoice_id?: string;
  review_note?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  activated_by?: string;
  activated_at?: number;
  paused_at?: number;
  expired_at?: number;
  created_at: number;
  updated_at: number;
};

export const AD_STATUSES_LIVE_OR_PENDING: readonly AdStatus[] = [
  "submitted",
  "under_review",
  "invoice_required",
  "invoice_sent",
  "payment_uploaded",
  "paid",
  "approved",
  "active",
  "paused",
];
