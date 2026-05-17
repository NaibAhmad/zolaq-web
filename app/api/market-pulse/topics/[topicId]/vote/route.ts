import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick } from "@/lib/admin/api-utils";
import { getSession } from "@/lib/auth/session";
import { errorJson } from "@/lib/auth/error";
import { castVote } from "@/lib/market-pulse/store";
import { onBazarVote } from "@/lib/gamification/hooks";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ topicId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Səs vermək üçün OTP doğrulama tələb olunur.");
  }
  const { topicId } = await ctx.params;
  const body = await parseBody(request);
  const option_id = pick(body, "option_id");
  if (!option_id) {
    return NextResponse.json({ error: "option_id required" }, { status: 400 });
  }
  const result = castVote({
    topic_id: topicId,
    option_id,
    user_id: session.userId,
  });
  if (!result.ok) {
    if (result.error === "already_voted") {
      return errorJson(409, "CONFLICT", "Bu sualda artıq səs vermisiniz.");
    }
    if (result.error === "topic_not_active") {
      return errorJson(409, "LOCKED", "Bu sual artıq aktiv deyil.");
    }
    if (result.error === "topic_not_found") {
      return errorJson(404, "NOT_FOUND", "Mövzu tapılmadı.");
    }
    return errorJson(400, "VALIDATION_ERROR", "Variant tapılmadı.");
  }
  // P0-lite gamification side-effects.
  onBazarVote(session.userId, topicId);
  return NextResponse.json({ vote: result.vote });
}
