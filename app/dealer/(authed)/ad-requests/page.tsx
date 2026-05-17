import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { listAdRequests } from "@/lib/ads/store";
import {
  AD_PACKAGE_LABEL_AZ,
  AD_PLACEMENT_LABEL_AZ,
  AD_STATUS_LABEL_AZ,
} from "@/lib/ads/labels";
import { getDealerSession } from "@/lib/auth/dealer-session";

const STATUS_TONE: Record<string, "blue" | "warning" | "success" | "danger" | "muted" | "orange"> = {
  draft: "muted",
  submitted: "blue",
  under_review: "warning",
  invoice_required: "warning",
  invoice_sent: "blue",
  payment_uploaded: "warning",
  paid: "success",
  approved: "success",
  active: "success",
  paused: "warning",
  expired: "muted",
  rejected: "danger",
  cancelled: "muted",
};

export default async function DealerAdRequestsPage() {
  const session = (await getDealerSession())!;
  const rows = listAdRequests({ dealer_id: session.dealerId });
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reklam tələblərim</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Yerləşdirmə üçün göndərdiyiniz tələblər və statusları.
          </p>
        </div>
        <ButtonLink href="/dealer/ad-requests/new">Yeni tələb</ButtonLink>
      </header>
      <AdminTable
        rows={rows}
        rowKey={(r) => r.ad_request_id}
        empty="Hələ tələb göndərməmisiniz."
        columns={[
          {
            key: "id",
            header: "Tələb",
            cell: (r) => (
              <Link
                href={`/dealer/ad-requests/${r.ad_request_id}`}
                className="font-medium hover:underline"
              >
                {AD_PACKAGE_LABEL_AZ[r.package_type]}
                <span className="mt-0.5 block text-xs text-foreground-muted">
                  {r.ad_request_id}
                </span>
              </Link>
            ),
          },
          {
            key: "placement",
            header: "Yerləşmə",
            cell: (r) => AD_PLACEMENT_LABEL_AZ[r.placement] ?? r.placement,
          },
          {
            key: "label",
            header: "Etiket",
            cell: (r) =>
              r.label ? (
                <Badge tone="orange" size="sm">
                  {r.label}
                </Badge>
              ) : (
                <span className="text-xs text-foreground-muted">—</span>
              ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <Badge tone={STATUS_TONE[r.status] ?? "neutral"} size="sm">
                {AD_STATUS_LABEL_AZ[r.status] ?? r.status}
              </Badge>
            ),
          },
          {
            key: "dates",
            header: "Tarix",
            cell: (r) => (
              <span className="text-xs text-foreground-muted">
                {r.start_date ?? "—"} → {r.end_date ?? "—"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
