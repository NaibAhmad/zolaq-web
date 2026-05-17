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
import { getDealer, updateDealer } from "@/lib/admin";
import type { AdminSession } from "@/lib/auth/admin-session";
import type {
  Dealer,
  DealerService,
  DealerVerificationStatus,
  WorkingHoursRange,
} from "@/lib/dealers/types";

const VALID_SERVICES: readonly DealerService[] = [
  "test_drive",
  "trade_in",
  "financing",
  "delivery",
  "warranty",
];

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseWorkingHours(raw: string | undefined): WorkingHoursRange[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (e): e is WorkingHoursRange =>
          typeof e === "object" &&
          e !== null &&
          typeof e.days === "string" &&
          typeof e.open === "string" &&
          typeof e.close === "string",
      )
      .map((e) => ({ days: e.days, open: e.open, close: e.close }));
  } catch {
    return null;
  }
}

async function patch(
  request: NextRequest,
  dealerId: string,
  body: Record<string, FormDataEntryValue | undefined>,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getDealer(dealerId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const patchObj: Partial<Omit<Dealer, "dealer_id">> = {};
  const legal_name = pick(body, "legal_name");
  if (legal_name !== undefined) patchObj.legal_name = legal_name;
  const display_name = pick(body, "display_name");
  if (display_name !== undefined) patchObj.display_name = display_name;
  const city = pick(body, "city");
  if (city !== undefined) patchObj.city = city;
  const address = pick(body, "address");
  if (address !== undefined) patchObj.address = address;
  const sla = pickNumber(body, "response_sla_hours");
  if (sla !== undefined) patchObj.response_sla_hours = sla;
  const verification_status = pick(body, "verification_status");
  if (verification_status !== undefined)
    patchObj.verification_status = verification_status as DealerVerificationStatus;
  const status = pick(body, "status");
  if (status !== undefined) patchObj.status = status as "active" | "inactive";
  const represented_brands = pick(body, "represented_brands");
  if (represented_brands !== undefined) patchObj.represented_brands = parseList(represented_brands);
  const services = pick(body, "services");
  if (services !== undefined) {
    patchObj.services = parseList(services).filter((s): s is DealerService =>
      (VALID_SERVICES as readonly string[]).includes(s),
    );
  }
  const working_hours = parseWorkingHours(pick(body, "working_hours_json"));
  if (working_hours !== null) patchObj.working_hours = working_hours;

  const wasPendingNowVerified =
    before.verification_status === "pending" &&
    verification_status !== undefined &&
    verification_status !== "pending" &&
    verification_status !== "rejected";

  const updated = updateDealer(dealerId, patchObj);
  audit(session, {
    action: wasPendingNowVerified ? "dealer.verify" : "dealer.update",
    entity_type: "dealer",
    entity_id: dealerId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });
  return respond(request, { dealer: updated }, `/admin/dealers/${dealerId}`);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ dealerId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { dealerId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, dealerId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ dealerId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { dealerId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, dealerId, body, auth.session);
}
