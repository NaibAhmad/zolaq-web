import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listDealers } from "@/lib/admin";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";
import {
  AD_LABELS,
  AD_PACKAGE_TYPES,
  AD_PLACEMENT_AREAS,
  type AdPackageType,
} from "@/lib/ads/types";

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

export default async function AdminAdNewPage() {
  const dealers = listDealers();
  const t = await getServerT();
  return (
    <div className="max-w-3xl">
      <AdminFormShell
        title={t("adminCommercial.newAdTitle")}
        description={t("adminCommercial.newAdDescription")}
        action="/api/internal/ad-requests"
        footer={<Button type="submit">{t("adminContent.createAction")}</Button>}
      >
        <Select
          name="dealer_id"
          label={t("adminCommercial.dealerOptional")}
          options={[
            { value: "", label: t("adminCommercial.internalPlacementOption") },
            ...dealers.map((d) => ({
              value: d.dealer_id,
              label: d.display_name,
            })),
          ]}
        />
        <Select
          name="package_type"
          label={t("adminCommercial.packageCol")}
          required
          options={AD_PACKAGE_TYPES.map((p) => ({
            value: p,
            label: t(PACKAGE_KEY[p]),
          }))}
        />
        <Select
          name="placement"
          label={t("adminCommercial.placementCol")}
          required
          options={AD_PLACEMENT_AREAS.map((p) => {
            const k = placementKey(p);
            return { value: p, label: k ? t(k) : p };
          })}
        />
        <Select
          name="label"
          label={t("adminCommercial.labelCol")}
          options={[
            { value: "", label: t("adminCommercial.labelLater") },
            ...AD_LABELS.map((l) => ({ value: l, label: l })),
          ]}
          helpText={t("adminCommercial.labelHelpRequired")}
        />
        <Input name="start_date" label={t("adminCommercial.startDate")} type="date" />
        <Input name="end_date" label={t("adminCommercial.endDate")} type="date" />
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {t("adminCommercial.campaignNote")}
            </span>
            <textarea
              name="campaign_note"
              rows={3}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              placeholder={t("adminCommercial.campaignNotePlaceholder")}
            />
          </label>
        </div>
      </AdminFormShell>
    </div>
  );
}
