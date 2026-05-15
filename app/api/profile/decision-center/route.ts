import { NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { computeReadinessForUser } from "@/lib/decisions/readiness";
import {
  listHistoryForUser,
  listSavedForUser,
} from "@/lib/decisions/store";
import { listLeadsForUser } from "@/lib/leads/store";
import type { DecisionCenterSummary } from "@/lib/decisions/types";

const ACTIVE_LEAD_STATES = new Set([
  "submitted",
  "dealer_opened",
  "official_offer",
  "test_drive_requested",
  "test_drive_confirmed",
  "whatsapp_handoff",
  "second_offer",
]);

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }

  const leads = listLeadsForUser(session.userId);
  const saved = listSavedForUser(session.userId);
  const recent_activity = listHistoryForUser(session.userId, { limit: 5 });
  const readiness = computeReadinessForUser(session.userId);

  const summary: DecisionCenterSummary = {
    readiness,
    active_leads_count: leads.filter((l) => ACTIVE_LEAD_STATES.has(l.state))
      .length,
    saved_cars_count: saved.length,
    // No Comparison entity in Sprints 1–4; treat saved cars as the comparison
    // candidate pool. Sprint 6 will introduce a real Comparison entity.
    comparisons_count: saved.length,
    dealer_offers_count: leads.filter(
      (l) => l.state === "official_offer" || l.state === "second_offer"
    ).length,
    recent_activity,
  };

  return NextResponse.json(summary);
}
