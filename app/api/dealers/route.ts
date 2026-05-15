import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import {
  filterDealers,
  type DealerFilters,
} from "@/lib/dealers/lookup";
import {
  DEALER_VERIFICATION_STATUSES,
  type DealerVerificationStatus,
} from "@/lib/dealers/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const filters: DealerFilters = {};

  const brand = sp.get("brand");
  if (brand) filters.brand = brand;

  const verification = sp.get("verification_status");
  if (verification) {
    if (
      (DEALER_VERIFICATION_STATUSES as readonly string[]).includes(verification)
    ) {
      filters.verification_status = verification as DealerVerificationStatus;
    } else {
      return errorJson(
        400,
        "VALIDATION_ERROR",
        "`verification_status` dəyəri keçərsizdir.",
        { field: "verification_status" }
      );
    }
  }

  return NextResponse.json({ dealers: filterDealers(filters) });
}
