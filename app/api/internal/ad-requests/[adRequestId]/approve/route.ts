import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getAdRequest, transitionAdStatus } from "@/lib/ads/store";

// Approve an ad request — moves it to `invoice_required` so Sales can issue
// an invoice next.
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
  const before = getAdRequest(adRequestId);
  if (!before) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // Two-step: if currently submitted, move to under_review first. If already
  // under_review, move to invoice_required.
  let to: "under_review" | "invoice_required" =
    before.status === "submitted" ? "under_review" : "invoice_required";
  if (before.status === "under_review") to = "invoice_required";
  const result = transitionAdStatus({
    id: adRequestId,
    to,
    actor: {
      actor_type: "admin",
      actor_id: auth.session.adminId,
      role: auth.session.role,
    },
    note: pick(body, "note"),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return respond(request, { ad_request: result.row }, `/admin/ads/${adRequestId}`);
}
