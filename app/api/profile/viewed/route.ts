import { NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { trimSummaryFor } from "@/lib/cars/summary";
import { listViewedForUser } from "@/lib/decisions/store";
import type { ViewedCarWithTrim } from "@/lib/decisions/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const viewed: ViewedCarWithTrim[] = listViewedForUser(session.userId).map(
    (v) => ({ ...v, trim: trimSummaryFor(v.trim_id) })
  );
  return NextResponse.json({ viewed });
}
