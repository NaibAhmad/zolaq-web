import { NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { listHistoryForUser } from "@/lib/decisions/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const events = listHistoryForUser(session.userId);
  return NextResponse.json({ events });
}
