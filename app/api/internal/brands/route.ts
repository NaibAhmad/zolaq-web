import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { createBrand, listBrands } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ brands: listBrands() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const name = pick(body, "name");
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  const brand = createBrand({
    name,
    country: pick(body, "country"),
    status: (pick(body, "status") as "active" | "inactive") ?? "active",
  });
  audit(auth.session, {
    action: "brand.create",
    entity_type: "brand",
    entity_id: brand.brand_id,
    after: { ...brand },
  });
  return respond(request, { brand }, "/admin/catalog/brands");
}
