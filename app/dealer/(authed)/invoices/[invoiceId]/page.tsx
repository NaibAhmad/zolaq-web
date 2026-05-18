import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { formatDateTimeAz } from "@/lib/format/date";
import { getInvoiceForDealer } from "@/lib/invoices/store";
import type { InvoiceStatus } from "@/lib/invoices/types";
import { listPaymentProofs } from "@/lib/payments/store";
import type { PaymentProofStatus } from "@/lib/payments/types";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";

const INVOICE_STATUS_KEY: Record<InvoiceStatus, TranslationKey> = {
  pending: "adminCommercial.invoiceStatus_pending",
  invoice_sent: "adminCommercial.invoiceStatus_invoice_sent",
  payment_uploaded: "adminCommercial.invoiceStatus_payment_uploaded",
  paid: "adminCommercial.invoiceStatus_paid",
  overdue: "adminCommercial.invoiceStatus_overdue",
  cancelled: "adminCommercial.invoiceStatus_cancelled",
};

const PAYMENT_STATUS_KEY: Record<PaymentProofStatus, TranslationKey> = {
  pending_review: "adminCommercial.paymentStatus_pending_review",
  approved: "adminCommercial.paymentStatus_approved",
  rejected: "adminCommercial.paymentStatus_rejected",
};

export default async function DealerInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const session = (await getDealerSession())!;
  const { invoiceId } = await params;
  const inv = getInvoiceForDealer(invoiceId, session.dealerId);
  if (!inv) notFound();
  const proofs = listPaymentProofs({
    invoice_id: invoiceId,
    dealer_id: session.dealerId,
  });
  const canUpload =
    inv.status === "invoice_sent" || inv.status === "overdue";
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{inv.invoice_number}</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {t("dealerInvoices.adRequestLink")}: {inv.ad_request_id}
          </p>
        </div>
        <Badge tone="brand">{t(INVOICE_STATUS_KEY[inv.status])}</Badge>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("dealerInvoices.amountLabel")}
          value={`${inv.amount.toLocaleString("az-AZ")} ${inv.currency}`}
        />
        <Field label={t("dealerInvoices.dueAtLabel")} value={inv.due_at} />
        <Field label={t("dealerInvoices.createdAt")} value={formatDateTimeAz(inv.created_at)} />
        <Field label={t("dealerInvoices.updatedAt")} value={formatDateTimeAz(inv.updated_at)} />
        {inv.notes ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              {t("dealerInvoices.noteLabel")}
            </p>
            <p className="mt-1 text-sm text-foreground">{inv.notes}</p>
          </div>
        ) : null}
      </Card>

      {canUpload ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            {t("dealerInvoices.uploadProofTitle")}
          </h2>
          <form
            action="/api/dealer/payment-proof"
            method="post"
            className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="invoice_id" value={inv.invoice_id} />
            <Input
              name="reference"
              label={t("dealerInvoices.reference")}
              required
              placeholder={t("dealerInvoices.referencePlaceholder")}
            />
            <Input
              name="file_ref"
              label={t("dealerInvoices.fileRef")}
              placeholder={t("dealerInvoices.fileRefPlaceholder")}
            />
            <div className="sm:col-span-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {t("dealerInvoices.noteLabel")}
                </span>
                <textarea
                  name="proof_note"
                  rows={3}
                  className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">{t("dealerInvoices.uploadAction")}</Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          {t("dealerInvoices.proofsTitle")}
        </h2>
        {proofs.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("dealerInvoices.proofsEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {proofs.map((p) => (
              <li
                key={p.payment_proof_id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">{p.reference}</span>
                <span className="text-foreground-muted">{formatDateTimeAz(p.uploaded_at)}</span>
                <Badge tone="blue" size="sm">
                  {t(PAYMENT_STATUS_KEY[p.status])}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
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
