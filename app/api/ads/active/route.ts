// Sprint 10H-UX: public read-only endpoint returning currently active sponsored
// placements for a given placement area. Used by <SponsoredSlot> on the
// homepage, catalog, and car detail. Returns only the fields needed for a
// labeled sponsorship card — never dealer-internal data, never pricing.

import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { listActivePlacements } from "@/lib/ads/store";
import { AD_PLACEMENT_AREAS, type AdPlacementArea } from "@/lib/ads/types";

function isPlacementArea(value: string): value is AdPlacementArea {
  return (AD_PLACEMENT_AREAS as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const area = request.nextUrl.searchParams.get("area");
  if (!area) {
    return errorJson(400, "VALIDATION_ERROR", "`area` parametri tələb olunur.", {
      field: "area",
    });
  }
  if (!isPlacementArea(area)) {
    return errorJson(400, "VALIDATION_ERROR", "`area` dəstəklənmir.", {
      field: "area",
    });
  }
  const rows = listActivePlacements(area).map((r) => ({
    ad_request_id: r.ad_request_id,
    label: r.label,
    package_type: r.package_type,
    campaign_note: r.campaign_note ?? null,
  }));
  return NextResponse.json({ placements: rows });
}
