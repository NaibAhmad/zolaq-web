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

export type Trim = {
  trim_id: string;
  brand_id: string;
  model_name: string;
  year: number;
  display_name: string;
  energy_type: EnergyType;
  power_hp?: number;
  range_km?: number | null;
  image_url?: string | null;
  status: "active" | "inactive";
};

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
};
