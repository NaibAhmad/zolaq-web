import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { formatDateTimeAz } from "@/lib/format/date";
import { getInvoiceForDealer } from "@/lib/invoices/store";
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

export default async function DealerPaymentProofPage() {
  const session = (await getDealerSession())!;
  const proofs = listPaymentProofs({ dealer_id: session.dealerId });
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold">Ödəniş təsdiqlərim</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Fakturaya yüklədiyiniz ödəniş qəbzləri və yoxlama statusu.
        </p>
      </header>
      <AdminTable
        rows={proofs}
        rowKey={(p) => p.payment_proof_id}
        empty="Hələ ödəniş təsdiqi yükləməmisiniz."
        columns={[
          {
            key: "ref",
            header: "Referans",
            cell: (p) => p.reference,
          },
          {
            key: "invoice",
            header: "Faktura",
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
          {
            key: "note",
            header: "Reviewer qeydi",
            cell: (p) => p.admin_review_note ?? "—",
          },
        ]}
      />
    </div>
  );
}
