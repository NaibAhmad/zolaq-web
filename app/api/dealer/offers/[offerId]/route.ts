// Dealer offer updates also go through the submission queue (offer_update
// submission with target_id = offer_id). Approval applies the patch.

import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  parseBody,
  pick,
  pickNumber,
  requireDealerPermission,
  respond,
} from "@/lib/admin/api-utils";
import { getOfferById } from "@/lib/admin";
import { createSubmission } from "@/lib/dealer/submissions/store";
import type { Currency, StockStatus } from "@/lib/cars/types";

export async function GET(request: NextRequest, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireDealerPermission(request, "dealer.offer.view");
  if ("response" in auth) return auth.response;
  const { offerId } = await ctx.params;
  const offer = getOfferById(offerId);
  if (!offer || offer.dealer_id !== auth.session.dealerId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ offer });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ offerId: string }> }) {
  return submitUpdate(request, ctx);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ offerId: string }> }) {
  return submitUpdate(request, ctx);
}

async function submitUpdate(
  request: NextRequest,
  ctx: { params: Promise<{ offerId: string }> },
): Promise<NextResponse> {
  const auth = await requireDealerPermission(request, "dealer.offer.update_own_draft");
  if ("response" in auth) return auth.response;
  const { offerId } = await ctx.params;
  const offer = getOfferById(offerId);
  if (!offer || offer.dealer_id !== auth.session.dealerId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const body = await parseBody(request);
  const payload: Record<string, unknown> = {};
  const amount = pickNumber(body, "amount");
  if (amount !== undefined) payload.amount = amount;
  const currency = pick(body, "currency");
  if (currency !== undefined) payload.currency = currency as Currency;
  const stock_status = pick(body, "stock_status");
  if (stock_status !== undefined) payload.stock_status = stock_status as StockStatus;
  const valid_until = pick(body, "valid_until");
  if (valid_until !== undefined) payload.valid_until = valid_until || null;
  const notes = pick(body, "notes");
  if (notes !== undefined) payload.notes = notes;

  const submission = createSubmission({
    dealer_id: auth.session.dealerId,
    kind: "offer_update",
    target_id: offerId,
    payload,
    submitted_by: auth.session.contactName,
  });
  audit(auth.session, {
    action: "offer.submit",
    entity_type: "submission",
    entity_id: submission.submission_id,
    after: { kind: "offer_update", target_id: offerId, payload },
  });
  return respond(request, { submission }, "/dealer/submissions");
}
