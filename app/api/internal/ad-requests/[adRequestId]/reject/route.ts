import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { transitionAdStatus } from "@/lib/ads/store";

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
  const reason = pick(body, "note") ?? "";
  const result = transitionAdStatus({
    id: adRequestId,
    to: "rejected",
    actor: {
      actor_type: "admin",
      actor_id: auth.session.adminId,
      role: auth.session.role,
    },
    rejection_reason: reason,
    note: reason,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return respond(request, { ad_request: result.row }, `/admin/ads/${adRequestId}`);
}
