import { NextResponse, type NextRequest } from "next/server";
import { parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getTopic, updateTopic } from "@/lib/market-pulse/store";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ topicId: string }> },
) {
  const { topicId } = await ctx.params;
  const t = getTopic(topicId);
  if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ topic: t });
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ topicId: string }> },
) {
  const auth = await requireAdmin(request, "super_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const { topicId } = await ctx.params;
  const body = await parseBody(request);
  const updated = updateTopic(
    topicId,
    {
      ...(pick(body, "question") !== undefined && {
        question: pick(body, "question"),
      }),
      ...(pick(body, "start_date") !== undefined && {
        start_date: pick(body, "start_date"),
      }),
      ...(pick(body, "end_date") !== undefined && {
        end_date: pick(body, "end_date"),
      }),
      ...(pick(body, "sponsor_name") !== undefined && {
        sponsor_name: pick(body, "sponsor_name"),
      }),
    },
    { actor_id: auth.session.adminId, role: auth.session.role },
  );
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return respond(request, { topic: updated }, `/admin/market-pulse/${topicId}`);
}
