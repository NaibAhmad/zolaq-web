// Sprint 8B: approve + publish an offer. Only super_admin can publish in the
// Master Admin tier — internal_ops_admin can act on offers but the published
// transition is gated to super_admin per the dealer-submits/admin-reviews/
// master-admin-approves principle.

import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getOfferById, updateOfferById } from "@/lib/admin";

export async function POST(request: NextRequest, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireAdmin(request, "super_admin");
  if ("response" in auth) return auth.response;
  const { offerId } = await ctx.params;
  const body = await parseBody(request);
  const before = getOfferById(offerId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const note = pick(body, "note");
  const updated = updateOfferById(offerId, {
    offer_status: "published",
    reviewed_by: auth.session.adminId,
    published_at: new Date().toISOString(),
    ...(note !== undefined && { review_note: note }),
  });
  audit(auth.session, {
    action: "offer.approve",
    entity_type: "offer",
    entity_id: offerId,
    before: { offer_status: before.offer_status },
    after: { offer_status: "published" },
    ...(note !== undefined && { note }),
  });
  audit(auth.session, {
    action: "offer.publish",
    entity_type: "offer",
    entity_id: offerId,
  });
  return respond(request, { offer: updated }, `/admin/offers/${offerId}`);
}
