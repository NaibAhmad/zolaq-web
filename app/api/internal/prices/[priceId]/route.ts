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
import { getPrice, updatePrice, type CatalogPriceRecord } from "@/lib/admin";
import type { AdminSession } from "@/lib/auth/admin-session";
import type { Currency, VerificationStatus } from "@/lib/cars/types";

async function patch(
  request: NextRequest,
  priceId: string,
  body: Record<string, FormDataEntryValue | undefined>,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getPrice(priceId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patchObj: Partial<Omit<CatalogPriceRecord, "price_id">> = {};
  const trim_id = pick(body, "trim_id");
  if (trim_id !== undefined) patchObj.trim_id = trim_id;
  const amount = pickNumber(body, "amount");
  if (amount !== undefined) patchObj.amount = amount;
  const currency = pick(body, "currency");
  if (currency !== undefined) patchObj.currency = currency as Currency;
  const source_name = pick(body, "source_name");
  if (source_name !== undefined) patchObj.source_name = source_name;
  const verification_status = pick(body, "verification_status");
  if (verification_status !== undefined) patchObj.verification_status = verification_status as VerificationStatus;
  const dealer_id = pick(body, "dealer_id");
  if (dealer_id !== undefined) patchObj.dealer_id = dealer_id;
  const valid_until = pick(body, "valid_until");
  if (valid_until !== undefined) patchObj.valid_until = valid_until || null;
  const notes = pick(body, "notes");
  if (notes !== undefined) patchObj.notes = notes;
  const updated = updatePrice(priceId, patchObj);
  audit(session, {
    action: "price.update",
    entity_type: "price",
    entity_id: priceId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });
  return respond(request, { price: updated }, "/admin/catalog/prices");
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ priceId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { priceId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, priceId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ priceId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { priceId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, priceId, body, auth.session);
}
