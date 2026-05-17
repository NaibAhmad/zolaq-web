import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  parseBody,
  pick,
  pickNumber,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import {
  createGeneration,
  listGenerations,
} from "@/lib/generations/repository";
import { getBrand } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const url = new URL(request.url);
  const brand_id = url.searchParams.get("brand_id") ?? undefined;
  const model_name = url.searchParams.get("model_name") ?? undefined;
  return NextResponse.json({
    generations: listGenerations({
      ...(brand_id && { brand_id }),
      ...(model_name && { model_name }),
    }),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);

  const brand_id = pick(body, "brand_id");
  const model_name = pick(body, "model_name");
  const name = pick(body, "name");
  const display_name = pick(body, "display_name");
  const production_year_from = pickNumber(body, "production_year_from");

  if (!brand_id || !model_name || !name || !display_name || production_year_from === undefined) {
    return NextResponse.json(
      { error: "brand_id, model_name, name, display_name, production_year_from tələb olunur" },
      { status: 400 },
    );
  }
  if (!getBrand(brand_id)) {
    return NextResponse.json({ error: "marka tapılmadı" }, { status: 400 });
  }

  const production_year_to = pickNumber(body, "production_year_to");
  if (
    production_year_to !== undefined &&
    production_year_to < production_year_from
  ) {
    return NextResponse.json(
      { error: "İstehsal ili bitiş başlanğıcdan kiçik ola bilməz." },
      { status: 400 },
    );
  }

  const status = (pick(body, "status") as "active" | "inactive") ?? "active";
  const created = createGeneration({
    brand_id,
    model_name,
    name,
    display_name,
    production_year_from,
    ...(production_year_to !== undefined && { production_year_to }),
    status,
    ...(pick(body, "source") && { source: pick(body, "source") }),
    ...(pick(body, "verification_status") && {
      verification_status: pick(body, "verification_status"),
    }),
  });

  audit(auth.session, {
    action: "generation.create",
    entity_type: "generation",
    entity_id: created.generation_id,
    after: { ...created },
  });

  return respond(request, { generation: created }, "/admin/catalog/generations");
}
