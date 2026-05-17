import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { reviewPaymentProof } from "@/lib/payments/store";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ paymentId: string }> },
) {
  const auth = await requireAdmin(
    request,
    "super_admin",
    "internal_ops_admin",
    "sales_lead_manager",
  );
  if ("response" in auth) return auth.response;
  const { paymentId } = await ctx.params;
  const body = await parseBody(request);
  const result = reviewPaymentProof({
    id: paymentId,
    to: "rejected",
    reviewer_id: auth.session.adminId,
    reviewer_role: auth.session.role,
    note: pick(body, "note") ?? "",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return respond(request, { payment_proof: result.row }, "/admin/payments");
}
