import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { listDealers } from "@/lib/admin";
import { formatDateTimeAz } from "@/lib/format/date";
import { getInvoice } from "@/lib/invoices/store";
import { getPaymentProof } from "@/lib/payments/store";
import { PAYMENT_PROOF_STATUS_LABEL_AZ } from "@/lib/payments/types";

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const proof = getPaymentProof(paymentId);
  if (!proof) notFound();
  const inv = getInvoice(proof.invoice_id);
  const dealer = listDealers().find((d) => d.dealer_id === proof.dealer_id);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Ödəniş təsdiqi</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {dealer?.display_name ?? proof.dealer_id}
          </p>
        </div>
        <Badge tone="brand">{PAYMENT_PROOF_STATUS_LABEL_AZ[proof.status]}</Badge>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3 sm:grid-cols-2">
        <Field label="Referans" value={proof.reference} />
        <Field
          label="Yüklənib"
          value={`${formatDateTimeAz(proof.uploaded_at)} · ${proof.uploaded_by}`}
        />
        {proof.file_ref ? (
          <Field label="Fayl referansı" value={proof.file_ref} />
        ) : null}
        {inv ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Faktura
            </p>
            <Link
              href={`/admin/invoices/${inv.invoice_id}`}
              className="mt-0.5 block text-sm text-accent-blue hover:underline"
            >
              {inv.invoice_number} · {inv.amount.toLocaleString("az-AZ")}{" "}
              {inv.currency}
            </Link>
          </div>
        ) : null}
        {proof.proof_note ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Diler qeydi
            </p>
            <p className="mt-1 text-sm text-foreground">{proof.proof_note}</p>
          </div>
        ) : null}
        {proof.admin_review_note ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Reviewer qeydi
            </p>
            <p className="mt-1 text-sm text-foreground">{proof.admin_review_note}</p>
          </div>
        ) : null}
      </Card>

      {proof.status === "pending_review" ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Yoxlama qərarı
          </h2>
          <div className="flex flex-wrap gap-3">
            <form
              action={`/api/internal/payments/${proof.payment_proof_id}/approve`}
              method="post"
              className="flex items-end gap-2"
            >
              <Input name="note" label="Təsdiq qeydi" placeholder="opsional" />
              <Button type="submit" variant="primary">
                Təsdiqlə
              </Button>
            </form>
            <form
              action={`/api/internal/payments/${proof.payment_proof_id}/reject`}
              method="post"
              className="flex items-end gap-2"
            >
              <Input name="note" label="Rədd səbəbi" required />
              <Button type="submit" variant="danger">
                Rədd et
              </Button>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}
