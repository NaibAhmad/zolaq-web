import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { listSubmissions } from "@/lib/dealer/submissions/store";

export default async function DealerSubmissionsPage() {
  const session = (await getDealerSession())!;
  const items = listSubmissions({ dealer_id: session.dealerId });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Müraciətlər</h1>
      <AdminTable
        rows={items}
        rowKey={(s) => s.submission_id}
        empty="Hələ müraciət yoxdur."
        columns={[
          { key: "kind", header: "Növ", cell: (s) => s.kind },
          { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
          {
            key: "note",
            header: "Reviewer qeydi",
            cell: (s) => s.review_note ?? "—",
          },
          {
            key: "updated",
            header: "Yenilənib",
            cell: (s) => new Date(s.updated_at).toLocaleString(),
          },
          {
            key: "action",
            header: "Əməliyyat",
            cell: (s) =>
              s.status === "needs_revision" ? (
                <form action={`/api/dealer/submissions/${s.submission_id}/resubmit`} method="post">
                  <Button type="submit" variant="primary">
                    Yenidən göndər
                  </Button>
                </form>
              ) : (
                <span className="text-foreground-muted">—</span>
              ),
          },
        ]}
      />

      <Card padding="md">
        <p className="text-sm text-foreground-muted">
          Müraciət təsdiqlənənədək dəyişiklik publik saytda görünmür. Statuslar:
          göndərildi → yoxlamada → təsdiq / düzəliş tələbi / rədd.
        </p>
      </Card>
    </div>
  );
}
