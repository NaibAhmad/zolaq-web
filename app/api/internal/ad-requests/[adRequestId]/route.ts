import { NextResponse, type NextRequest } from "next/server";
import {
  parseBody,
  pick,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import { getAdRequest, updateAdRequest } from "@/lib/ads/store";
import {
  AD_LABELS,
  AD_PLACEMENT_AREAS,
  type AdLabel,
  type AdPlacementArea,
} from "@/lib/ads/types";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ adRequestId: string }> },
) {
  const { adRequestId } = await ctx.params;
  const row = getAdRequest(adRequestId);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ad_request: row });
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ adRequestId: string }> },
) {
  const auth = await requireAdmin(
    request,
    "super_admin",
    "internal_ops_admin",
    "sales_lead_manager",
  );
  if ("response" in auth) return auth.response;
  const { adRequestId } = await ctx.params;
  const body = await parseBody(request);
  const label = pick(body, "label") as AdLabel | undefined;
  const placement = pick(body, "placement") as AdPlacementArea | undefined;
  if (label && !AD_LABELS.includes(label)) {
    return NextResponse.json({ error: "invalid label" }, { status: 400 });
  }
  if (placement && !AD_PLACEMENT_AREAS.includes(placement)) {
    return NextResponse.json({ error: "invalid placement" }, { status: 400 });
  }
  try {
    const next = updateAdRequest(
      adRequestId,
      {
        ...(label !== undefined && { label }),
        ...(placement !== undefined && { placement }),
        ...(pick(body, "campaign_note") !== undefined && {
          campaign_note: pick(body, "campaign_note"),
        }),
        ...(pick(body, "start_date") !== undefined && {
          start_date: pick(body, "start_date"),
        }),
        ...(pick(body, "end_date") !== undefined && {
          end_date: pick(body, "end_date"),
        }),
      },
      {
        actor_type: "admin",
        actor_id: auth.session.adminId,
        role: auth.session.role,
      },
    );
    if (!next) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return respond(
      request,
      { ad_request: next },
      `/admin/ads/${adRequestId}`,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "LABEL_REQUIRED") {
      return NextResponse.json(
        { error: "label_required" },
        { status: 400 },
      );
    }
    throw e;
  }
}
