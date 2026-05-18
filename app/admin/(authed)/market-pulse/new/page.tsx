import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";
import { BAZAR_CADENCES, type BazarCadence } from "@/lib/market-pulse/types";

const CADENCE_KEY: Record<BazarCadence, TranslationKey> = {
  daily: "adminContent.cadenceDaily",
  weekly: "adminContent.cadenceWeekly",
  monthly: "adminContent.cadenceMonthly",
};

export default async function AdminMarketPulseNewPage() {
  const t = await getServerT();
  return (
    <div className="max-w-3xl">
      <AdminFormShell
        title={t("adminContent.newTopicTitle")}
        description={t("adminContent.newTopicDescription")}
        action="/api/internal/market-pulse"
        footer={<Button type="submit">{t("adminContent.createAction")}</Button>}
      >
        <div className="sm:col-span-2">
          <Input name="question" label={t("adminContent.question")} required />
        </div>
        <Select
          name="cadence"
          label={t("adminContent.cadence")}
          required
          options={BAZAR_CADENCES.map((c) => ({
            value: c,
            label: t(CADENCE_KEY[c]),
          }))}
        />
        <Select
          name="sponsored"
          label={t("adminContent.sponsoredLabel")}
          defaultValue="false"
          options={[
            { value: "false", label: t("adminContent.organicLabel") },
            { value: "true", label: t("adminContent.sponsoredOption") },
          ]}
        />
        <Input name="start_date" label={t("adminContent.startDate")} type="date" required />
        <Input name="end_date" label={t("adminContent.endDate")} type="date" required />
        <Input name="option_1" label={t("adminContent.optionN", { n: 1 })} required />
        <Input name="option_2" label={t("adminContent.optionN", { n: 2 })} required />
        <Input name="option_3" label={t("adminContent.optionN", { n: 3 })} required />
        <Input name="option_4" label={t("adminContent.optionOptional")} />
        <Input name="sponsor_ad_request_id" label={t("adminContent.adRequestIdLabel")} />
        <Input
          name="sponsor_name"
          label={t("adminContent.sponsorNameLabel")}
          placeholder={t("adminContent.sponsorNamePlaceholder")}
        />
      </AdminFormShell>
    </div>
  );
}
