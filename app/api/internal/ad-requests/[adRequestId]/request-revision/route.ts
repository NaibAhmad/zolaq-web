import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { transitionAdStatus } from "@/lib/ads/store";

// "Request revision" keeps the request in `under_review` (or moves submitted →
// under_review) but writes an audit entry with the reviewer note so the dealer
// can see what to fix. The dealer's update path is gated to draft only.
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
  const note = pick(body, "note") ?? "";
  const result = transitionAdStatus({
    id: adRequestId,
    to: "under_review",
    actor: {
      actor_type: "admin",
      actor_id: auth.session.adminId,
      role: auth.session.role,
    },
    note,
    request_revision: true,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return respond(request, { ad_request: result.row }, `/admin/ads/${adRequestId}`);
}
