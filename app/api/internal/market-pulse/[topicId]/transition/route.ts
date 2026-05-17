import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { transitionTopic } from "@/lib/market-pulse/store";
import {
  BAZAR_TOPIC_STATUSES,
  type BazarTopicStatus,
} from "@/lib/market-pulse/types";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ topicId: string }> },
) {
  const auth = await requireAdmin(request, "super_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const { topicId } = await ctx.params;
  const body = await parseBody(request);
  const to = pick(body, "to") as BazarTopicStatus | undefined;
  if (!to || !BAZAR_TOPIC_STATUSES.includes(to)) {
    return NextResponse.json({ error: "invalid to" }, { status: 400 });
  }
  const result = transitionTopic({
    id: topicId,
    to,
    actor: { actor_id: auth.session.adminId, role: auth.session.role },
    market_summary: pick(body, "market_summary"),
    rejection_reason: pick(body, "rejection_reason"),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return respond(request, { topic: result.row }, `/admin/market-pulse/${topicId}`);
}
