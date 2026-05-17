import { NextResponse, type NextRequest } from "next/server";
import { audit, methodOverride, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getBrand, updateBrand } from "@/lib/admin";
import type { AdminSession } from "@/lib/auth/admin-session";

async function patch(
  request: NextRequest,
  brandId: string,
  body: Record<string, FormDataEntryValue | undefined>,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getBrand(brandId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const updated = updateBrand(brandId, {
    ...(pick(body, "name") !== undefined && { name: pick(body, "name") }),
    ...(pick(body, "country") !== undefined && { country: pick(body, "country") }),
    ...(pick(body, "status") !== undefined && {
      status: pick(body, "status") as "active" | "inactive",
    }),
  });
  audit(session, {
    action: "brand.update",
    entity_type: "brand",
    entity_id: brandId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });
  return respond(request, { brand: updated }, "/admin/catalog/brands");
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await ctx.params;
  const brand = getBrand(brandId);
  if (!brand) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ brand });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ brandId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { brandId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, brandId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ brandId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { brandId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, brandId, body, auth.session);
}
