import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  AD_LABELS,
  AD_PACKAGE_TYPES,
  AD_PLACEMENT_AREAS,
  type AdPackageType,
} from "@/lib/ads/types";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";

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

export default async function DealerAdRequestNewPage() {
  const t = await getServerT();
  return (
    <div className="max-w-3xl">
      <AdminFormShell
        title={t("dealerAds.newRequestTitle")}
        description={t("dealerAds.newRequestDescription")}
        action="/api/dealer/ad-requests"
        footer={<Button type="submit">{t("dealerAds.submit")}</Button>}
      >
        <Select
          name="package_type"
          label={t("dealerAds.package")}
          required
          options={AD_PACKAGE_TYPES.map((p) => ({ value: p, label: t(PACKAGE_KEY[p]) }))}
        />
        <Select
          name="placement"
          label={t("dealerAds.placement")}
          required
          options={AD_PLACEMENT_AREAS.map((p) => {
            const k = placementKey(p);
            return { value: p, label: k ? t(k) : p };
          })}
        />
        <Select
          name="label"
          label={t("dealerAds.recommendedLabel")}
          options={[
            { value: "", label: t("dealerAds.recommendedLabelZolaq") },
            ...AD_LABELS.map((l) => ({ value: l, label: l })),
          ]}
          helpText={t("dealerAds.recommendedLabelHelp")}
        />
        <Input name="start_date" label={t("dealerAds.desiredStart")} type="date" />
        <Input name="end_date" label={t("dealerAds.desiredEnd")} type="date" />
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {t("dealerAds.campaignNote")}
            </span>
            <textarea
              name="campaign_note"
              rows={4}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              placeholder={t("dealerAds.campaignNotePlaceholder")}
            />
          </label>
        </div>
      </AdminFormShell>
    </div>
  );
}
