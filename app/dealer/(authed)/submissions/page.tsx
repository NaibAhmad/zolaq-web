import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { listSubmissions } from "@/lib/dealer/submissions/store";
import { formatDateTimeAz } from "@/lib/format/date";
import { getServerT } from "@/lib/i18n/server";

export default async function DealerSubmissionsPage() {
  const session = (await getDealerSession())!;
  const t = await getServerT();
  const items = listSubmissions({ dealer_id: session.dealerId });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("dealerSubmissions.title")}</h1>
      <AdminTable
        rows={items}
        rowKey={(s) => s.submission_id}
        empty={t("dealerSubmissions.empty")}
        columns={[
          { key: "kind", header: t("adminCatalog.fullName"), cell: (s) => s.kind },
          { key: "status", header: t("adminLeads.status"), cell: (s) => <StatusBadge status={s.status} /> },
          {
            key: "note",
            header: t("dealerSubmissions.reviewerNote"),
            cell: (s) => s.review_note ?? "—",
          },
          {
            key: "updated",
            header: t("dealerSubmissions.tableUpdated"),
            cell: (s) => formatDateTimeAz(s.updated_at),
          },
          {
            key: "action",
            header: t("dealerSubmissions.action"),
            cell: (s) =>
              s.status === "needs_revision" ? (
                <form action={`/api/dealer/submissions/${s.submission_id}/resubmit`} method="post">
                  <Button type="submit" variant="primary">
                    {t("dealerSubmissions.resubmit")}
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
          {t("dealerSubmissions.infoBanner")}
        </p>
      </Card>
    </div>
  );
}
