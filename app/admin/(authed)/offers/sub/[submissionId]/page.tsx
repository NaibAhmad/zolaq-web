import { notFound } from "next/navigation";
import { ApprovalActions } from "@/components/admin/ApprovalActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/Card";
import { getDealer } from "@/lib/admin";
import { getSubmission } from "@/lib/dealer/submissions/store";
import { formatDateTimeAz } from "@/lib/format/date";

export default async function AdminSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const submission = getSubmission(submissionId);
  if (!submission) notFound();
  const dealer = getDealer(submission.dealer_id);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Müraciət: {submission.kind}</h1>
        <StatusBadge status={submission.status} />
      </header>

      <Card padding="md">
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <Detail label="Diler" value={dealer?.display_name ?? submission.dealer_id} />
          <Detail label="Göndərən" value={submission.submitted_by} />
          <Detail label="Yaradılıb" value={formatDateTimeAz(submission.created_at)} />
          <Detail label="Yenilənib" value={formatDateTimeAz(submission.updated_at)} />
          {submission.review_note ? (
            <Detail label="Reviewer qeydi" value={submission.review_note} />
          ) : null}
        </dl>
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Payload</h2>
        <pre className="overflow-x-auto rounded-[var(--radius)] bg-surface-muted p-3 text-xs">
          {JSON.stringify(submission.payload, null, 2)}
        </pre>
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-sm font-semibold">Təsdiq əməliyyatları</h2>
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
