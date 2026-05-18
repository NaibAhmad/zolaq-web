import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { listDealers } from "@/lib/admin";
import { formatDateTimeAz } from "@/lib/format/date";
import { getInvoice } from "@/lib/invoices/store";
import { listPaymentProofs } from "@/lib/payments/store";
import type { PaymentProofStatus } from "@/lib/payments/types";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";

const TONE: Record<PaymentProofStatus, "warning" | "success" | "danger"> = {
  pending_review: "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_KEY: Record<PaymentProofStatus, TranslationKey> = {
  pending_review: "adminCommercial.paymentStatus_pending_review",
  approved: "adminCommercial.paymentStatus_approved",
  rejected: "adminCommercial.paymentStatus_rejected",
};

export default async function AdminPaymentsPage() {
  const proofs = listPaymentProofs();
  const dealers = new Map(
    listDealers().map((d) => [d.dealer_id, d.display_name]),
  );
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">{t("adminCommercial.paymentsTitleHead")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("adminCommercial.paymentsDescriptionDetail", { code: "`paid`" })}
        </p>
      </header>
      <AdminTable
        rows={proofs}
        rowKey={(p) => p.payment_proof_id}
        empty={t("adminCommercial.emptyPaymentsList")}
        columns={[
          {
            key: "ref",
            header: t("adminCommercial.referenceCol"),
            cell: (p) => (
              <Link
                href={`/admin/payments/${p.payment_proof_id}`}
                className="font-medium hover:underline"
              >
                {p.reference}
              </Link>
            ),
          },
          {
            key: "dealer",
            header: t("adminCommercial.dealer"),
            cell: (p) => dealers.get(p.dealer_id) ?? p.dealer_id,
          },
          {
            key: "invoice",
            header: t("adminCommercial.invoiceCol"),
            cell: (p) => {
              const inv = getInvoice(p.invoice_id);
              if (!inv) return p.invoice_id;
              return (
                <Link
                  href={`/admin/invoices/${inv.invoice_id}`}
                  className="hover:underline"
                >
                  {inv.invoice_number}
                </Link>
              );
            },
          },
          {
            key: "uploaded",
            header: t("adminCommercial.uploadedCol"),
            cell: (p) => formatDateTimeAz(p.uploaded_at),
          },
          {
            key: "status",
            header: t("adminCommercial.statusCol"),
            cell: (p) => (
              <Badge tone={TONE[p.status]} size="sm">
                {t(STATUS_KEY[p.status])}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
