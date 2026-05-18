import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getOfferById, getTrim } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";
import { getServerT } from "@/lib/i18n/server";

export default async function DealerOfferEditPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const session = (await getDealerSession())!;
  const { offerId } = await params;
  const offer = getOfferById(offerId);
  if (!offer || offer.dealer_id !== session.dealerId) notFound();
  const trim = offer.trim_id ? getTrim(offer.trim_id) : null;
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{trim?.display_name ?? offer.trim_id}</h1>
        {offer.offer_status ? <StatusBadge status={offer.offer_status} /> : null}
      </header>

      {offer.offer_status === "needs_revision" && offer.review_note ? (
        <Card padding="md" tone="muted">
          <h2 className="text-sm font-semibold">{t("dealerOffers.reviewerWantsRevision")}</h2>
          <p className="text-sm">{offer.review_note}</p>
        </Card>
      ) : null}

      <form
        action={`/api/dealer/offers/${offer.offer_id}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <Input
          name="amount"
          label={t("dealerOffers.amountCol")}
          type="number"
          step="0.01"
          defaultValue={offer.amount}
        />
        <Select
          name="currency"
          label={t("dealerOffers.currencyLabel")}
          defaultValue={offer.currency}
          options={[
            { value: "AZN", label: "AZN" },
            { value: "USD", label: "USD" },
            { value: "CNY", label: "CNY" },
          ]}
        />
        <Select
          name="stock_status"
          label={t("dealerOffers.stockLabel")}
          defaultValue={offer.stock_status ?? "available"}
          options={[
            { value: "available", label: t("dealerOffers.stockAvailable") },
            { value: "order", label: t("dealerOffers.stockOrder") },
            { value: "coming_soon", label: t("dealerOffers.stockComingSoon") },
            { value: "not_available", label: t("dealerOffers.stockNotAvailable") },
          ]}
        />
        <Input
          name="valid_until"
          label={t("dealerOffers.validUntil")}
          type="date"
          defaultValue={offer.valid_until ?? ""}
        />
        <Textarea name="notes" label={t("dealerOffers.notesLabel")} defaultValue={offer.notes ?? ""} />
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit">{t("dealerOffers.resubmit")}</Button>
        </div>
      </form>
    </div>
  );
}
