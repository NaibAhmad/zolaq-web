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
  if (!note) {
    return NextResponse.json({ error: "note required" }, { status: 400 });
  }
  const updated = updateOfferById(offerId, {
    offer_status: "needs_revision",
    reviewed_by: auth.session.adminId,
    review_note: note,
  });
  audit(auth.session, {
    action: "offer.request_revision",
    entity_type: "offer",
    entity_id: offerId,
    before: { offer_status: before.offer_status },
    after: { offer_status: "needs_revision" },
    note,
  });
  return respond(request, { offer: updated }, `/admin/offers/${offerId}`);
}
