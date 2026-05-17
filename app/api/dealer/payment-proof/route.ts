import { NextResponse, type NextRequest } from "next/server";
import {
  parseBody,
  pick,
  requireDealerPermission,
  respond,
} from "@/lib/admin/api-utils";
import { getInvoiceForDealer, transitionInvoice } from "@/lib/invoices/store";
import { listPaymentProofs, uploadPaymentProof } from "@/lib/payments/store";
import { getAdRequest, transitionAdStatus } from "@/lib/ads/store";

export async function GET(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.invoice.view");
  if ("response" in auth) return auth.response;
  return NextResponse.json({
    proofs: listPaymentProofs({ dealer_id: auth.session.dealerId }),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.payment_proof.upload");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const invoice_id = pick(body, "invoice_id");
  const reference = pick(body, "reference");
  if (!invoice_id || !reference) {
    return NextResponse.json(
      { error: "invoice_id and reference required" },
      { status: 400 },
    );
  }
  const inv = getInvoiceForDealer(invoice_id, auth.session.dealerId);
  if (!inv) {
    return NextResponse.json({ error: "invoice_not_found" }, { status: 404 });
  }
  if (inv.status !== "invoice_sent" && inv.status !== "overdue") {
    return NextResponse.json(
      { error: "invoice_not_open" },
      { status: 409 },
    );
  }
  const row = uploadPaymentProof({
    invoice_id,
    dealer_id: auth.session.dealerId,
    reference,
    uploaded_by: auth.session.contactName,
    file_ref: pick(body, "file_ref"),
    proof_note: pick(body, "proof_note"),
  });
  // Advance invoice to payment_uploaded and ad request mirror.
  transitionInvoice({
    id: invoice_id,
    to: "payment_uploaded",
    actor: {
      actor_type: "dealer",
      actor_id: auth.session.dealerId,
      role: "dealer",
    },
    payment_proof_id: row.payment_proof_id,
  });
  const ad = getAdRequest(inv.ad_request_id);
  if (ad && ad.status === "invoice_sent") {
    transitionAdStatus({
      id: ad.ad_request_id,
      to: "payment_uploaded",
      actor: {
        actor_type: "dealer",
        actor_id: auth.session.dealerId,
        role: "dealer",
      },
    });
  }
  return respond(
    request,
    { payment_proof: row },
    `/dealer/invoices/${invoice_id}`,
  );
}
