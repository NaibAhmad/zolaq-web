import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listDealers } from "@/lib/admin";
import { getAdRequest } from "@/lib/ads/store";
import { AD_LABELS, AD_PLACEMENT_AREAS, type AdPackageType, type AdStatus } from "@/lib/ads/types";
import { formatDateAz } from "@/lib/format/date";
import { listInvoices } from "@/lib/invoices/store";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";
import type { InvoiceStatus } from "@/lib/invoices/types";

const STATUS_KEY: Record<AdStatus, TranslationKey> = {
  draft: "adminCommercial.adStatus_draft",
  submitted: "adminCommercial.adStatus_submitted",
  under_review: "adminCommercial.adStatus_under_review",
  invoice_required: "adminCommercial.adStatus_invoice_required",
  invoice_sent: "adminCommercial.adStatus_invoice_sent",
  payment_uploaded: "adminCommercial.adStatus_payment_uploaded",
  paid: "adminCommercial.adStatus_paid",
  approved: "adminCommercial.adStatus_approved",
  active: "adminCommercial.adStatus_active",
  paused: "adminCommercial.adStatus_paused",
  expired: "adminCommercial.adStatus_expired",
  rejected: "adminCommercial.adStatus_rejected",
  cancelled: "adminCommercial.adStatus_cancelled",
};

const PACKAGE_KEY: Record<AdPackageType, TranslationKey> = {
  verified_dealer_package: "adminCommercial.adPackage_verified_dealer_package",
  premium_dealer_profile: "adminCommercial.adPackage_premium_dealer_profile",
  featured_dealer_placement: "adminCommercial.adPackage_featured_dealer_placement",
  featured_offer: "adminCommercial.adPackage_featured_offer",
  sponsored_catalog_card: "adminCommercial.adPackage_sponsored_catalog_card",
  homepage_sponsored_block: "adminCommercial.adPackage_homepage_sponsored_block",
  content_sponsorship: "adminCommercial.adPackage_content_sponsorship",
  compare_sponsored_offer: "adminCommercial.adPackage_compare_sponsored_offer",
  qa_sponsored_answer: "adminCommercial.adPackage_qa_sponsored_answer",
  bazar_nebzi_sponsored_question: "adminCommercial.adPackage_bazar_nebzi_sponsored_question",
  qualified_lead_package: "adminCommercial.adPackage_qualified_lead_package",
  monthly_dealer_insight_report: "adminCommercial.adPackage_monthly_dealer_insight_report",
};

const INVOICE_STATUS_KEY: Record<InvoiceStatus, TranslationKey> = {
  pending: "adminCommercial.invoiceStatus_pending",
  invoice_sent: "adminCommercial.invoiceStatus_invoice_sent",
  payment_uploaded: "adminCommercial.invoiceStatus_payment_uploaded",
  paid: "adminCommercial.invoiceStatus_paid",
  overdue: "adminCommercial.invoiceStatus_overdue",
  cancelled: "adminCommercial.invoiceStatus_cancelled",
};

function placementKey(p: string): TranslationKey | null {
  const map: Record<string, TranslationKey> = {
    homepage: "adminCommercial.adPlacement_homepage",
    catalog: "adminCommercial.adPlacement_catalog",
    car_detail: "adminCommercial.adPlacement_car_detail",
    compare: "adminCommercial.adPlacement_compare",
    dealer_list: "adminCommercial.adPlacement_dealer_list",
    dealer_detail: "adminCommercial.adPlacement_dealer_detail",
    news_detail: "adminCommercial.adPlacement_news_detail",
    encyclopedia_detail: "adminCommercial.adPlacement_encyclopedia_detail",
    qa: "adminCommercial.adPlacement_qa",
    market_pulse: "adminCommercial.adPlacement_market_pulse",
  };
  return map[p] ?? null;
}

export default async function AdminAdDetailPage({
  params,
}: {
  params: Promise<{ adRequestId: string }>;
}) {
  const { adRequestId } = await params;
  const row = getAdRequest(adRequestId);
  if (!row) notFound();
  const dealers = listDealers();
  const t = await getServerT();
  const dealerName = row.dealer_id
    ? dealers.find((d) => d.dealer_id === row.dealer_id)?.display_name ?? row.dealer_id
    : t("adminCommercial.internalDealer");
  const invoices = listInvoices({ ad_request_id: adRequestId });
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t("adminCommercial.adDetailTitle")}</h1>
          <p className="mt-1 text-xs text-foreground-muted">
            ID: <code className="text-foreground">{row.ad_request_id}</code>
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {t("adminCommercial.adRequestLabel")}: {dealerName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="orange">{row.label ?? t("adminCommercial.labelEmpty")}</Badge>
          <Badge tone="brand">{t(STATUS_KEY[row.status])}</Badge>
        </div>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3 sm:grid-cols-2">
        <Field label={t("adminCommercial.packageCol")} value={t(PACKAGE_KEY[row.package_type])} />
        <Field
          label={t("adminCommercial.placementCol")}
          value={placementKey(row.placement) ? t(placementKey(row.placement)!) : row.placement}
        />
        <Field label={t("adminCommercial.startShort")} value={row.start_date ?? "—"} />
        <Field label={t("adminCommercial.endShort")} value={row.end_date ?? "—"} />
        <Field label={t("adminOffers.detailCreatedAt")} value={formatDateAz(row.created_at)} />
        <Field label={t("adminCommercial.updatedCol")} value={formatDateAz(row.updated_at)} />
        {row.campaign_note ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              {t("adminCommercial.adNote")}
            </p>
            <p className="mt-1 text-sm text-foreground">{row.campaign_note}</p>
          </div>
        ) : null}
        {row.review_note ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">
              {t("adminCommercial.reviewerNoteLabel")}
            </p>
            <p className="mt-1 text-sm text-foreground">{row.review_note}</p>
          </div>
        ) : null}
        {row.rejection_reason ? (
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-danger">
              {t("adminCommercial.rejectionReasonLabel")}
            </p>
            <p className="mt-1 text-sm text-foreground">{row.rejection_reason}</p>
          </div>
        ) : null}
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          {t("adminCommercial.updateSection")}
        </h2>
        <form
          action={`/api/internal/ad-requests/${adRequestId}`}
          method="post"
          className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:grid-cols-2"
        >
          <Select
            name="label"
            label={t("adminCommercial.labelCol")}
            defaultValue={row.label ?? ""}
            options={[
              { value: "", label: t("adminCommercial.saveOption") },
              ...AD_LABELS.map((l) => ({ value: l, label: l })),
            ]}
          />
          <Select
            name="placement"
            label={t("adminCommercial.placementCol")}
            defaultValue={row.placement}
            options={AD_PLACEMENT_AREAS.map((p) => {
              const k = placementKey(p);
              return { value: p, label: k ? t(k) : p };
            })}
          />
          <Input
            name="start_date"
            label={t("adminCommercial.startShort")}
            type="date"
            defaultValue={row.start_date ?? ""}
          />
          <Input
            name="end_date"
            label={t("adminCommercial.endShort")}
            type="date"
            defaultValue={row.end_date ?? ""}
          />
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {t("adminCommercial.campaignNote")}
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
              {t("buttons.save")}
            </Button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          {t("adminCommercial.workflowSection")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <form
            action={`/api/internal/ad-requests/${adRequestId}/approve`}
            method="post"
          >
            <Button type="submit" variant="primary">
              {t("adminCommercial.approveNext")}
            </Button>
          </form>
          <form
            action={`/api/internal/ad-requests/${adRequestId}/request-revision`}
            method="post"
            className="flex items-end gap-2"
          >
            <Input name="note" label={t("adminCommercial.revisionNote")} required />
            <Button type="submit" variant="secondary">
              {t("adminCommercial.requestRevisionAction")}
            </Button>
          </form>
          <form
            action={`/api/internal/ad-requests/${adRequestId}/reject`}
            method="post"
            className="flex items-end gap-2"
          >
            <Input name="note" label={t("adminCommercial.rejectionReasonLabel")} required />
            <Button type="submit" variant="danger">
              {t("adminCommercial.rejectAction")}
            </Button>
          </form>
          <form
            action={`/api/internal/ad-requests/${adRequestId}/activate`}
            method="post"
          >
            <Button type="submit" variant="dark">
              {t("adminCommercial.activate")}
            </Button>
          </form>
        </div>
        <p className="text-xs text-foreground-muted">{t("adminCommercial.activationRequirements")}</p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            {t("adminCommercial.relatedInvoices")}
          </h2>
          <ButtonLink
            href={`/admin/invoices/new?ad_request_id=${row.ad_request_id}`}
            variant="secondary"
            size="sm"
          >
            {t("adminCommercial.createInvoice")}
          </ButtonLink>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("adminCommercial.emptyInvoicesAd")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {invoices.map((inv) => (
              <li key={inv.invoice_id}>
                <Link
                  href={`/admin/invoices/${inv.invoice_id}`}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted"
                >
                  <span className="font-medium text-foreground">{inv.invoice_number}</span>
                  <span className="text-foreground-muted">
                    {inv.amount.toLocaleString("az-AZ")} {inv.currency}
                  </span>
                  <Badge tone="blue" size="sm">
                    {t(INVOICE_STATUS_KEY[inv.status])}
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
