import { DEALER_OFFERS, EXTRA_PRICES } from "@/lib/cars/seed";
import type { PriceRecord } from "@/lib/cars/types";
import { DEALERS } from "./seed";
import type { Dealer, DealerVerificationStatus } from "./types";

export function getAllDealers(): readonly Dealer[] {
  return DEALERS;
}

export function getDealerById(dealerId: string): Dealer | null {
  return DEALERS.find((d) => d.dealer_id === dealerId) ?? null;
}

// All offer-shaped PriceRecord rows. Pulls from both seed buckets so any
// dealer-scoped row (including EXTRA_PRICES rows with a dealer_id) is included.
function getAllDealerOffers(): readonly PriceRecord[] {
  const fromOffers = DEALER_OFFERS;
  const fromExtras = EXTRA_PRICES.filter((p) => p.dealer_id != null);
  return [...fromOffers, ...fromExtras];
}

export function getOffersByDealerId(dealerId: string): PriceRecord[] {
  return getAllDealerOffers().filter((o) => o.dealer_id === dealerId);
}

export function getOfferById(offerId: string): PriceRecord | null {
  return getAllDealerOffers().find((o) => o.offer_id === offerId) ?? null;
}

export type DealerFilters = {
  brand?: string;
  verification_status?: DealerVerificationStatus;
};

export function filterDealers(filters: DealerFilters): Dealer[] {
  return DEALERS.filter((d) => {
    if (filters.brand && !d.represented_brands.includes(filters.brand)) {
      return false;
    }
    if (
      filters.verification_status &&
      d.verification_status !== filters.verification_status
    ) {
      return false;
    }
    return true;
  });
}
