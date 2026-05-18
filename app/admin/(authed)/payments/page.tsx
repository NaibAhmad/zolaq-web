import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { listDealers } from "@/lib/admin";
import { formatDateTimeAz } from "@/lib/format/date";
import { getInvoice } from "@/lib/invoices/store";
import { listPaymentProofs } from "@/lib/payments/store";
import {
  PAYMENT_PROOF_STATUS_LABEL_AZ,
  type PaymentProofStatus,
} from "@/lib/payments/types";

const TONE: Record<PaymentProofStatus, "warning" | "success" | "danger"> = {
  pending_review: "warning",
  approved: "success",
  rejected: "danger",
};

export default function AdminPaymentsPage() {
  const proofs = listPaymentProofs();
  const dealers = new Map(
    listDealers().map((d) => [d.dealer_id, d.display_name]),
  );
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">Ödəniş təsdiqləri</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Dilerlərin yüklədiyi ödəniş qəbzləri. Təsdiq edilmiş ödəniş fakturanı
          {" "}<code>paid</code> statusuna keçirir və kampaniyanı aktivləşdirməyə imkan verir.
        </p>
      </header>
      <AdminTable
        rows={proofs}
        rowKey={(p) => p.payment_proof_id}
        empty="Hələ təsdiqə göndərilmiş ödəniş yoxdur."
        columns={[
          {
            key: "ref",
            header: "Referans",
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
            header: "Diler",
            cell: (p) => dealers.get(p.dealer_id) ?? p.dealer_id,
          },
          {
            key: "invoice",
            header: "Faktura",
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
            header: "Yüklənib",
            cell: (p) => formatDateTimeAz(p.uploaded_at),
          },
          {
            key: "status",
            header: "Status",
            cell: (p) => (
              <Badge tone={TONE[p.status]} size="sm">
                {PAYMENT_PROOF_STATUS_LABEL_AZ[p.status]}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
