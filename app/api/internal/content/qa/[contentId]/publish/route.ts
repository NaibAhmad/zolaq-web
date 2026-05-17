import { NextResponse, type NextRequest } from "next/server";
import { audit, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getQA, updateQA } from "@/lib/content/admin-store";

export async function POST(request: NextRequest, ctx: { params: Promise<{ contentId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "content_manager", "moderator");
  if ("response" in auth) return auth.response;
  const { contentId } = await ctx.params;
  const before = getQA(contentId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const updated = updateQA(contentId, { status: "published", published_at: Date.now() });
  audit(auth.session, {
    action: "content.publish",
    entity_type: "qa",
    entity_id: contentId,
    before: { status: before.status },
    after: { status: "published" },
  });
  return respond(request, { qa: updated }, `/admin/content/qa/${contentId}`);
}
