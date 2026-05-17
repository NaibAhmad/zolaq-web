import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { createEncyclopedia, listEncyclopedia } from "@/lib/content/admin-store";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "content_manager");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ entries: listEncyclopedia() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const title = pick(body, "title");
  const slug = pick(body, "slug");
  if (!title || !slug) {
    return NextResponse.json({ error: "title and slug required" }, { status: 400 });
  }
  const entry = createEncyclopedia({
    title,
    slug,
    summary: pick(body, "summary") ?? "",
    body: pick(body, "body") ?? "",
    related_trim_ids: [],
    published_at: Date.now(),
    status: "draft",
  });
  audit(auth.session, {
    action: "content.create",
    entity_type: "encyclopedia",
    entity_id: entry.content_id,
    after: { ...entry },
  });
  return respond(request, { entry }, "/admin/content/encyclopedia");
}
