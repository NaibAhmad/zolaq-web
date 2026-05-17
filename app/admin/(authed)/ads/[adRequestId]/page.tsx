import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listDealers } from "@/lib/admin";
import { getAdRequest } from "@/lib/ads/store";
import {
  AD_PACKAGE_LABEL_AZ,
  AD_PLACEMENT_LABEL_AZ,
  AD_STATUS_LABEL_AZ,
} from "@/lib/ads/labels";
import { AD_LABELS, AD_PLACEMENT_AREAS } from "@/lib/ads/types";
import { listInvoices } from "@/lib/invoices/store";
import { INVOICE_STATUS_LABEL_AZ } from "@/lib/invoices/types";

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function AdminAdDetailPage({
  params,
}: {
  params: Promise<{ adRequestId: string }>;
}) {
  const { adRequestId } = await params;
  const row = getAdRequest(adRequestId);
  if (!row) notFound();
  const dealers = listDealers();
  const dealerName = row.dealer_id
    ? dealers.find((d) => d.dealer_id === row.dealer_id)?.display_name ?? row.dealer_id
    : "Daxili";
  const invoices = listInvoices({ ad_request_id: adRequestId });
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reklam tələbi</h1>
          <p className="mt-1 text-xs text-foreground-muted">
            ID: <code className="text-foreground">{row.ad_request_id}</code>
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Diler: {dealerName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="orange">{row.label ?? "Etiketsiz"}</Badge>
          <Badge tone="brand">{AD_STATUS_LABEL_AZ[row.status]}</Badge>
        </div>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3 sm:grid-cols-2">
        <Field label="Paket" value={AD_PACKAGE_LABEL_AZ[row.package_type]} />
        <Field
          label="Yerləşmə"
          value={AD_PLACEMENT_LABEL_AZ[row.placement] ?? row.placement}
        />
        <Field label="Başlanğıc" value={row.start_date ?? "—"} />
        <Field label="Bitmə" value={row.end_date ?? "—"} />
        <Field
          label="Yaradılıb"
          value={DATE_FMT.format(row.created_at)}
        />
        <Field
          label="Yenilənib"
          value={DATE_FMT.format(row.updated_at)}
        />
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
              Reviewer qeydi
            </p>
            <p className="mt-1 text-sm text-foreground">{row.review_note}</p>
          </div>
        ) : null}
        {row.rejection_reason ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">
              Rədd səbəbi
            </p>
            <p className="mt-1 text-sm text-foreground">{row.rejection_reason}</p>
          </div>
        ) : null}
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Yenilə (etiket / yerləşmə / tarix / qeyd)
        </h2>
        <form
          action={`/api/internal/ad-requests/${adRequestId}`}
          method="post"
          className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:grid-cols-2"
        >
          <Select
            name="label"
            label="Etiket"
            defaultValue={row.label ?? ""}
            options={[
              { value: "", label: "— Saxla —" },
              ...AD_LABELS.map((l) => ({ value: l, label: l })),
            ]}
          />
          <Select
            name="placement"
            label="Yerləşmə"
            defaultValue={row.placement}
            options={AD_PLACEMENT_AREAS.map((p) => ({
              value: p,
              label: AD_PLACEMENT_LABEL_AZ[p] ?? p,
            }))}
          />
          <Input
            name="start_date"
            label="Başlanğıc"
            type="date"
            defaultValue={row.start_date ?? ""}
          />
          <Input
            name="end_date"
            label="Bitmə"
            type="date"
            defaultValue={row.end_date ?? ""}
          />
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                Kampaniya qeydi
              </span>
              <textarea
                name="campaign_note"
                rows={2}
                defaultValue={row.campaign_note ?? ""}
                className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="secondary">
              Saxla
            </Button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          İş axını
        </h2>
        <div className="flex flex-wrap gap-3">
          <form
            action={`/api/internal/ad-requests/${adRequestId}/approve`}
            method="post"
          >
            <Button type="submit" variant="primary">
              Təsdiqlə / növbəti addım
            </Button>
          </form>
          <form
            action={`/api/internal/ad-requests/${adRequestId}/request-revision`}
            method="post"
            className="flex items-end gap-2"
          >
            <Input name="note" label="Düzəliş qeydi" required />
            <Button type="submit" variant="secondary">
              Düzəliş tələb et
            </Button>
          </form>
          <form
            action={`/api/internal/ad-requests/${adRequestId}/reject`}
            method="post"
            className="flex items-end gap-2"
          >
            <Input name="note" label="Rədd səbəbi" required />
            <Button type="submit" variant="danger">
              Rədd et
            </Button>
          </form>
          <form
            action={`/api/internal/ad-requests/${adRequestId}/activate`}
            method="post"
          >
            <Button type="submit" variant="dark">
              Aktivləşdir
            </Button>
          </form>
        </div>
        <p className="text-xs text-foreground-muted">
          Aktivləşdirmə üçün əlaqəli faktura `paid` olmalı və etiket təyin
          edilməlidir.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Əlaqəli fakturalar
          </h2>
          <ButtonLink
            href={`/admin/invoices/new?ad_request_id=${row.ad_request_id}`}
            variant="secondary"
            size="sm"
          >
            Faktura yarat
          </ButtonLink>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Hələ faktura yaradılmayıb.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invoices.map((inv) => (
              <li key={inv.invoice_id}>
                <Link
                  href={`/admin/invoices/${inv.invoice_id}`}
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
