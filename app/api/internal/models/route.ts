import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { createModel, listModels } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ models: listModels() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const brand_id = pick(body, "brand_id");
  const name = pick(body, "name");
  if (!brand_id || !name) {
    return NextResponse.json({ error: "brand_id and name required" }, { status: 400 });
  }
  const model = createModel({
    brand_id,
    name,
    status: (pick(body, "status") as "active" | "inactive") ?? "active",
    body_type: pick(body, "body_type"),
  });
  audit(auth.session, {
    action: "model.create",
    entity_type: "model",
    entity_id: model.model_id,
    after: { ...model },
  });
  return respond(request, { model }, "/admin/catalog/models");
}
