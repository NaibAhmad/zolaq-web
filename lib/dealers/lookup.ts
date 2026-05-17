// Sprint 8B: public dealer/offer reads delegate to the admin stores so
// admin-created dealers and approved-published offers appear on the public
// site. Draft/submitted/rejected offers are filtered out by offer_status.

import {
  getOfferById as adminGetOfferById,
  listDealers,
  listPrices,
} from "@/lib/admin";
import type { PriceRecord } from "@/lib/cars/types";
import type { Dealer, DealerVerificationStatus } from "./types";

export function getAllDealers(): readonly Dealer[] {
  return listDealers();
}

export function getDealerById(dealerId: string): Dealer | null {
  return listDealers().find((d) => d.dealer_id === dealerId) ?? null;
}

function isPublishedOffer(p: PriceRecord): boolean {
  return p.dealer_id != null && p.offer_status === "published";
}

export function getOffersByDealerId(dealerId: string): PriceRecord[] {
  return listPrices({ dealer_id: dealerId }).filter(isPublishedOffer);
}

export function getOfferById(offerId: string): PriceRecord | null {
  const found = adminGetOfferById(offerId);
  return found && isPublishedOffer(found) ? found : null;
}

export type DealerFilters = {
  brand?: string;
  verification_status?: DealerVerificationStatus;
};

export function filterDealers(filters: DealerFilters): Dealer[] {
  return listDealers().filter((d) => {
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
