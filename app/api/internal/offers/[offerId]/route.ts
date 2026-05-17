import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  methodOverride,
  parseBody,
  pick,
  pickNumber,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import { getOfferById, updateOfferById, type CatalogPriceRecord } from "@/lib/admin";
import type { AdminSession } from "@/lib/auth/admin-session";
import type { StockStatus } from "@/lib/cars/types";

async function patch(
  request: NextRequest,
  offerId: string,
  body: Record<string, FormDataEntryValue | undefined>,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getOfferById(offerId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const patchObj: Partial<Omit<CatalogPriceRecord, "price_id">> = {};
  const amount = pickNumber(body, "amount");
  if (amount !== undefined) patchObj.amount = amount;
  const valid_until = pick(body, "valid_until");
  if (valid_until !== undefined) patchObj.valid_until = valid_until || null;
  const stock_status = pick(body, "stock_status");
  if (stock_status !== undefined) patchObj.stock_status = stock_status as StockStatus;
  const notes = pick(body, "notes");
  if (notes !== undefined) patchObj.notes = notes;

  const updated = updateOfferById(offerId, patchObj);
  audit(session, {
    action: "offer.update",
    entity_type: "offer",
    entity_id: offerId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });
  return respond(request, { offer: updated }, `/admin/offers/${offerId}`);
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await ctx.params;
  const offer = getOfferById(offerId);
  if (!offer) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ offer });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { offerId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, offerId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { offerId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, offerId, body, auth.session);
}
