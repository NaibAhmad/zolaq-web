import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  parseBody,
  pick,
  pickNumber,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import { createDealer, listDealers } from "@/lib/admin";
import type { DealerService, DealerVerificationStatus } from "@/lib/dealers/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ dealers: listDealers() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const legal_name = pick(body, "legal_name");
  const display_name = pick(body, "display_name");
  const city = pick(body, "city");
  const address = pick(body, "address");
  const response_sla_hours = pickNumber(body, "response_sla_hours") ?? 4;
  if (!legal_name || !display_name || !city || !address) {
    return NextResponse.json(
      { error: "legal_name, display_name, city, address required" },
      { status: 400 },
    );
  }
  const dealer = createDealer({
    dealer_id: "",
    legal_name,
    display_name,
    city,
    address,
    response_sla_hours,
    verification_status: (pick(body, "verification_status") as DealerVerificationStatus) ?? "pending",
    represented_brands: [],
    working_hours: [],
    services: [] as DealerService[],
    status: "active",
    source_name: "Zolaq Admin",
  });
  audit(auth.session, {
    action: "dealer.create",
    entity_type: "dealer",
    entity_id: dealer.dealer_id,
    after: { ...dealer },
  });
  return respond(request, { dealer }, "/admin/dealers");
}
