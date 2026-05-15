// TODO Sprint 4: gate this endpoint behind internal-operator auth. Sprint 3.1
// leaves it open because the operator console is not yet built and the mock
// flow exercises transitions over HTTP for development only.

import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { transitionLead } from "@/lib/leads/store";
import { LEAD_STATES, isLeadState } from "@/lib/leads/types";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Invalid JSON body.");
  }

  const { to_state, metadata } = (body ?? {}) as {
    to_state?: unknown;
    metadata?: unknown;
  };

  if (!isLeadState(to_state)) {
    return errorJson(400, "VALIDATION_ERROR", "`to_state` dəyəri yanlışdır.", {
      field: "to_state",
      allowed: LEAD_STATES,
    });
  }

  const safeMetadata =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : undefined;

  const result = transitionLead({
    lead_id: leadId,
    to_state,
    actor: "internal_operator",
    metadata: safeMetadata,
  });

  if (!result.ok) {
    if (result.error.kind === "not_found") {
      return errorJson(404, "NOT_FOUND", "Sorğu tapılmadı.", { lead_id: leadId });
    }
    return errorJson(
      400,
      "VALIDATION_ERROR",
      "Bu vəziyyətə keçid icazəli deyil.",
      {
        from: result.error.from,
        to: result.error.to,
        allowed: result.error.allowed,
      }
    );
  }

  return NextResponse.json({ lead: result.lead, event: result.event });
}
