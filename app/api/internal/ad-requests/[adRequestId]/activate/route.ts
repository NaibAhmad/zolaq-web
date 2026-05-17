import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getAdRequest, transitionAdStatus } from "@/lib/ads/store";
import { getInvoice } from "@/lib/invoices/store";

// Activation guard: cannot flip to `active` unless the linked invoice (if any)
// is `paid`. Internal admin-initiated placements with no linked invoice are
// allowed to go straight to active for ops-managed inventory.
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
  const row = getAdRequest(adRequestId);
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (row.invoice_id) {
    const inv = getInvoice(row.invoice_id);
    if (!inv || inv.status !== "paid") {
      return NextResponse.json({ error: "invoice_not_paid" }, { status: 400 });
    }
  }
  const body = await parseBody(request);
  const result = transitionAdStatus({
    id: adRequestId,
    to: "active",
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
