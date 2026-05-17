import { NextResponse, type NextRequest } from "next/server";
import { audit, parseBody, pick, requireAdmin, respond } from "@/lib/admin/api-utils";
import { getSubmission, transitionSubmission } from "@/lib/dealer/submissions/store";

export async function POST(request: NextRequest, ctx: { params: Promise<{ submissionId: string }> }) {
  const auth = await requireAdmin(request, "super_admin", "internal_ops_admin");
  if ("response" in auth) return auth.response;
  const { submissionId } = await ctx.params;
  const body = await parseBody(request);
  const note = pick(body, "note");
  if (!note) return NextResponse.json({ error: "note required" }, { status: 400 });
  const before = getSubmission(submissionId);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const result = transitionSubmission({
    submission_id: submissionId,
    to_status: "needs_revision",
    reviewer_id: auth.session.adminId,
    review_note: note,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  audit(auth.session, {
    action: "submission.request_revision",
    entity_type: "submission",
    entity_id: submissionId,
    before: { status: before.status },
    after: { status: "needs_revision" },
    note,
  });
  return respond(request, { submission: result.submission }, "/admin/offers");
}
