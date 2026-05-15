import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getTrimById } from "@/lib/cars/lookup";
import { getDealerById, getOfferById } from "@/lib/dealers/lookup";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ offerId: string }> }
) {
  const { offerId } = await context.params;
  const offer = getOfferById(offerId);
  if (!offer) {
    return errorJson(404, "NOT_FOUND", "Təklif tapılmadı.", { offerId });
  }

  const dealer = offer.dealer_id ? getDealerById(offer.dealer_id) : null;
  const trim = getTrimById(offer.trim_id);

  return NextResponse.json({ offer, dealer, trim });
}
