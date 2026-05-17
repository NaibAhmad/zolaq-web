import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { transitionInvoice } from "@/lib/invoices/store";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ invoiceId: string }> },
) {
  const auth = await requireAdmin(
    request,
    "super_admin",
    "internal_ops_admin",
    "sales_lead_manager",
  );
  if ("response" in auth) return auth.response;
  const { invoiceId } = await ctx.params;
  const body = await parseBody(request);
  const reason = pick(body, "note") ?? "";
  const result = transitionInvoice({
    id: invoiceId,
    to: "cancelled",
    actor: {
      actor_type: "admin",
      actor_id: auth.session.adminId,
      role: auth.session.role,
    },
    cancel_reason: reason,
    note: reason,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return respond(request, { invoice: result.row }, `/admin/invoices/${invoiceId}`);
}
