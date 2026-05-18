import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { listDealers } from "@/lib/admin";
import { formatDateAz } from "@/lib/format/date";
import { listInvoices } from "@/lib/invoices/store";
import type { InvoiceStatus } from "@/lib/invoices/types";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";

const STATUS_TONE: Record<InvoiceStatus, "blue" | "warning" | "success" | "danger" | "muted"> = {
  pending: "muted",
  invoice_sent: "blue",
  payment_uploaded: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "muted",
};

const STATUS_KEY: Record<InvoiceStatus, TranslationKey> = {
  pending: "adminCommercial.invoiceStatus_pending",
  invoice_sent: "adminCommercial.invoiceStatus_invoice_sent",
  payment_uploaded: "adminCommercial.invoiceStatus_payment_uploaded",
  paid: "adminCommercial.invoiceStatus_paid",
  overdue: "adminCommercial.invoiceStatus_overdue",
  cancelled: "adminCommercial.invoiceStatus_cancelled",
};

export default async function AdminInvoicesPage() {
  const invoices = listInvoices();
  const dealers = new Map(
    listDealers().map((d) => [d.dealer_id, d.display_name]),
  );
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("adminCommercial.invoicesTitle")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t("adminCommercial.invoicesDescription")}</p>
        </div>
        <ButtonLink href="/admin/invoices/new">{t("adminCommercial.newInvoice")}</ButtonLink>
      </header>
      <AdminTable
        rows={invoices}
        rowKey={(r) => r.invoice_id}
        empty={t("adminCommercial.emptyInvoices")}
        columns={[
          {
            key: "number",
            header: t("adminCommercial.number"),
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
            header: t("adminCommercial.dealer"),
            cell: (r) =>
              r.dealer_id ? dealers.get(r.dealer_id) ?? r.dealer_id : t("adminCommercial.internalDealer"),
          },
          {
            key: "amount",
            header: t("adminCommercial.amountLabel"),
            cell: (r) => `${r.amount.toLocaleString("az-AZ")} ${r.currency}`,
          },
          { key: "due", header: t("adminCommercial.dueDate"), cell: (r) => r.due_at },
          {
            key: "status",
            header: t("adminCommercial.statusCol"),
            cell: (r) => (
              <Badge tone={STATUS_TONE[r.status]} size="sm">
                {t(STATUS_KEY[r.status])}
              </Badge>
            ),
          },
          {
            key: "updated",
            header: t("adminCommercial.updatedCol"),
            cell: (r) => formatDateAz(r.updated_at),
          },
        ]}
      />
    </div>
  );
}
