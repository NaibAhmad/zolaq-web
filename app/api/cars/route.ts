import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import {
  isAvailabilityOption,
  isSortOption,
  searchTrims,
  type TrimFilters,
} from "@/lib/cars/lookup";
import { isBodyType } from "@/lib/cars/taxonomy";
import { ENERGY_TYPES, type EnergyType } from "@/lib/cars/types";

function parseNonNegativeInt(
  raw: string,
  field: string,
): { ok: true; value: number } | { ok: false; res: NextResponse } {
  if (!/^\d+$/.test(raw)) {
    return {
      ok: false,
      res: errorJson(400, "VALIDATION_ERROR", `\`${field}\` must be an integer.`, {
        field,
      }),
    };
  }
  return { ok: true, value: Number.parseInt(raw, 10) };
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const filters: TrimFilters = {};

  const brand = sp.get("brand");
  if (brand) filters.brand = brand;

  const model = sp.get("model");
  if (model) filters.model = model;

  const trim = sp.get("trim");
  if (trim) filters.trim = trim;

  const generation = sp.get("generation");
  if (generation) filters.generation = generation;

  const energy = sp.get("energy_type");
  if (energy) {
    if ((ENERGY_TYPES as readonly string[]).includes(energy)) {
      filters.energy_type = energy as EnergyType;
    } else {
      return NextResponse.json({ trims: [], results: [] });
    }
  }

  const bodyType = sp.get("body_type");
  if (bodyType) {
    if (isBodyType(bodyType)) {
      filters.body_type = bodyType;
    } else {
      return NextResponse.json({ trims: [], results: [] });
    }
  }

  const yearRaw = sp.get("year");
  if (yearRaw !== null) {
    const parsed = parseNonNegativeInt(yearRaw, "year");
    if (!parsed.ok) return parsed.res;
    filters.year = parsed.value;
  }

  const yearFromRaw = sp.get("year_from");
  if (yearFromRaw !== null) {
    const parsed = parseNonNegativeInt(yearFromRaw, "year_from");
    if (!parsed.ok) return parsed.res;
    filters.year_from = parsed.value;
  }

  const yearToRaw = sp.get("year_to");
  if (yearToRaw !== null) {
    const parsed = parseNonNegativeInt(yearToRaw, "year_to");
    if (!parsed.ok) return parsed.res;
    filters.year_to = parsed.value;
  }

  const rangeMinRaw = sp.get("range_min");
  if (rangeMinRaw !== null) {
    const parsed = parseNonNegativeInt(rangeMinRaw, "range_min");
    if (!parsed.ok) return parsed.res;
    filters.range_min = parsed.value;
  }

  const rangeMaxRaw = sp.get("range_max");
  if (rangeMaxRaw !== null) {
    const parsed = parseNonNegativeInt(rangeMaxRaw, "range_max");
    if (!parsed.ok) return parsed.res;
    filters.range_max = parsed.value;
  }

  const priceMinRaw = sp.get("price_min");
  if (priceMinRaw !== null) {
    const parsed = parseNonNegativeInt(priceMinRaw, "price_min");
    if (!parsed.ok) return parsed.res;
    filters.price_min = parsed.value;
  }

  const priceMaxRaw = sp.get("price_max");
  if (priceMaxRaw !== null) {
    const parsed = parseNonNegativeInt(priceMaxRaw, "price_max");
    if (!parsed.ok) return parsed.res;
    filters.price_max = parsed.value;
  }

  const dealerVerified = sp.get("dealer_verified");
  if (dealerVerified === "1" || dealerVerified === "true") {
    filters.dealer_verified = true;
  }

  const availability = sp.get("availability");
  if (availability) {
    if (isAvailabilityOption(availability)) {
      filters.availability = availability;
    } else {
      return NextResponse.json({ trims: [], results: [] });
    }
  }

  const sort = sp.get("sort");
  if (sort) {
    if (isSortOption(sort)) {
      filters.sort = sort;
    } else {
      return NextResponse.json({ trims: [], results: [] });
    }
  }

  const q = sp.get("q");
  if (q) filters.q = q;

  const results = searchTrims(filters);
  return NextResponse.json({
    trims: results.map((r) => r.trim),
    results,
  });
}
