// Sprint 8C: simple media URL submission. No file upload pipeline yet — the
// dealer pastes a URL and we record it as a submission for admin review.

import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireDealerPermission, respond } from "@/lib/admin/api-utils";
import { createSubmission } from "@/lib/dealer/submissions/store";

export async function POST(request: NextRequest) {
  const auth = await requireDealerPermission(request, "dealer.media.upload");
  if ("response" in auth) return auth.response;
  const body = await parseBody(request);
  const image_url = pick(body, "image_url");
  if (!image_url) {
    return NextResponse.json({ error: "image_url required" }, { status: 400 });
  }
  const submission = createSubmission({
    dealer_id: auth.session.dealerId,
    kind: "media",
    payload: {
      image_url,
      image_alt: pick(body, "image_alt"),
      caption: pick(body, "caption"),
    },
    submitted_by: auth.session.contactName,
  });
  audit(auth.session, {
    action: "submission.create",
    entity_type: "submission",
    entity_id: submission.submission_id,
    after: { kind: "media", image_url },
  });
  return respond(request, { submission }, "/dealer/submissions");
}
