import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { getLeadForUser, transitionLead } from "@/lib/leads/store";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const { leadId } = await context.params;

  const owned = getLeadForUser(leadId, session.userId);
  if (!owned) {
    return errorJson(404, "NOT_FOUND", "Sorğu tapılmadı.", { lead_id: leadId });
  }

  const result = transitionLead({
    lead_id: leadId,
    to_state: "test_drive_requested",
    actor: "user",
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
