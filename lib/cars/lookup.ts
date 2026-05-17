// Server-side catalog reads. Delegates to the admin catalog store so
// admin-created brands/trims and approved-then-published dealer offers appear
// on the public site. Draft/submitted/rejected offers are filtered out via
// `offer_status`.
//
// Sprint 8H: extended with model/trim/body-type/price/dealer/availability/sort
// filters. The Marka→Model→Komplektasiya dependent-select helpers and
// getTrimName moved to lib/cars/client-lookup.ts so client components do NOT
// transitively pull the admin store (and its node:crypto dependency) into
// the browser bundle.

import { listBrands, listPrices, listTrims } from "@/lib/admin/catalog-store";
import { BRANDS, TRIMS } from "./seed";
import {
  isAvailabilityOption,
  isSortOption,
  type AvailabilityOption,
  type SortOption,
} from "./taxonomy";
import type { Brand, EnergyType, PriceRecord, Trim } from "./types";

export function getAllTrims(): readonly Trim[] {
  return listTrims();
}

export function getTrimById(trimId: string): Trim | null {
  return listTrims().find((t) => t.trim_id === trimId) ?? null;
}

export function getBrand(brandId: string): Brand | null {
  return listBrands().find((b) => b.brand_id === brandId) ?? null;
}

export function getPricesForTrim(trimId: string): PriceRecord[] {
  return listPrices({ trim_id: trimId }).filter(
    (p) => p.dealer_id == null || p.offer_status === "published",
  );
}

// Internal helper for catalog seed access (used by other internal modules
// that need the raw read-only seed shape, e.g. legacy lookups).
export const __SEED_BRANDS = BRANDS;
export const __SEED_TRIMS = TRIMS;

const STATUS_RANK: Record<PriceRecord["status"], number> = {
  dealer_official_offer: 0,
  dealer_quote_pending: 1,
  catalog_price: 2,
  estimated: 3,
  expired_offer: 4,
  conflict: 5,
  price_unknown: 6,
  not_available: 7,
};

function pickBestPrice(prices: PriceRecord[]): PriceRecord | null {
  if (prices.length === 0) return null;
  return [...prices].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  )[0];
}

function stockMatchesAvailability(
  stock: PriceRecord["stock_status"] | undefined,
  availability: AvailabilityOption,
): boolean {
  if (!stock) return false;
  if (availability === "in_stock") return stock === "available";
  if (availability === "order") return stock === "order";
  if (availability === "coming_soon") return stock === "coming_soon";
  return false;
}

export type TrimFilters = {
  brand?: string;
  model?: string;
  trim?: string;
  energy_type?: EnergyType;
  body_type?: string;
  year?: number;
  // Sprint 8H Correction v2: additive year-range filter. Combines AND with
  // exact `year` if both are sent — backward-compatible with old URLs.
  year_from?: number;
  year_to?: number;
  // Sprint 8H Correction v2: Nəsil filter (model generation/platform).
  generation?: string;
  // Sprint 8H Correction v2: Yürüş (range) bounds. Trims without range_km
  // are excluded once either bound is set.
  range_min?: number;
  range_max?: number;
  q?: string;
  price_min?: number;
  price_max?: number;
  dealer_verified?: boolean;
  availability?: AvailabilityOption;
  sort?: SortOption;
};

export type TrimSearchResult = {
  trim: Trim;
  best_price: PriceRecord | null;
};

export function filterTrims(filters: TrimFilters): Trim[] {
  return searchTrims(filters).map((r) => r.trim);
}

// Returns trims joined with their best published price so the catalog cards
// can render price + verification without a second roundtrip. Sort is applied
// here too.
export function searchTrims(filters: TrimFilters): TrimSearchResult[] {
  const q = filters.q?.toLowerCase();
  const candidates = listTrims().filter((t) => t.status === "active");

  const results: TrimSearchResult[] = [];
  for (const t of candidates) {
    if (filters.brand && t.brand_id !== filters.brand) continue;
    if (filters.model && t.model_name !== filters.model) continue;
    if (filters.trim && t.trim_id !== filters.trim) continue;
    if (filters.generation && t.generation_id !== filters.generation) continue;
    if (filters.energy_type && t.energy_type !== filters.energy_type) continue;
    if (filters.body_type && t.body_type !== filters.body_type) continue;
    if (filters.year !== undefined && t.year !== filters.year) continue;
    if (filters.year_from !== undefined && t.year < filters.year_from) continue;
    if (filters.year_to !== undefined && t.year > filters.year_to) continue;
    if (filters.range_min !== undefined) {
      if (t.range_km == null || t.range_km < filters.range_min) continue;
    }
    if (filters.range_max !== undefined) {
      if (t.range_km == null || t.range_km > filters.range_max) continue;
    }
    if (q) {
      const haystack = `${t.display_name} ${t.model_name}`.toLowerCase();
      if (!haystack.includes(q)) continue;
    }

    const prices = getPricesForTrim(t.trim_id);
    const best = pickBestPrice(prices);

    if (filters.price_min !== undefined) {
      if (!best || best.amount <= 0 || best.amount < filters.price_min) continue;
    }
    if (filters.price_max !== undefined) {
      if (!best || best.amount <= 0 || best.amount > filters.price_max) continue;
    }
    if (filters.dealer_verified) {
      const hasVerifiedDealer = prices.some(
        (p) =>
          p.source_type === "official_dealer" &&
          p.verification_status === "verified",
      );
      if (!hasVerifiedDealer) continue;
    }
    if (filters.availability) {
      const matches = prices.some((p) =>
        stockMatchesAvailability(p.stock_status, filters.availability!),
      );
      if (!matches) continue;
    }

    results.push({ trim: t, best_price: best });
  }

  return sortResults(results, filters.sort ?? "recommended");
}

function sortResults(
  results: TrimSearchResult[],
  sort: SortOption,
): TrimSearchResult[] {
  const copy = [...results];
  switch (sort) {
    case "price_asc":
      copy.sort((a, b) => priceFor(a) - priceFor(b));
      return copy;
    case "price_desc":
      copy.sort((a, b) => priceFor(b) - priceFor(a));
      return copy;
    case "year_desc":
      copy.sort((a, b) => b.trim.year - a.trim.year);
      return copy;
    case "year_asc":
      copy.sort((a, b) => a.trim.year - b.trim.year);
      return copy;
    case "recommended":
    default:
      // Verified dealer offers first, then year desc.
      copy.sort((a, b) => {
        const av = verifiedDealerScore(a);
        const bv = verifiedDealerScore(b);
        if (av !== bv) return bv - av;
        return b.trim.year - a.trim.year;
      });
      return copy;
  }
}

function priceFor(r: TrimSearchResult): number {
  if (!r.best_price || r.best_price.amount <= 0) return Number.POSITIVE_INFINITY;
  return r.best_price.amount;
}

function verifiedDealerScore(r: TrimSearchResult): number {
  if (!r.best_price) return 0;
  if (
    r.best_price.source_type === "official_dealer" &&
    r.best_price.verification_status === "verified"
  ) {
    return 2;
  }
  if (r.best_price.source_type === "official_dealer") return 1;
  return 0;
}

// Re-export taxonomy guards for the API route.
export { isAvailabilityOption, isSortOption };
