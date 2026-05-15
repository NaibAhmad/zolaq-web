import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { trimSummaryFor } from "@/lib/cars/summary";
import { DEALER_OFFERS } from "@/lib/cars/seed";
import {
  getDecisionForUser,
  listHistoryForUser,
  listSavedForUser,
  updateDecision,
} from "@/lib/decisions/store";
import {
  isDecisionStatus,
  type DecisionWorkspaceResponse,
} from "@/lib/decisions/types";
import { listLeadsForUser } from "@/lib/leads/store";
import type { LeadWithTrim } from "@/lib/leads/types";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ decisionId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const { decisionId } = await context.params;
  const decision = getDecisionForUser(decisionId, session.userId);
  if (!decision) {
    return errorJson(404, "NOT_FOUND", "Qərar tapılmadı.", { decisionId });
  }

  const userLeads = listLeadsForUser(session.userId);
  const linkedLeadIds = new Set(decision.lead_ids);
  const leads: LeadWithTrim[] = userLeads
    .filter((l) => linkedLeadIds.has(l.lead_id))
    .map((l) => ({ ...l, trim: trimSummaryFor(l.trim_id) }));

  const candidateTrimIds = new Set(decision.candidate_trim_ids);
  const saved = listSavedForUser(session.userId)
    .filter((s) => candidateTrimIds.has(s.trim_id))
    .map((s) => ({ ...s, trim: trimSummaryFor(s.trim_id) }));

  const offers = DEALER_OFFERS.filter(
    (o) =>
      candidateTrimIds.has(o.trim_id) && o.status === "dealer_official_offer"
  );

  const history = listHistoryForUser(session.userId, {
    decisionId: decision.decision_id,
  });

  const response: DecisionWorkspaceResponse = {
    decision,
    leads,
    saved,
    offers,
    history,
  };
  return NextResponse.json(response);
}

type PatchBody = {
  title?: unknown;
  status?: unknown;
  candidate_trim_ids?: unknown;
  lead_ids?: unknown;
  note?: unknown;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ decisionId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const { decisionId } = await context.params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "JSON oxunmadı.");
  }

  if (body.status !== undefined && !isDecisionStatus(body.status)) {
    return errorJson(400, "VALIDATION_ERROR", "Status etibarsızdır.", {
      status: body.status,
    });
  }
  if (
    body.candidate_trim_ids !== undefined &&
    !isStringArray(body.candidate_trim_ids)
  ) {
    return errorJson(
      400,
      "VALIDATION_ERROR",
      "candidate_trim_ids string siyahısı olmalıdır."
    );
  }
  if (body.lead_ids !== undefined && !isStringArray(body.lead_ids)) {
    return errorJson(
      400,
      "VALIDATION_ERROR",
      "lead_ids string siyahısı olmalıdır."
    );
  }

  const updated = updateDecision(decisionId, session.userId, {
    title: typeof body.title === "string" ? body.title : undefined,
    status: body.status,
    candidate_trim_ids: body.candidate_trim_ids,
    lead_ids: body.lead_ids,
    note: typeof body.note === "string" ? body.note : undefined,
  });
  if (!updated) {
    return errorJson(404, "NOT_FOUND", "Qərar tapılmadı.", { decisionId });
  }
  return NextResponse.json({ decision: updated });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}
