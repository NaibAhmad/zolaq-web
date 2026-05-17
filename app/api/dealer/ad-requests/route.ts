import { NextResponse, type NextRequest } from "next/server";
import {
  parseBody,
  pick,
  requireDealerPermission,
  respond,
} from "@/lib/admin/api-utils";
import { createAdRequest, listAdRequests } from "@/lib/ads/store";
import {
  AD_LABELS,
  AD_PACKAGE_TYPES,
  AD_PLACEMENT_AREAS,
  type AdLabel,
  type AdPackageType,
  type AdPlacementArea,
} from "@/lib/ads/types";

export async function GET(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.invoice.view");
  if ("response" in auth) return auth.response;
  return NextResponse.json({
    ad_requests: listAdRequests({ dealer_id: auth.session.dealerId }),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.ad_request.create");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const package_type = pick(body, "package_type") as AdPackageType | undefined;
  const placement = pick(body, "placement") as AdPlacementArea | undefined;
  const label = pick(body, "label") as AdLabel | undefined;
  if (
    !package_type ||
    !AD_PACKAGE_TYPES.includes(package_type) ||
    !placement ||
    !AD_PLACEMENT_AREAS.includes(placement)
  ) {
    return NextResponse.json(
      { error: "package_type and placement required" },
      { status: 400 },
    );
  }
  if (label && !AD_LABELS.includes(label)) {
    return NextResponse.json({ error: "invalid label" }, { status: 400 });
  }
  const row = createAdRequest(
    {
      dealer_id: auth.session.dealerId,
      initiated_by: "dealer",
      submitted_by: auth.session.contactName,
      package_type,
      placement,
      label: label ?? null,
      campaign_note: pick(body, "campaign_note"),
      start_date: pick(body, "start_date"),
      end_date: pick(body, "end_date"),
      // Dealer-submitted requests bypass the `draft` state — they enter the
      // admin queue as `submitted` immediately.
      status: "submitted",
    },
    {
      actor_type: "dealer",
      actor_id: auth.session.dealerId,
      role: "dealer",
    },
  );
  return respond(
    request,
    { ad_request: row },
    `/dealer/ad-requests/${row.ad_request_id}`,
  );
}
