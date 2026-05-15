import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { closeDecision } from "@/lib/decisions/store";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ decisionId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const { decisionId } = await context.params;
  const decision = closeDecision(decisionId, session.userId);
  if (!decision) {
    return errorJson(404, "NOT_FOUND", "Qərar tapılmadı.", { decisionId });
  }
  return NextResponse.json({ decision });
}
