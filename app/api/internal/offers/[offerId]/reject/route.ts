import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getOfferById, updateOfferById } from "@/lib/admin";

export async function POST(request: NextRequest, ctx: { params: Promise<{ offerId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { offerId } = await ctx.params;
  const body = await parseBody(request);
  const before = getOfferById(offerId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const note = pick(body, "note");
  const updated = updateOfferById(offerId, {
    offer_status: "rejected",
    reviewed_by: auth.session.adminId,
    ...(note !== undefined && { review_note: note }),
  });
  audit(auth.session, {
    action: "offer.reject",
    entity_type: "offer",
    entity_id: offerId,
    before: { offer_status: before.offer_status },
    after: { offer_status: "rejected" },
    ...(note !== undefined && { note }),
  });
  return respond(request, { offer: updated }, `/admin/offers/${offerId}`);
}
