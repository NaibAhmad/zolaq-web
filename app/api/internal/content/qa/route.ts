import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { createQA, listQA } from "@/lib/content/admin-store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "content_manager", "moderator");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ entries: listQA() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "content_manager", "moderator");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const question = pick(body, "question");
  const answer = pick(body, "answer");
  if (!question || !answer) {
    return NextResponse.json({ error: "question and answer required" }, { status: 400 });
  }
  const id = `qa-${Date.now()}`;
  const qa = createQA({
    id,
    question,
    answer,
    related_trim_ids: [],
    published_at: Date.now(),
    status: "draft",
  });
  audit(auth.session, {
    action: "content.create",
    entity_type: "qa",
    entity_id: qa.content_id,
    after: { ...qa },
  });
  return respond(request, { qa }, "/admin/content/qa");
}
