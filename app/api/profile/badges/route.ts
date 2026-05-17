import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { errorJson } from "@/lib/auth/error";
import {
  BADGE_CATALOGUE,
  P0_BADGE_IDS,
  listUserBadges,
  type BadgeId,
} from "@/lib/gamification/badges";
import { userPointTotal } from "@/lib/gamification/points";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Profil tələb olunur.");
  }
  const earned = listUserBadges(session.userId);
  const earnedIds = new Set(earned.map((b) => b.badge_id));
  const all = P0_BADGE_IDS.map((id) => ({
    ...BADGE_CATALOGUE[id],
    earned: earnedIds.has(id),
    granted_at:
      earned.find((b) => b.badge_id === id)?.granted_at ?? null,
  }));
  return NextResponse.json({
    badges: all,
    points: userPointTotal(session.userId),
  });
}

// guard for type narrowing in case BadgeId list ever changes shape
export type _BadgeId = BadgeId;
