import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { filterTrims, type TrimFilters } from "@/lib/cars/lookup";
import { ENERGY_TYPES, type EnergyType } from "@/lib/cars/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const filters: TrimFilters = {};

  const brand = sp.get("brand");
  if (brand) filters.brand = brand;

  const energy = sp.get("energy_type");
  if (energy) {
    if ((ENERGY_TYPES as readonly string[]).includes(energy)) {
      filters.energy_type = energy as EnergyType;
    } else {
      // Unknown energy_type value → no matches; treat as filter miss, not error.
      return NextResponse.json({ trims: [] });
    }
  }

  const yearRaw = sp.get("year");
  if (yearRaw !== null) {
    if (!/^\d+$/.test(yearRaw)) {
      return errorJson(400, "VALIDATION_ERROR", "`year` must be an integer.", {
        field: "year",
      });
    }
    filters.year = Number.parseInt(yearRaw, 10);
  }

  const q = sp.get("q");
  if (q) filters.q = q;

  return NextResponse.json({ trims: filterTrims(filters) });
}
