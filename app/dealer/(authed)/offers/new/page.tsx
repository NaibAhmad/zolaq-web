import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { listTrims } from "@/lib/admin";
import { getServerT } from "@/lib/i18n/server";

export default async function DealerNewOfferPage() {
  const trims = listTrims();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("dealerOffers.newOffer")}</h1>
      <Card padding="md">
        <p className="text-sm text-foreground-muted">{t("dealerOffers.newOfferDescription")}</p>
      </Card>
      <form
        action="/api/dealer/offers"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <Select
          name="trim_id"
          label={t("dealerOffers.trimCol")}
          required
          options={trims.map((tr) => ({ value: tr.trim_id, label: tr.display_name }))}
          placeholderOption={t("dealerOffers.selectTrim")}
        />
        <Input name="amount" label={t("dealerOffers.amountCol")} type="number" step="0.01" required />
        <Select
          name="currency"
          label={t("dealerOffers.currencyLabel")}
          defaultValue="AZN"
          options={[
            { value: "AZN", label: "AZN" },
            { value: "USD", label: "USD" },
            { value: "CNY", label: "CNY" },
          ]}
        />
        <Select
          name="stock_status"
          label={t("dealerOffers.stockLabel")}
          defaultValue="available"
          options={[
            { value: "available", label: t("dealerOffers.stockAvailable") },
            { value: "order", label: t("dealerOffers.stockOrder") },
            { value: "coming_soon", label: t("dealerOffers.stockComingSoon") },
            { value: "not_available", label: t("dealerOffers.stockNotAvailable") },
          ]}
        />
        <Input name="valid_until" label={t("dealerOffers.validUntil")} type="date" />
        <Input name="image_url" label={t("dealerOffers.imageUrlOptional")} />
        <Textarea name="notes" label={t("dealerOffers.notesLabel")} placeholder={t("dealerOffers.notesPlaceholder")} />
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit">{t("dealerOffers.submitForReview")}</Button>
        </div>
      </form>
    </div>
  );
}
