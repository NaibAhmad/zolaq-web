import { NextResponse, type NextRequest } from "next/server";
import { audit, methodOverride, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getModel, updateModel } from "@/lib/admin";
import type { AdminSession } from "@/lib/auth/admin-session";

async function patch(
  request: NextRequest,
  modelId: string,
  body: Record<string, FormDataEntryValue | undefined>,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getModel(modelId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const updated = updateModel(modelId, {
    ...(pick(body, "brand_id") !== undefined && { brand_id: pick(body, "brand_id") }),
    ...(pick(body, "name") !== undefined && { name: pick(body, "name") }),
    ...(pick(body, "body_type") !== undefined && { body_type: pick(body, "body_type") }),
    ...(pick(body, "status") !== undefined && {
      status: pick(body, "status") as "active" | "inactive",
    }),
  });
  audit(session, {
    action: "model.update",
    entity_type: "model",
    entity_id: modelId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });
  return respond(request, { model: updated }, "/admin/catalog/models");
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ modelId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { modelId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, modelId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ modelId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { modelId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, modelId, body, auth.session);
}
