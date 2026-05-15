// Shared LeadTrimSummary builder. Extracted in Sprint 5 so saved/viewed/decision
// API routes can produce the same trim summary shape that /api/profile/leads
// already returns. Single canonical mapping of Trim → LeadTrimSummary.

import type { LeadTrimSummary } from "@/lib/leads/types";
import { getBrand, getTrimById } from "./lookup";

export function trimSummaryFor(trim_id: string): LeadTrimSummary {
  const trim = getTrimById(trim_id);
  if (!trim) {
    return {
      trim_id,
      brand_id: "",
      brand_name: "—",
      model_name: "—",
      display_name: trim_id,
      year: 0,
      energy_type: "ICE",
      image_url: null,
    };
  }
  const brand = getBrand(trim.brand_id);
  return {
    trim_id: trim.trim_id,
    brand_id: trim.brand_id,
    brand_name: brand?.name ?? trim.brand_id,
    model_name: trim.model_name,
    display_name: trim.display_name,
    year: trim.year,
    energy_type: trim.energy_type,
    image_url: trim.image_url ?? null,
  };
}
