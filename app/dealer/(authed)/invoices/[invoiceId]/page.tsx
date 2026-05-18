import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { formatDateTimeAz } from "@/lib/format/date";
import { getInvoiceForDealer } from "@/lib/invoices/store";
import { INVOICE_STATUS_LABEL_AZ } from "@/lib/invoices/types";
import { listPaymentProofs } from "@/lib/payments/store";
import { PAYMENT_PROOF_STATUS_LABEL_AZ } from "@/lib/payments/types";

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
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{inv.invoice_number}</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Reklam tələbi: {inv.ad_request_id}
          </p>
        </div>
        <Badge tone="brand">{INVOICE_STATUS_LABEL_AZ[inv.status]}</Badge>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Məbləğ"
          value={`${inv.amount.toLocaleString("az-AZ")} ${inv.currency}`}
        />
        <Field label="Son ödəniş tarixi" value={inv.due_at} />
        <Field label="Yaradılıb" value={formatDateTimeAz(inv.created_at)} />
        <Field label="Yenilənib" value={formatDateTimeAz(inv.updated_at)} />
        {inv.notes ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Qeyd
            </p>
            <p className="mt-1 text-sm text-foreground">{inv.notes}</p>
          </div>
        ) : null}
      </Card>

      {canUpload ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Ödəniş təsdiqi yüklə
          </h2>
          <form
            action="/api/dealer/payment-proof"
            method="post"
            className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:grid-cols-2"
          >
            <input type="hidden" name="invoice_id" value={inv.invoice_id} />
            <Input
              name="reference"
              label="Köçürmə referansı"
              required
              placeholder="BANK-2026-..."
            />
            <Input
              name="file_ref"
              label="Fayl referansı (opsional)"
              placeholder="link və ya qeyd"
            />
            <div className="sm:col-span-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Qeyd
                </span>
                <textarea
                  name="proof_note"
                  rows={3}
                  className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Yüklə</Button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Bu fakturaya yüklədiyim təsdiqlər
        </h2>
        {proofs.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Hələ təsdiq yükləməmisiniz.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {proofs.map((p) => (
              <li
                key={p.payment_proof_id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">
                  {p.reference}
                </span>
                <span className="text-foreground-muted">
                  {formatDateTimeAz(p.uploaded_at)}
                </span>
                <Badge tone="blue" size="sm">
                  {PAYMENT_PROOF_STATUS_LABEL_AZ[p.status]}
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
