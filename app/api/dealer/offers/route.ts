// Dealer offer creation. Always submitted as offer_create submission. Admin
// approval triggers applyApprovedSubmission which creates the canonical
// PriceRecord and flips offer_status to "published".

import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  parseBody,
  pick,
  pickNumber,
  requireDealerPermission,
  respond,
} from "@/lib/admin/api-utils";
import { getDealer, listPrices } from "@/lib/admin";
import { createSubmission } from "@/lib/dealer/submissions/store";
import type { Currency, StockStatus } from "@/lib/cars/types";

export async function GET(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.offer.view");
  if ("response" in auth) return auth.response;
  return NextResponse.json({
    offers: listPrices({ dealer_id: auth.session.dealerId, offers_only: true }),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.offer.create");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const trim_id = pick(body, "trim_id");
  const amount = pickNumber(body, "amount");
  const currency = (pick(body, "currency") as Currency | undefined) ?? "AZN";
  if (!trim_id || amount === undefined) {
    return NextResponse.json({ error: "trim_id and amount required" }, { status: 400 });
  }

  const dealer = getDealer(auth.session.dealerId);
  const payload: Record<string, unknown> = {
    trim_id,
    amount,
    currency,
    source_type: "official_dealer",
    source_name: dealer?.display_name ?? auth.session.dealerId,
    verification_status: "pending",
    status: "dealer_quote_pending",
    stock_status: (pick(body, "stock_status") as StockStatus | undefined) ?? "available",
    valid_until: pick(body, "valid_until") ?? null,
    notes: pick(body, "notes"),
  };

  const submission = createSubmission({
    dealer_id: auth.session.dealerId,
    kind: "offer_create",
    payload,
    submitted_by: auth.session.contactName,
  });
  audit(auth.session, {
    action: "offer.submit",
    entity_type: "submission",
    entity_id: submission.submission_id,
    after: { kind: "offer_create", payload },
  });
  return respond(request, { submission }, "/dealer/submissions");
}
