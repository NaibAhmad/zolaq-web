// Cars/Trims/Prices types. Enum values mirror docs/reference Step 6 v2
// BACKEND_ENUMS.json exactly. `trim_id` is the canonical vehicle reference
// (DATA_MODEL_MVP.md §Core rule); `carId` in UI routes is a view alias.

export type Currency = "AZN" | "USD" | "CNY";

export type EnergyType = "EV" | "PHEV" | "EREV" | "HEV" | "ICE";

export type StockStatus = "available" | "order" | "not_available" | "coming_soon";

export type SourceType =
  | "official_dealer"
  | "catalog"
  | "partner"
  | "estimate"
  | "zolaq_manual"
  | "imported";

export type VerificationStatus =
  | "unverified"
  | "verified"
  | "pending"
  | "conflict"
  | "outdated";

export type PriceStatus =
  | "estimated"
  | "catalog_price"
  | "dealer_quote_pending"
  | "dealer_official_offer"
  | "expired_offer"
  | "conflict"
  | "price_unknown"
  | "not_available";

export const ENERGY_TYPES: readonly EnergyType[] = [
  "EV",
  "PHEV",
  "EREV",
  "HEV",
  "ICE",
];

export type Brand = {
  brand_id: string;
  name: string;
  country?: string;
  status: "active" | "inactive";
};

// Sprint 8B: explicit Model entity for admin management. Existing Trim seed
// records (model_name + brand_id) imply a Model — the admin store derives
// these on load so the public catalog reads keep working unchanged.
export type Model = {
  model_id: string;
  brand_id: string;
  name: string;
  body_type?: string;
  status: "active" | "inactive";
};

export type Trim = {
  trim_id: string;
  brand_id: string;
  model_name: string;
  year: number;
  display_name: string;
  energy_type: EnergyType;
  // Sprint 8H: optional kuzov tipi (body type). Safe additive field — older
  // records without it simply skip the body_type filter.
  body_type?: string;
  // Sprint 8H Correction v2: optional generation (Nəsil) link. Distinct from
  // trim/komplektasiya — represents the model platform code (G05, XV80, NX4).
  // Trims without it fall through every generation-narrowing read.
  generation_id?: string | null;
  power_hp?: number;
  range_km?: number | null;
  image_url?: string | null;
  status: "active" | "inactive";
};

// Sprint 8H Correction v2: model generation / nəsil. Linked to a model by
// (brand_id, model_name) to match how Trim already references its model
// (Trim has no model_id — see comment on Model above).
export type Generation = {
  generation_id: string;
  brand_id: string;
  model_name: string;
  name: string;
  display_name: string;
  production_year_from: number;
  production_year_to?: number | null;
  status: "active" | "inactive";
};

// Sprint 8A: workflow status applied only to dealer-submitted offers. Catalog
// prices (no dealer_id) leave it undefined. Public reads filter to "published".
export const OFFER_STATUSES = [
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

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export function isOfferStatus(value: unknown): value is OfferStatus {
  return (
    typeof value === "string" &&
    (OFFER_STATUSES as readonly string[]).includes(value)
  );
}

export type PriceRecord = {
  // Required for every price card per PRICE_STATUS_TAXONOMY
  trim_id: string;
  amount: number;
  currency: Currency;
  status: PriceStatus;
  source_type: SourceType;
  source_name: string;
  verification_status: VerificationStatus;
  last_updated: string; // ISO-8601

  // Dealer-offer fields (required when the record is a dealer offer)
  offer_id?: string;
  dealer_id?: string;
  stock_status?: StockStatus;
  valid_from?: string;
  valid_until?: string | null;
  included_fees?: string[];
  excluded_fees?: string[];
  signed_pdf_url?: string | null;

  // Sprint 8A workflow fields (applicable to dealer offers; existing seed
  // defaults to "published" when read through the offer store). Public site
  // filters by offer_status === "published" so draft/rejected never leak.
  offer_status?: OfferStatus;
  submitted_by?: string; // dealer contact name or admin id
  reviewed_by?: string; // admin id
  review_note?: string;
  published_at?: string; // ISO-8601
  notes?: string; // free-form dealer-facing note on the offer
};
