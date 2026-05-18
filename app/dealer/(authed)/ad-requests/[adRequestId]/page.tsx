import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getAdRequestForDealer } from "@/lib/ads/store";
import {
  AD_PACKAGE_LABEL_AZ,
  AD_PLACEMENT_LABEL_AZ,
  AD_STATUS_LABEL_AZ,
} from "@/lib/ads/labels";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { formatDateAz } from "@/lib/format/date";
import { listInvoices } from "@/lib/invoices/store";
import { INVOICE_STATUS_LABEL_AZ } from "@/lib/invoices/types";

export default async function DealerAdRequestDetailPage({
  params,
}: {
  params: Promise<{ adRequestId: string }>;
}) {
  const session = (await getDealerSession())!;
  const { adRequestId } = await params;
  const row = getAdRequestForDealer(adRequestId, session.dealerId);
  if (!row) notFound();
  const invoices = listInvoices({
    ad_request_id: adRequestId,
    dealer_id: session.dealerId,
  });
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {AD_PACKAGE_LABEL_AZ[row.package_type]}
          </h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            ID: <code className="text-foreground">{row.ad_request_id}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {row.label ? <Badge tone="orange">{row.label}</Badge> : null}
          <Badge tone="brand">{AD_STATUS_LABEL_AZ[row.status]}</Badge>
        </div>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Yerləşmə"
          value={AD_PLACEMENT_LABEL_AZ[row.placement] ?? row.placement}
        />
        <Field label="İstənən başlanğıc" value={row.start_date ?? "—"} />
        <Field label="İstənən bitmə" value={row.end_date ?? "—"} />
        <Field label="Yenilənib" value={formatDateAz(row.updated_at)} />
        {row.campaign_note ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Qeyd
            </p>
            <p className="mt-1 text-sm text-foreground">{row.campaign_note}</p>
          </div>
        ) : null}
        {row.review_note ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">
              Zolaq qeydi
            </p>
            <p className="mt-1 text-sm text-foreground">{row.review_note}</p>
          </div>
        ) : null}
        {row.rejection_reason ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">
              Rədd səbəbi
            </p>
            <p className="mt-1 text-sm text-foreground">
              {row.rejection_reason}
            </p>
          </div>
        ) : null}
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Əlaqəli fakturalar
        </h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Faktura yaradıldıqda burada görünəcək.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invoices.map((inv) => (
              <li key={inv.invoice_id}>
                <Link
                  href={`/dealer/invoices/${inv.invoice_id}`}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
                >
                  <span className="font-medium text-foreground">
                    {inv.invoice_number}
                  </span>
                  <span className="text-foreground-muted">
                    {inv.amount.toLocaleString("az-AZ")} {inv.currency}
                  </span>
                  <Badge tone="blue" size="sm">
                    {INVOICE_STATUS_LABEL_AZ[inv.status]}
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
