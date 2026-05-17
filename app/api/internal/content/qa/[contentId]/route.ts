import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  methodOverride,
  parseBody,
  pick,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import { getQA, updateQA } from "@/lib/content/admin-store";
import type { AdminSession } from "@/lib/auth/admin-session";

function parseList(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

async function patch(
  request: NextRequest,
  contentId: string,
  body: Record<string, FormDataEntryValue | undefined>,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getQA(contentId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patchObj: Parameters<typeof updateQA>[1] = {};
  const question = pick(body, "question");
  if (question !== undefined) patchObj.question = question;
  const answer = pick(body, "answer");
  if (answer !== undefined) patchObj.answer = answer;
  const related = parseList(pick(body, "related_trim_ids"));
  if (related !== undefined) patchObj.related_trim_ids = related;
  const updated = updateQA(contentId, patchObj);
  audit(session, {
    action: "content.update",
    entity_type: "qa",
    entity_id: contentId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });
  return respond(request, { qa: updated }, `/admin/content/qa/${contentId}`);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ contentId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "content_manager", "moderator");
  if ("response" in auth) return auth.response;
  const { contentId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, contentId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ contentId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "content_manager", "moderator");
  if ("response" in auth) return auth.response;
  const { contentId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, contentId, body, auth.session);
}
