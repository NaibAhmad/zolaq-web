import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  methodOverride,
  parseBody,
  pick,
  pickNumber,
  requireAdmin,
  respond,
  type ParsedBody,
} from "@/lib/admin/api-utils";
import {
  archiveGeneration,
  getGeneration,
  updateGeneration,
} from "@/lib/generations/repository";
import { listTrims } from "@/lib/admin";
import type { AdminSession } from "@/lib/auth/admin-session";

async function patch(
  request: NextRequest,
  generationId: string,
  body: ParsedBody,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getGeneration(generationId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const production_year_from = pickNumber(body, "production_year_from");
  const production_year_to = pickNumber(body, "production_year_to");
  const yearFrom = production_year_from ?? before.production_year_from;
  if (production_year_to !== undefined && production_year_to < yearFrom) {
    return NextResponse.json(
      { error: "İstehsal ili bitiş başlanğıcdan kiçik ola bilməz." },
      { status: 400 },
    );
  }

  const patchObj: Record<string, unknown> = {
    ...(pick(body, "brand_id") !== undefined && { brand_id: pick(body, "brand_id") }),
    ...(pick(body, "model_name") !== undefined && { model_name: pick(body, "model_name") }),
    ...(pick(body, "name") !== undefined && { name: pick(body, "name") }),
    ...(pick(body, "display_name") !== undefined && {
      display_name: pick(body, "display_name"),
    }),
    ...(production_year_from !== undefined && { production_year_from }),
    ...(production_year_to !== undefined && { production_year_to }),
    ...(pick(body, "status") !== undefined && {
      status: pick(body, "status") as "active" | "inactive",
    }),
    ...(pick(body, "source") !== undefined && { source: pick(body, "source") }),
    ...(pick(body, "verification_status") !== undefined && {
      verification_status: pick(body, "verification_status"),
    }),
  };

  const updated = updateGeneration(generationId, patchObj);
  audit(session, {
    action: "generation.update",
    entity_type: "generation",
    entity_id: generationId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });
  return respond(request, { generation: updated }, "/admin/catalog/generations");
}

async function del(
  request: NextRequest,
  generationId: string,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getGeneration(generationId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Hard delete only when no Trim references this generation. Otherwise archive.
  const referencingTrims = listTrims().filter((t) => t.generation_id === generationId);
  const action = "archive" as const;
  const updated = archiveGeneration(generationId);
  audit(session, {
    action: "generation.archive",
    entity_type: "generation",
    entity_id: generationId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
    note: referencingTrims.length > 0
      ? `${referencingTrims.length} komplektasiya istifadə edir — arxivləndi.`
      : "Heç bir trim istifadə etmir; arxivləndi (hard delete deferred).",
  });
  return respond(
    request,
    { generation: updated, action, referencing: referencingTrims.length },
    "/admin/catalog/generations",
  );
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ generationId: string }> }) {
  const { generationId } = await ctx.params;
  const generation = getGeneration(generationId);
  if (!generation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ generation });
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ generationId: string }> },
) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { generationId } = await ctx.params;
  const body = await parseBody(request);
  const m = methodOverride(body, "POST");
  if (m === "PATCH") return patch(request, generationId, body, auth.session);
  if (m === "DELETE") return del(request, generationId, auth.session);
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ generationId: string }> },
) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { generationId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, generationId, body, auth.session);
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ generationId: string }> },
) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { generationId } = await ctx.params;
  return del(request, generationId, auth.session);
}
