import { NextResponse } from "next/server";
import { errorJson } from "@/lib/auth/error";
import { getSession } from "@/lib/auth/session";
import { getBrand, getTrimById } from "@/lib/cars/lookup";
import { listLeadsForUser } from "@/lib/leads/store";
import type { Lead, LeadTrimSummary, LeadWithTrim } from "@/lib/leads/types";

function trimSummaryFor(lead: Lead): LeadTrimSummary {
  const trim = getTrimById(lead.trim_id);
  if (!trim) {
    return {
      trim_id: lead.trim_id,
      brand_id: "",
      brand_name: "—",
      model_name: "—",
      display_name: lead.trim_id,
      year: 0,
      energy_type: "ICE",
      image_url: null,
    };
  }
  const brand = getBrand(trim.brand_id);
  return {
    trim_id: trim.trim_id,
    brand_id: trim.brand_id,
    brand_name: brand?.name ?? trim.brand_id,
    model_name: trim.model_name,
    display_name: trim.display_name,
    year: trim.year,
    energy_type: trim.energy_type,
    image_url: trim.image_url ?? null,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorJson(401, "UNAUTHENTICATED", "Sessiya yoxdur.");
  }
  const leads: LeadWithTrim[] = listLeadsForUser(session.userId).map((lead) => ({
    ...lead,
    trim: trimSummaryFor(lead),
  }));
  return NextResponse.json({ leads });
}
