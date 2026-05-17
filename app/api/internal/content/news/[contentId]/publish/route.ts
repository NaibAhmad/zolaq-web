import { NextResponse, type NextRequest } from "next/server";
import { audit, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getNews, updateNews } from "@/lib/content/admin-store";

export async function POST(request: NextRequest, ctx: { params: Promise<{ contentId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const { contentId } = await ctx.params;
  const before = getNews(contentId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const updated = updateNews(contentId, { status: "published", published_at: Date.now() });
  audit(auth.session, {
    action: "content.publish",
    entity_type: "news",
    entity_id: contentId,
    before: { status: before.status },
    after: { status: "published" },
  });
  return respond(request, { article: updated }, `/admin/content/news/${contentId}`);
}
