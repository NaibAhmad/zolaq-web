import { NextResponse, type NextRequest } from "next/server";
import {
  audit,
  parseBody,
  pick,
  pickNumber,
  requireAdmin,
  respond,
} from "@/lib/admin/api-utils";
import { createTrim, listTrims } from "@/lib/admin";
import type { EnergyType } from "@/lib/cars/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  return NextResponse.json({ trims: listTrims() });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const brand_id = pick(body, "brand_id");
  const model_name = pick(body, "model_name");
  const year = pickNumber(body, "year");
  const display_name = pick(body, "display_name");
  const energy_type = pick(body, "energy_type") as EnergyType | undefined;
  if (!brand_id || !model_name || !year || !display_name || !energy_type) {
    return NextResponse.json(
      { error: "brand_id, model_name, year, display_name, energy_type required" },
      { status: 400 },
    );
  }
  const rawGenerationId = pick(body, "generation_id");
  const trim = createTrim({
    brand_id,
    model_name,
    year,
    display_name,
    energy_type,
    status: (pick(body, "status") as "active" | "inactive") ?? "active",
    ...(pickNumber(body, "power_hp") !== undefined && { power_hp: pickNumber(body, "power_hp") }),
    ...(pickNumber(body, "range_km") !== undefined && { range_km: pickNumber(body, "range_km") }),
    ...(pick(body, "image_url") !== undefined && { image_url: pick(body, "image_url") }),
    ...(pick(body, "body_type") !== undefined && { body_type: pick(body, "body_type") }),
    // Sprint 8H Correction v2: empty string from the Nəsil select means "not
    // attached to any generation" — store undefined so reads see the
    // "Bütün nəsillər" fallback rather than an empty trim_id mismatch.
    ...(rawGenerationId ? { generation_id: rawGenerationId } : {}),
  });
  audit(auth.session, {
    action: "trim.create",
    entity_type: "trim",
    entity_id: trim.trim_id,
    after: { ...trim },
  });
  return respond(request, { trim }, "/admin/catalog/trims");
}
