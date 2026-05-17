import { NextResponse, type NextRequest } from "next/server";
import {
  parseBody,
  pick,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import {
  createAdRequest,
  listAdRequests,
} from "@/lib/ads/store";
import {
  AD_PACKAGE_TYPES,
  AD_PLACEMENT_AREAS,
  AD_LABELS,
  type AdLabel,
  type AdPackageType,
  type AdPlacementArea,
} from "@/lib/ads/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(
    request,
    "super_admin",
    "internal_ops_admin",
    "sales_lead_manager",
  );
  if ("response" in auth) return auth.response;
  return NextResponse.json({ ad_requests: listAdRequests() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(
    request,
    "super_admin",
    "internal_ops_admin",
    "sales_lead_manager",
  );
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
      dealer_id: pick(body, "dealer_id") ?? null,
      initiated_by: "admin",
      submitted_by: auth.session.name,
      package_type,
      placement,
      label: label ?? null,
      campaign_note: pick(body, "campaign_note"),
      start_date: pick(body, "start_date"),
      end_date: pick(body, "end_date"),
      status: "draft",
    },
    {
      actor_type: "admin",
      actor_id: auth.session.adminId,
      role: auth.session.role,
    },
  );
  return respond(request, { ad_request: row }, `/admin/ads/${row.ad_request_id}`);
}
