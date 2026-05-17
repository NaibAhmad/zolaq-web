import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import {
  getPaymentProof,
  reviewPaymentProof,
} from "@/lib/payments/store";
import { transitionInvoice, getInvoice } from "@/lib/invoices/store";
import { transitionAdStatus, getAdRequest } from "@/lib/ads/store";

// Approving a payment proof:
//   1. flips the proof row to `approved`
//   2. flips the linked invoice to `paid`
//   3. moves the originating ad request `paid` → (admin then activates).
//
// Activation is a separate explicit step so admins can stage start/end dates
// before going live.
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
  const before = getPaymentProof(paymentId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const result = reviewPaymentProof({
    id: paymentId,
    to: "approved",
    reviewer_id: auth.session.adminId,
    reviewer_role: auth.session.role,
    note: pick(body, "note"),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  // Flip invoice to paid.
  const inv = getInvoice(result.row.invoice_id);
  if (inv && inv.status !== "paid") {
    transitionInvoice({
      id: inv.invoice_id,
      to: "paid",
      actor: {
        actor_type: "admin",
        actor_id: auth.session.adminId,
        role: auth.session.role,
      },
    });
  }
  // Advance ad request to `paid` if applicable.
  if (inv) {
    const ad = getAdRequest(inv.ad_request_id);
    if (ad && (ad.status === "payment_uploaded" || ad.status === "invoice_sent")) {
      // If currently invoice_sent, first move to payment_uploaded for trail.
      if (ad.status === "invoice_sent") {
        transitionAdStatus({
          id: ad.ad_request_id,
          to: "payment_uploaded",
          actor: {
            actor_type: "admin",
            actor_id: auth.session.adminId,
            role: auth.session.role,
          },
        });
      }
      transitionAdStatus({
        id: ad.ad_request_id,
        to: "paid",
        actor: {
          actor_type: "admin",
          actor_id: auth.session.adminId,
          role: auth.session.role,
        },
      });
    }
  }
  return respond(request, { payment_proof: result.row }, "/admin/payments");
}
