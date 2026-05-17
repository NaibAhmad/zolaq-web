import { NextResponse, type NextRequest } from "next/server";
import { requireDealerPermission } from "@/lib/admin/api-utils";
import { getAdRequestForDealer } from "@/lib/ads/store";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ adRequestId: string }> },
) {
  const auth = await requireDealerPermission(request, "dealer.invoice.view");
  if ("response" in auth) return auth.response;
  const { adRequestId } = await ctx.params;
  const row = getAdRequestForDealer(adRequestId, auth.session.dealerId);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ad_request: row });
}
