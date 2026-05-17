// Dealer profile updates are never applied directly — they create a
// DealerSubmission (kind: "profile_edit") that admin must approve. The dealer
// always sees the canonical record + their open submission(s) on the profile
// page; the public site keeps showing the canonical record until approval.

import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, pickNumber, requireDealerPermission, respond } from "@/lib/admin/api-utils";
import { getDealer } from "@/lib/admin";
import { createSubmission } from "@/lib/dealer/submissions/store";

function parseList(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

function parseWorkingHours(raw: string | undefined): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.profile.view");
  if ("response" in auth) return auth.response;
  const dealer = getDealer(auth.session.dealerId);
  return NextResponse.json({ dealer });
}

export async function PATCH(request: NextRequest) {
  return submitEdit(request);
}

export async function POST(request: NextRequest) {
  return submitEdit(request);
}

async function submitEdit(request: NextRequest): Promise<NextResponse> {
  const auth = await requireDealerPermission(request, "dealer.profile.request_update");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const payload: Record<string, unknown> = {};
  const fields = ["legal_name", "display_name", "city", "address"] as const;
  for (const k of fields) {
    const v = pick(body, k);
    if (v !== undefined) payload[k] = v;
  }
  const sla = pickNumber(body, "response_sla_hours");
  if (sla !== undefined) payload.response_sla_hours = sla;
  const brands = parseList(pick(body, "represented_brands"));
  if (brands !== undefined) payload.represented_brands = brands;
  const services = parseList(pick(body, "services"));
  if (services !== undefined) payload.services = services;
  const wh = parseWorkingHours(pick(body, "working_hours_json"));
  if (wh !== undefined) payload.working_hours = wh;

  const submission = createSubmission({
    dealer_id: auth.session.dealerId,
    kind: "profile_edit",
    payload,
    submitted_by: auth.session.contactName,
  });
  audit(auth.session, {
    action: "submission.create",
    entity_type: "submission",
    entity_id: submission.submission_id,
    after: { kind: "profile_edit", payload },
  });
  return respond(request, { submission }, "/dealer/submissions");
}
