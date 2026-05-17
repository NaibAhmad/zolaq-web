import { NextResponse, type NextRequest } from "next/server";
import { audit, methodOverride, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getMediaAsset, updateMediaAssetStatus, type MediaStatus } from "@/lib/media/repository";
import type { AdminSession } from "@/lib/auth/admin-session";

const ALLOWED_STATUSES: ReadonlySet<MediaStatus> = new Set([
  "uploaded",
  "processing",
  "active",
  "rejected",
  "archived",
]);

const ACTION_FOR_STATUS: Record<MediaStatus, "media.approve" | "media.reject" | "media.archive" | "media.upload"> = {
  active: "media.approve",
  rejected: "media.reject",
  archived: "media.archive",
  uploaded: "media.upload",
  processing: "media.upload",
};

async function patch(
  request: NextRequest,
  mediaId: string,
  body: Record<string, FormDataEntryValue | undefined>,
  session: AdminSession,
): Promise<NextResponse> {
  const before = await getMediaAsset(mediaId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const status = pick(body, "status") as MediaStatus | undefined;
  if (!status || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Yanlış status." }, { status: 400 });
  }

  const updated = await updateMediaAssetStatus(mediaId, status);
  audit(session, {
    action: ACTION_FOR_STATUS[status],
    entity_type: "media",
    entity_id: mediaId,
    before: { status: before.status },
    after: updated ? { status: updated.status } : undefined,
  });

  return respond(request, { media: updated }, "/admin/media");
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ mediaId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const { mediaId } = await ctx.params;
  const body = await parseBody(request);
  if (methodOverride(body, "POST") === "PATCH") {
    return patch(request, mediaId, body, auth.session);
  }
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ mediaId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin", "content_manager");
  if ("response" in auth) return auth.response;
  const { mediaId } = await ctx.params;
  const body = await parseBody(request);
  return patch(request, mediaId, body, auth.session);
}
