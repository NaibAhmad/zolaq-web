import { NextResponse, type NextRequest } from "next/server";
import { listPrices } from "@/lib/admin";
import { requireDealerPermission } from "@/lib/admin/api-utils";
import { listLeadsForTrims } from "@/lib/leads/store";

export async function GET(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.lead.view_own");
  if ("response" in auth) return auth.response;
  const trimIds = Array.from(
    new Set(
      listPrices({ dealer_id: auth.session.dealerId, offers_only: true }).map(
        (o) => o.trim_id,
      ),
    ),
  );
  return NextResponse.json({ leads: listLeadsForTrims(trimIds) });
}
