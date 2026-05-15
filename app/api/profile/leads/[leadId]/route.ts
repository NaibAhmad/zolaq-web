import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { getLeadForUser, getTimelineForLead } from "@/lib/leads/store";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ leadId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const { leadId } = await context.params;
  const lead = getLeadForUser(leadId, session.userId);
  if (!lead) {
    return errorJson(404, "NOT_FOUND", "Sorğu tapılmadı.", { lead_id: leadId });
  }
  const timeline = getTimelineForLead(leadId);
  return NextResponse.json({ lead, timeline });
}
