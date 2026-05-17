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
import { getTrim, updateTrim } from "@/lib/admin";
import { upsertTrimSpec, type TrimSpec } from "@/lib/catalog/trim-specs-store";
import { getGeneration } from "@/lib/generations/repository";
import type { AdminSession } from "@/lib/auth/admin-session";
import type { EnergyType, Trim } from "@/lib/cars/types";

const SPEC_NUMBER_FIELDS = [
  "engine_displacement_l",
  "torque_nm",
  "seats",
  "battery_kwh",
  "fuel_consumption_l_100km",
  "charging_ac_kw",
  "charging_dc_kw",
  "acceleration_0_100",
  "ground_clearance",
] as const;

const SPEC_STRING_FIELDS = [
  "engine",
  "transmission",
  "drivetrain",
  "dimensions",
  "warranty",
  "source",
  "verification_status",
] as const;

async function patch(
  request: NextRequest,
  trimId: string,
  body: ParsedBody,
  session: AdminSession,
): Promise<NextResponse> {
  const before = getTrim(trimId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // ---- Basic Trim fields ----
  const patchObj: Partial<Omit<Trim, "trim_id">> = {};
  const brand_id = pick(body, "brand_id");
  if (brand_id !== undefined) patchObj.brand_id = brand_id;
  const model_name = pick(body, "model_name");
  if (model_name !== undefined) patchObj.model_name = model_name;
  const year = pickNumber(body, "year");
  if (year !== undefined) patchObj.year = year;
  const display_name = pick(body, "display_name");
  if (display_name !== undefined) patchObj.display_name = display_name;
  const energy_type = pick(body, "energy_type");
  if (energy_type !== undefined) patchObj.energy_type = energy_type as EnergyType;
  const power_hp = pickNumber(body, "power_hp");
  if (power_hp !== undefined) patchObj.power_hp = power_hp;
  const range_km = pickNumber(body, "range_km");
  if (range_km !== undefined) patchObj.range_km = range_km;
  const image_url = pick(body, "image_url");
  if (image_url !== undefined) patchObj.image_url = image_url;
  const body_type = pick(body, "body_type");
  if (body_type !== undefined) patchObj.body_type = body_type;
  const status = pick(body, "status");
  if (status !== undefined) patchObj.status = status as "active" | "inactive";

  // ---- Generation linkage with validation ----
  const generation_id_raw = pick(body, "generation_id");
  if (generation_id_raw !== undefined) {
    const generation_id = generation_id_raw === "" ? null : generation_id_raw;
    if (generation_id) {
      const gen = getGeneration(generation_id);
      if (!gen) {
        return NextResponse.json({ error: "nəsil tapılmadı" }, { status: 400 });
      }
      // Year must fall within generation's production range (open-ended top).
      const effectiveYear = patchObj.year ?? before.year;
      if (
        effectiveYear < gen.production_year_from ||
        (gen.production_year_to != null && effectiveYear > gen.production_year_to)
      ) {
        return NextResponse.json(
          { error: "il nəsil aralığından kənardadır" },
          { status: 400 },
        );
      }
    }
    patchObj.generation_id = generation_id;
  }

  const updated = updateTrim(trimId, patchObj);
  audit(session, {
    action: "trim.update",
    entity_type: "trim",
    entity_id: trimId,
    before: { ...before },
    after: updated ? { ...updated } : undefined,
  });

  // ---- TrimSpec advanced fields (Sprint 9C) ----
  const specPatch: Partial<TrimSpec> = {};
  for (const f of SPEC_NUMBER_FIELDS) {
    const v = pickNumber(body, f);
    if (v !== undefined) (specPatch as Record<string, unknown>)[f] = v;
  }
  for (const f of SPEC_STRING_FIELDS) {
    const v = pick(body, f);
    if (v !== undefined) (specPatch as Record<string, unknown>)[f] = v;
  }
  if (Object.keys(specPatch).length > 0) {
    const spec = upsertTrimSpec({ trim_id: trimId, ...specPatch });
    audit(session, {
      action: "trim_spec.update",
      entity_type: "trim_spec",
      entity_id: trimId,
      after: { ...spec },
    });
  }

  return respond(request, { trim: updated }, "/admin/catalog/trims");
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ trimId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { trimId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, trimId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ trimId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { trimId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, trimId, body, auth.session);
}
