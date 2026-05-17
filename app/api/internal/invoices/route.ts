import { NextResponse, type NextRequest } from "next/server";
import {
  parseBody,
  pick,
  pickNumber,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import { getAdRequest, transitionAdStatus, updateAdRequest } from "@/lib/ads/store";
import { createInvoice, listInvoices, transitionInvoice } from "@/lib/invoices/store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(
    request,
    "super_admin",
    "internal_ops_admin",
    "sales_lead_manager",
  );
  if ("response" in auth) return auth.response;
  return NextResponse.json({ invoices: listInvoices() });
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
  const ad_request_id = pick(body, "ad_request_id");
  const amount = pickNumber(body, "amount");
  const due_at = pick(body, "due_at");
  const currency = (pick(body, "currency") as "AZN" | "USD" | "EUR") ?? "AZN";
  if (!ad_request_id || amount === undefined || !due_at) {
    return NextResponse.json(
      { error: "ad_request_id, amount, due_at required" },
      { status: 400 },
    );
  }
  const ad = getAdRequest(ad_request_id);
  if (!ad) {
    return NextResponse.json({ error: "ad_request_not_found" }, { status: 404 });
  }
  const inv = createInvoice({
    ad_request_id,
    dealer_id: ad.dealer_id,
    amount,
    currency,
    due_at,
    notes: pick(body, "notes"),
    created_by: auth.session.adminId,
    actor: { actor_id: auth.session.adminId, role: auth.session.role },
  });
  // Link invoice to ad request + advance ad status to invoice_sent.
  updateAdRequest(
    ad_request_id,
    { invoice_id: inv.invoice_id },
    {
      actor_type: "admin",
      actor_id: auth.session.adminId,
      role: auth.session.role,
    },
  );
  if (ad.status === "invoice_required" || ad.status === "under_review") {
    transitionAdStatus({
      id: ad_request_id,
      to: "invoice_required",
      actor: {
        actor_type: "admin",
        actor_id: auth.session.adminId,
        role: auth.session.role,
      },
    });
  }
  // Move invoice to invoice_sent right away — admin "creates" implies sending.
  const sent = transitionInvoice({
    id: inv.invoice_id,
    to: "invoice_sent",
    actor: {
      actor_type: "admin",
      actor_id: auth.session.adminId,
      role: auth.session.role,
    },
  });
  // Advance ad status to invoice_sent if currently invoice_required.
  if (ad.status === "invoice_required" || ad.status === "under_review") {
    transitionAdStatus({
      id: ad_request_id,
      to: "invoice_sent",
      actor: {
        actor_type: "admin",
        actor_id: auth.session.adminId,
        role: auth.session.role,
      },
    });
  }
  const finalRow = sent.ok ? sent.row : inv;
  return respond(
    request,
    { invoice: finalRow },
    `/admin/invoices/${inv.invoice_id}`,
  );
}
