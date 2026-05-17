import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { errorJson } from "@/lib/auth/error";
import { listProfileActivity } from "@/lib/gamification/activity";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Profil tələb olunur.");
  }
  return NextResponse.json({
    activity: listProfileActivity(session.userId),
  });
}
