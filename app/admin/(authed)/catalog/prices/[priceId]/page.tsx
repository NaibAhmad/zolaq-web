import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getPrice, listDealers, listTrims } from "@/lib/admin";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminPriceEditPage({
  params,
}: {
  params: Promise<{ priceId: string }>;
}) {
  const { priceId } = await params;
  const price = getPrice(priceId);
  if (!price) notFound();
  const trims = listTrims();
  const dealers = listDealers();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {t("adminCatalog.priceEditTitle", { priceId: price.price_id })}
      </h1>
      <form
        action={`/api/internal/prices/${price.price_id}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Select
          name="trim_id"
          label={t("adminCatalog.trimsTitle")}
          defaultValue={price.trim_id}
          options={trims.map((tr) => ({ value: tr.trim_id, label: tr.display_name }))}
        />
        <Input
          name="amount"
          label={t("adminCatalog.amount")}
          type="number"
          step="0.01"
          defaultValue={price.amount}
        />
        <Select
          name="currency"
          label={t("adminCatalog.currency")}
          defaultValue={price.currency}
          options={[
            { value: "AZN", label: "AZN" },
            { value: "USD", label: "USD" },
            { value: "CNY", label: "CNY" },
          ]}
        />
        <Input
          name="source_name"
          label={t("adminCatalog.sourceName")}
          defaultValue={price.source_name}
        />
        <Select
          name="verification_status"
          label={t("adminCatalog.verification")}
          defaultValue={price.verification_status}
          options={[
            { value: "verified", label: t("adminCatalog.verified") },
            { value: "unverified", label: t("adminCatalog.unverified") },
            { value: "pending", label: t("adminCatalog.pending") },
            { value: "conflict", label: t("adminCatalog.conflict") },
            { value: "outdated", label: t("adminCatalog.outdated") },
          ]}
        />
        <Select
          name="dealer_id"
          label={t("adminCatalog.dealer")}
          defaultValue={price.dealer_id ?? ""}
          placeholderOption={t("adminCatalog.dealerNone")}
          options={dealers.map((d) => ({ value: d.dealer_id, label: d.display_name }))}
        />
        <Input
          name="valid_until"
          label={t("adminCatalog.validUntil")}
          type="date"
          defaultValue={price.valid_until ?? ""}
        />
        <Input
          name="notes"
          label={t("adminCatalog.notes")}
          defaultValue={price.notes ?? ""}
        />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">{t("buttons.save")}</Button>
        </div>
      </form>
    </div>
  );
}
