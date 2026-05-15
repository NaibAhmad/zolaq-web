import {
  BRANDS,
  DEALER_OFFERS,
  EXTRA_PRICES,
  TRIMS,
} from "./seed";
import type { Brand, EnergyType, PriceRecord, Trim } from "./types";

export function getAllTrims(): readonly Trim[] {
  return TRIMS;
}

export function getTrimById(trimId: string): Trim | null {
  return TRIMS.find((t) => t.trim_id === trimId) ?? null;
}

export function getBrand(brandId: string): Brand | null {
  return BRANDS.find((b) => b.brand_id === brandId) ?? null;
}

export function getPricesForTrim(trimId: string): PriceRecord[] {
  const offers = DEALER_OFFERS.filter((p) => p.trim_id === trimId);
  const extras = EXTRA_PRICES.filter((p) => p.trim_id === trimId);
  return [...offers, ...extras];
}

export type TrimFilters = {
  brand?: string;
  energy_type?: EnergyType;
  year?: number;
  q?: string;
};

export function filterTrims(filters: TrimFilters): Trim[] {
  const q = filters.q?.toLowerCase();
  return TRIMS.filter((t) => {
    if (filters.brand && t.brand_id !== filters.brand) return false;
    if (filters.energy_type && t.energy_type !== filters.energy_type) return false;
    if (filters.year !== undefined && t.year !== filters.year) return false;
    if (q && !t.display_name.toLowerCase().includes(q)) return false;
    return true;
  });
}
