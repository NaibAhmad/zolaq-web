// Re-submit a "needs_revision" submission. Dealer can edit the payload via
// the offer/profile pages — those create a new submission. This endpoint
// re-opens the current submission back into the queue. Only the submission's
// owner dealer can call it.

import { NextResponse, type NextRequest } from "next/server";
import { audit, requireDealerPermission, respond } from "@/lib/admin/api-utils";
import {
  getSubmissionForDealer,
  transitionSubmission,
} from "@/lib/dealer/submissions/store";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ submissionId: string }> },
) {
  const auth = await requireDealerPermission(request, "dealer.submission.view_own");
  if ("response" in auth) return auth.response;
  const { submissionId } = await ctx.params;
  const sub = getSubmissionForDealer(submissionId, auth.session.dealerId);
  if (!sub) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (sub.status !== "needs_revision") {
    return NextResponse.json(
      { error: "only needs_revision submissions can be resubmitted" },
      { status: 400 },
    );
  }
  const result = transitionSubmission({
    submission_id: submissionId,
    to_status: "submitted",
  });
  audit(auth.session, {
    action: "submission.resubmit",
    entity_type: "submission",
    entity_id: submissionId,
    before: { status: "needs_revision" },
    after: { status: "submitted" },
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return respond(request, { submission: result.submission }, "/dealer/submissions");
}
