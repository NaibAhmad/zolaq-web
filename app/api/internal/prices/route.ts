import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  parseBody,
  pick,
  pickNumber,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import { createPrice, listPrices } from "@/lib/admin";
import type { Currency, PriceStatus, SourceType, VerificationStatus } from "@/lib/cars/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ prices: listPrices() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const trim_id = pick(body, "trim_id");
  const amount = pickNumber(body, "amount");
  const currency = pick(body, "currency") as Currency | undefined;
  const status = pick(body, "status") as PriceStatus | undefined;
  const source_type = pick(body, "source_type") as SourceType | undefined;
  const source_name = pick(body, "source_name");
  const verification_status =
    (pick(body, "verification_status") as VerificationStatus | undefined) ?? "verified";

  if (!trim_id || amount === undefined || !currency || !status || !source_type || !source_name) {
    return NextResponse.json(
      { error: "trim_id, amount, currency, status, source_type, source_name required" },
      { status: 400 },
    );
  }

  const dealer_id = pick(body, "dealer_id");
  const valid_until = pick(body, "valid_until") ?? null;

  const price = createPrice({
    trim_id,
    amount,
    currency,
    status,
    source_type,
    source_name,
    verification_status,
    ...(dealer_id !== undefined && {
      dealer_id,
      offer_status: "published",
    }),
    valid_until,
  });
  audit(auth.session, {
    action: "price.create",
    entity_type: "price",
    entity_id: price.price_id,
    after: { ...price },
  });
  return respond(request, { price }, "/admin/catalog/prices");
}
