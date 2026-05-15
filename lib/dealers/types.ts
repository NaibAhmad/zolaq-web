// Dealer entity types. Verification enum follows the Sprint 4 spec
// (6 values, includes `premium_partner`) — supersedes the 5-value list in
// docs/reference Step 6 v2 DATA_MODEL_MVP.md. Dealer offers reuse PriceRecord
// from lib/cars/types (the existing seed records already carry every
// dealer-offer field), so there is no separate `DealerOffer` type here.

export type DealerVerificationStatus =
  | "official_dealer"
  | "verified_partner"
  | "premium_partner"
  | "pending"
  | "rejected"
  | "expired";

export const DEALER_VERIFICATION_STATUSES: readonly DealerVerificationStatus[] = [
  "official_dealer",
  "verified_partner",
  "premium_partner",
  "pending",
  "rejected",
  "expired",
];

export type DealerService =
  | "test_drive"
  | "trade_in"
  | "financing"
  | "delivery"
  | "warranty";

export type WorkingHoursRange = {
  days: string; // e.g. "Be-Cü" (Mon-Fri), "Ş" (Sat). UI-formatted; not parsed.
  open: string; // "HH:MM"
  close: string; // "HH:MM"
};

export type Dealer = {
  dealer_id: string;
  legal_name: string;
  display_name: string;
  verification_status: DealerVerificationStatus;
  represented_brands: string[]; // brand_id refs
  city: string;
  address: string;
  working_hours: WorkingHoursRange[];
  response_sla_hours: number;
  services: DealerService[];
  status: "active" | "inactive";
  source_name: string;
  updated_at: string; // ISO-8601
};
