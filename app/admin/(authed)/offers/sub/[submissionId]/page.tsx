import { notFound } from "next/navigation";
import { ApprovalActions } from "@/components/admin/ApprovalActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { getDealer } from "@/lib/admin";
import { getSubmission } from "@/lib/dealer/submissions/store";
import { formatDateTimeAz } from "@/lib/format/date";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const submission = getSubmission(submissionId);
  if (!submission) notFound();
  const dealer = getDealer(submission.dealer_id);
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t("adminOffers.submissionDetailTitle", { kind: submission.kind })}
        </h1>
        <StatusBadge status={submission.status} />
      </header>

      <Card padding="md">
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <Detail label={t("adminOffers.detailDealer")} value={dealer?.display_name ?? submission.dealer_id} />
          <Detail label={t("adminOffers.detailSubmittedBy")} value={submission.submitted_by} />
          <Detail label={t("adminOffers.detailCreatedAt")} value={formatDateTimeAz(submission.created_at)} />
          <Detail label={t("adminOffers.detailUpdatedAt")} value={formatDateTimeAz(submission.updated_at)} />
          {submission.review_note ? (
            <Detail label={t("adminOffers.detailReviewerNote")} value={submission.review_note} />
          ) : null}
        </dl>
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">{t("adminOffers.payloadTitle")}</h2>
        <pre className="overflow-x-auto rounded-[var(--radius)] bg-surface-muted p-3 text-xs">
          {JSON.stringify(submission.payload, null, 2)}
        </pre>
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">{t("adminOffers.approvalSectionTitle")}</h2>
        <ApprovalActions
          approveAction={`/api/internal/submissions/${submissionId}/approve`}
          rejectAction={`/api/internal/submissions/${submissionId}/reject`}
          revisionAction={`/api/internal/submissions/${submissionId}/request-revision`}
          disabled={submission.status === "published" || submission.status === "rejected"}
        />
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
