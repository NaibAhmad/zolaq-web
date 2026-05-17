import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  methodOverride,
  parseBody,
  pick,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import { getEncyclopedia, updateEncyclopedia } from "@/lib/content/admin-store";
import type { AdminSession } from "@/lib/auth/admin-session";
import type { EncyclopediaCategory } from "@/lib/content/types";

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
  const before = getEncyclopedia(contentId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const patchObj: Parameters<typeof updateEncyclopedia>[1] = {};
  for (const k of [
    "title",
    "slug",
    "summary",
    "body",
    "excerpt",
    "image_url",
    "image_alt",
    "related_model_reason",
  ] as const) {
    const v = pick(body, k);
    if (v !== undefined) (patchObj as Record<string, string>)[k] = v;
  }
  const category = pick(body, "category");
  if (category !== undefined && category !== "") {
    patchObj.category = category as EncyclopediaCategory;
  }
  const related = parseList(pick(body, "related_trim_ids"));
  if (related !== undefined) patchObj.related_trim_ids = related;
  const source_name = pick(body, "source_name");
  if (source_name !== undefined) {
    patchObj.source = {
      name: source_name,
      source_count: before.source?.source_count ?? 1,
      verified: before.source?.verified ?? false,
    };
  }
  const updated = updateEncyclopedia(contentId, patchObj);
  audit(session, {
    action: "content.update",
    entity_type: "encyclopedia",
    entity_id: contentId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });
  return respond(request, { entry: updated }, `/admin/content/encyclopedia/${contentId}`);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ contentId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const { contentId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, contentId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ contentId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const { contentId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, contentId, body, auth.session);
}
