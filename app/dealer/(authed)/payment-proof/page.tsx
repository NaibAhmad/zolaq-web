import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { formatDateTimeAz } from "@/lib/format/date";
import { getInvoiceForDealer } from "@/lib/invoices/store";
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

export default async function DealerPaymentProofPage() {
  const session = (await getDealerSession())!;
  const proofs = listPaymentProofs({ dealer_id: session.dealerId });
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">{t("dealerPayments.titleMy")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">{t("dealerPayments.descriptionMy")}</p>
      </header>
      <AdminTable
        rows={proofs}
        rowKey={(p) => p.payment_proof_id}
        empty={t("dealerPayments.emptyMy")}
        columns={[
          {
            key: "ref",
            header: t("dealerPayments.refCol"),
            cell: (p) => p.reference,
          },
          {
            key: "invoice",
            header: t("dealerPayments.invoiceCol"),
            cell: (p) => {
              const inv = getInvoiceForDealer(p.invoice_id, session.dealerId);
              if (!inv) return p.invoice_id;
              return (
                <Link
                  href={`/dealer/invoices/${inv.invoice_id}`}
                  className="hover:underline"
                >
                  {inv.invoice_number}
                </Link>
              );
            },
          },
          {
            key: "uploaded",
            header: t("dealerPayments.uploadedCol"),
            cell: (p) => formatDateTimeAz(p.uploaded_at),
          },
          {
            key: "status",
            header: t("dealerPayments.statusCol"),
            cell: (p) => (
              <Badge tone={TONE[p.status]} size="sm">
                {t(STATUS_KEY[p.status])}
              </Badge>
            ),
          },
          {
            key: "note",
            header: t("dealerPayments.reviewerNoteCol"),
            cell: (p) => p.admin_review_note ?? "—",
          },
        ]}
      />
    </div>
  );
}
