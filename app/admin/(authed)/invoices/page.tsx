import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { listDealers } from "@/lib/admin";
import { formatDateAz } from "@/lib/format/date";
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

export default function AdminInvoicesPage() {
  const invoices = listInvoices();
  const dealers = new Map(
    listDealers().map((d) => [d.dealer_id, d.display_name]),
  );
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fakturalar</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Reklam tələblərinə bağlı manual fakturalar və ödəniş statusları.
          </p>
        </div>
        <ButtonLink href="/admin/invoices/new">Yeni faktura</ButtonLink>
      </header>
      <AdminTable
        rows={invoices}
        rowKey={(r) => r.invoice_id}
        empty="Hələ faktura yoxdur."
        columns={[
          {
            key: "number",
            header: "Nömrə",
            cell: (r) => (
              <Link
                href={`/admin/invoices/${r.invoice_id}`}
                className="font-medium hover:underline"
              >
                {r.invoice_number}
              </Link>
            ),
          },
          {
            key: "dealer",
            header: "Diler",
            cell: (r) =>
              r.dealer_id ? dealers.get(r.dealer_id) ?? r.dealer_id : "Daxili",
          },
          {
            key: "amount",
            header: "Məbləğ",
            cell: (r) => `${r.amount.toLocaleString("az-AZ")} ${r.currency}`,
          },
          { key: "due", header: "Son tarix", cell: (r) => r.due_at },
          {
            key: "status",
            header: "Status",
            cell: (r) => (
              <Badge tone={STATUS_TONE[r.status]} size="sm">
                {INVOICE_STATUS_LABEL_AZ[r.status]}
              </Badge>
            ),
          },
          {
            key: "updated",
            header: "Yenilənib",
            cell: (r) => formatDateAz(r.updated_at),
          },
        ]}
      />
    </div>
  );
}
