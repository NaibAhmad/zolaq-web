// Client-safe car lookup helpers for catalog dropdowns and trim display.
//
// Reads ONLY the typed-constants seed (lib/cars/seed.ts). MUST NOT import
// lib/admin/catalog-store.ts — that module is the mutable server-side store,
// uses Node-only APIs, and would break the client bundle.
//
// Canonical search results (which DO reflect admin edits) come from the
// server via GET /api/cars. These helpers are for synchronous select-options
// and trim-name derivation only.

import { BRANDS, TRIMS } from "./seed";
import type { Brand, Trim } from "./types";

export const CLIENT_BRANDS: readonly Brand[] = BRANDS;
export const CLIENT_TRIMS: readonly Trim[] = TRIMS;

// Trim "komplektasiya" suffix shown next to brand · model in cards / details
// / compare. display_name conventionally starts with "<Brand> <Model> ..."; the
// remainder is the komplektasiya.
export function getTrimName(trim: Trim, brandName: string): string {
  const head = `${brandName} ${trim.model_name}`;
  if (trim.display_name.startsWith(head)) {
    return trim.display_name.slice(head.length).trim();
  }
  if (trim.display_name.startsWith(trim.model_name)) {
    return trim.display_name.slice(trim.model_name.length).trim();
  }
  return trim.display_name;
}

// Distinct model names for a brand, used by Marka → Model dependent selects.
export function listModelsForBrand(brandId: string): string[] {
  const seen = new Set<string>();
  for (const t of TRIMS) {
    if (t.status !== "active") continue;
    if (t.brand_id !== brandId) continue;
    seen.add(t.model_name);
  }
  return Array.from(seen).sort();
}

// Trims for a model, optionally narrowed by year and/or generation, used by
// the Komplektasiya select. Returns raw seed rows so the UI can read
// display_name and trim_id.
export function listTrimsForModel(
  brandId: string,
  modelName: string,
  year?: number,
  generationId?: string,
): Trim[] {
  return TRIMS.filter((t) => {
    if (t.status !== "active") return false;
    if (t.brand_id !== brandId) return false;
    if (t.model_name !== modelName) return false;
    if (year !== undefined && t.year !== year) return false;
    if (generationId && t.generation_id !== generationId) return false;
    return true;
  });
}
