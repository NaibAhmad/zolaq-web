import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { listDealers } from "@/lib/admin";
import { getAdRequest } from "@/lib/ads/store";
import { formatDateTimeAz } from "@/lib/format/date";
import { getInvoice } from "@/lib/invoices/store";
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

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const inv = getInvoice(invoiceId);
  if (!inv) notFound();
  const ad = getAdRequest(inv.ad_request_id);
  const dealer = inv.dealer_id
    ? listDealers().find((d) => d.dealer_id === inv.dealer_id)
    : null;
  const proofs = listPaymentProofs({ invoice_id: invoiceId });
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{inv.invoice_number}</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {dealer?.display_name ?? t("adminCommercial.internalDealer")} ·{" "}
            <Link
              className="hover:underline"
              href={`/admin/ads/${inv.ad_request_id}`}
            >
              {inv.ad_request_id}
            </Link>
          </p>
        </div>
        <Badge tone="brand">{t(INVOICE_STATUS_KEY[inv.status])}</Badge>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3 sm:grid-cols-2">
        <Field
          label={t("adminCommercial.amountLabel")}
          value={`${inv.amount.toLocaleString("az-AZ")} ${inv.currency}`}
        />
        <Field label={t("adminCommercial.dueDate")} value={inv.due_at} />
        <Field label={t("adminOffers.detailCreatedAt")} value={formatDateTimeAz(inv.created_at)} />
        <Field label={t("adminCommercial.updatedCol")} value={formatDateTimeAz(inv.updated_at)} />
        {inv.notes ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              {t("adminCommercial.notesLabel")}
            </p>
            <p className="mt-1 text-sm text-foreground">{inv.notes}</p>
          </div>
        ) : null}
        {ad?.label ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              {t("adminCommercial.adsLabel")}
            </p>
            <Badge tone="orange" size="sm">{ad.label}</Badge>
          </div>
        ) : null}
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          {t("adminCommercial.statusActionsTitle")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <form
            action={`/api/internal/invoices/${inv.invoice_id}/mark-overdue`}
            method="post"
          >
            <Button type="submit" variant="secondary">
              {t("adminCommercial.markOverdue")}
            </Button>
          </form>
          <form
            action={`/api/internal/invoices/${inv.invoice_id}/cancel`}
            method="post"
            className="flex items-end gap-2"
          >
            <Input name="note" label={t("adminCommercial.cancelReason")} required />
            <Button type="submit" variant="danger">
              {t("adminCommercial.cancelAction")}
            </Button>
          </form>
        </div>
        <p className="text-xs text-foreground-muted">{t("adminCommercial.paymentPath")}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          {t("adminCommercial.paymentProofsTitle")}
        </h2>
        {proofs.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("adminCommercial.emptyPaymentProofs")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {proofs.map((p) => (
              <li key={p.payment_proof_id}>
                <Link
                  href={`/admin/payments/${p.payment_proof_id}`}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
                >
                  <span className="font-medium text-foreground">{p.reference}</span>
                  <span className="text-foreground-muted">
                    {formatDateTimeAz(p.uploaded_at)}
                  </span>
                  <Badge tone="blue" size="sm">
                    {t(PAYMENT_STATUS_KEY[p.status])}
                  </Badge>
                </Link>
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
