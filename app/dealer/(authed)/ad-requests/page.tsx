import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { listAdRequests } from "@/lib/ads/store";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";
import type { AdPackageType, AdStatus } from "@/lib/ads/types";

const STATUS_TONE: Record<string, "blue" | "warning" | "success" | "danger" | "muted" | "orange"> = {
  draft: "muted",
  submitted: "blue",
  under_review: "warning",
  invoice_required: "warning",
  invoice_sent: "blue",
  payment_uploaded: "warning",
  paid: "success",
  approved: "success",
  active: "success",
  paused: "warning",
  expired: "muted",
  rejected: "danger",
  cancelled: "muted",
};

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

export default async function DealerAdRequestsPage() {
  const session = (await getDealerSession())!;
  const rows = listAdRequests({ dealer_id: session.dealerId });
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("dealerAds.myRequestsTitle")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t("dealerAds.myRequestsDescription")}</p>
        </div>
        <ButtonLink href="/dealer/ad-requests/new">{t("dealerAds.newRequest")}</ButtonLink>
      </header>
      <AdminTable
        rows={rows}
        rowKey={(r) => r.ad_request_id}
        empty={t("dealerAds.emptyMyRequests")}
        columns={[
          {
            key: "id",
            header: t("dealerAds.requestCol"),
            cell: (r) => (
              <Link
                href={`/dealer/ad-requests/${r.ad_request_id}`}
                className="font-medium hover:underline"
              >
                {t(PACKAGE_KEY[r.package_type])}
                <span className="mt-0.5 block text-xs text-foreground-muted">{r.ad_request_id}</span>
              </Link>
            ),
          },
          {
            key: "placement",
            header: t("dealerAds.placementCol"),
            cell: (r) => {
              const k = placementKey(r.placement);
              return k ? t(k) : r.placement;
            },
          },
          {
            key: "label",
            header: t("dealerAds.labelCol"),
            cell: (r) =>
              r.label ? (
                <Badge tone="orange" size="sm">{r.label}</Badge>
              ) : (
                <span className="text-xs text-foreground-muted">—</span>
              ),
          },
          {
            key: "status",
            header: t("dealerAds.statusCol"),
            cell: (r) => (
              <Badge tone={STATUS_TONE[r.status] ?? "neutral"} size="sm">
                {t(STATUS_KEY[r.status])}
              </Badge>
            ),
          },
          {
            key: "dates",
            header: t("dealerAds.dateCol"),
            cell: (r) => (
              <span className="text-xs text-foreground-muted">
                {r.start_date ?? "—"} → {r.end_date ?? "—"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
