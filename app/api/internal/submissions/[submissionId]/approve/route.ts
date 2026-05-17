import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { applyApprovedSubmission, getSubmission } from "@/lib/dealer/submissions/store";

export async function POST(request: NextRequest, ctx: { params: Promise<{ submissionId: string }> }) {
  // Approving a submission triggers a publish to the canonical entity, which
  // is gated to super_admin (the Master Admin tier).
  const auth = await requireAdmin(request, "super_admin");
  if ("response" in auth) return auth.response;
  const { submissionId } = await ctx.params;
  const body = await parseBody(request);
  const note = pick(body, "note");
  const before = getSubmission(submissionId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const result = applyApprovedSubmission({
    submission_id: submissionId,
    reviewer_id: auth.session.adminId,
    reviewer_role: auth.session.role,
    ...(note !== undefined && { review_note: note }),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  audit(auth.session, {
    action: "submission.approve",
    entity_type: "submission",
    entity_id: submissionId,
    before: { status: before.status },
    after: { status: result.submission.status },
    ...(note !== undefined && { note }),
  });
  return respond(request, { submission: result.submission }, "/admin/offers");
}
