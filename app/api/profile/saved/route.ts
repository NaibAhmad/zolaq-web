import { NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { trimSummaryFor } from "@/lib/cars/summary";
import { listSavedForUser } from "@/lib/decisions/store";
import type { SavedCarWithTrim } from "@/lib/decisions/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const saved: SavedCarWithTrim[] = listSavedForUser(session.userId).map((s) => ({
    ...s,
    trim: trimSummaryFor(s.trim_id),
  }));
  return NextResponse.json({ saved });
}
