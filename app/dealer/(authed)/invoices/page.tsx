import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { getServerT } from "@/lib/i18n/server";
import { listInvoices } from "@/lib/invoices/store";
import { INVOICE_STATUS_LABEL_AZ, type InvoiceStatus } from "@/lib/invoices/types";

const STATUS_TONE: Record<InvoiceStatus, "blue" | "warning" | "success" | "danger" | "muted"> = {
  pending: "muted",
  invoice_sent: "blue",
  payment_uploaded: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "muted",
};

export default async function DealerInvoicesPage() {
  const session = (await getDealerSession())!;
  const t = await getServerT();
  const invoices = listInvoices({ dealer_id: session.dealerId });
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">{t("dealerInvoices.title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("dealerInvoices.description")}
        </p>
      </header>
      <AdminTable
        rows={invoices}
        rowKey={(r) => r.invoice_id}
        empty={t("dealerInvoices.empty")}
        columns={[
          {
            key: "number",
            header: t("dealerInvoices.number"),
            cell: (r) => (
              <Link
                href={`/dealer/invoices/${r.invoice_id}`}
                className="font-medium hover:underline"
              >
                {r.invoice_number}
              </Link>
            ),
          },
          {
            key: "amount",
            header: t("dealerInvoices.amount"),
            cell: (r) => `${r.amount.toLocaleString("az-AZ")} ${r.currency}`,
          },
          { key: "due", header: t("dealerInvoices.dueDate"), cell: (r) => r.due_at },
          {
            key: "status",
            header: t("adminLeads.status"),
            cell: (r) => (
              <Badge tone={STATUS_TONE[r.status]} size="sm">
                {INVOICE_STATUS_LABEL_AZ[r.status]}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
