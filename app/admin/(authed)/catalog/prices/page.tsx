import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listDealers, listPrices, listTrims } from "@/lib/admin";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminPricesPage() {
  const prices = listPrices();
  const trims = listTrims();
  const dealers = listDealers();
  const t = await getServerT();

  const PRICE_STATUS_OPTIONS = [
    { value: "catalog_price", label: t("adminCatalog.catalogPrice") },
    { value: "estimated", label: t("adminCatalog.estimate") },
    { value: "dealer_quote_pending", label: t("adminCatalog.dealerPending") },
    { value: "dealer_official_offer", label: t("adminCatalog.dealerOfficial") },
    { value: "expired_offer", label: t("adminCatalog.expired") },
    { value: "conflict", label: t("adminCatalog.conflict") },
    { value: "price_unknown", label: t("adminCatalog.unknown") },
    { value: "not_available", label: t("adminCatalog.unavailable") },
  ];

  const SOURCE_TYPE_OPTIONS = [
    { value: "catalog", label: t("adminCatalog.catalogSourceLabel") },
    { value: "estimate", label: t("adminCatalog.estimate") },
    { value: "official_dealer", label: t("adminCatalog.officialDealerSource") },
    { value: "partner", label: t("adminCatalog.partnerSource") },
    { value: "zolaq_manual", label: t("adminCatalog.zolaqManual") },
    { value: "imported", label: t("adminCatalog.importSource") },
  ];

  const VERIFICATION_STATUS_OPTIONS = [
    { value: "verified", label: t("adminCatalog.verified") },
    { value: "unverified", label: t("adminCatalog.unverified") },
    { value: "pending", label: t("adminCatalog.pending") },
    { value: "conflict", label: t("adminCatalog.conflict") },
    { value: "outdated", label: t("adminCatalog.outdated") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminCatalog.pricesAndOffers")}</h1>

      <form
        action="/api/internal/prices"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-3"
      >
        <Select
          name="trim_id"
          label={t("adminCatalog.trimsTitle")}
          required
          options={trims.map((tr) => ({ value: tr.trim_id, label: tr.display_name }))}
          placeholderOption={t("adminCatalog.selectTrim")}
        />
        <Input name="amount" label={t("adminCatalog.amount")} type="number" step="0.01" required />
        <Select
          name="currency"
          label={t("adminCatalog.currency")}
          defaultValue="AZN"
          options={[
            { value: "AZN", label: "AZN" },
            { value: "USD", label: "USD" },
            { value: "CNY", label: "CNY" },
          ]}
        />
        <Select
          name="status"
          label={t("adminCatalog.status")}
          required
          options={PRICE_STATUS_OPTIONS}
          defaultValue="catalog_price"
        />
        <Select
          name="source_type"
          label={t("adminCatalog.sourceType")}
          required
          options={SOURCE_TYPE_OPTIONS}
          defaultValue="catalog"
        />
        <Input
          name="source_name"
          label={t("adminCatalog.sourceName")}
          required
          defaultValue={t("adminCatalog.zolaqCatalogDefault")}
        />
        <Select
          name="verification_status"
          label={t("adminCatalog.verification")}
          options={VERIFICATION_STATUS_OPTIONS}
          defaultValue="verified"
        />
        <Select
          name="dealer_id"
          label={t("adminCatalog.dealerOptional")}
          placeholderOption={t("adminCatalog.noDealerCatalog")}
          options={dealers.map((d) => ({ value: d.dealer_id, label: d.display_name }))}
        />
        <Input name="valid_until" label={t("adminCatalog.validUntil")} type="date" />
        <div className="flex items-end md:col-span-3">
          <Button type="submit">{t("adminCatalog.addPrice")}</Button>
        </div>
      </form>

      <AdminTable
        rows={prices}
        rowKey={(p) => p.price_id}
        empty={t("adminCatalog.emptyPrices")}
        columns={[
          {
            key: "trim",
            header: t("adminCatalog.trimsTitle"),
            cell: (p) => (
              <Link href={`/admin/catalog/prices/${p.price_id}`} className="font-medium hover:underline">
                {trims.find((tr) => tr.trim_id === p.trim_id)?.display_name ?? p.trim_id}
              </Link>
            ),
          },
          {
            key: "amount",
            header: t("adminCatalog.amount"),
            cell: (p) =>
              p.status === "price_unknown" || p.status === "not_available"
                ? "—"
                : `${p.amount.toLocaleString("az-AZ")} ${p.currency}`,
          },
          {
            key: "dealer",
            header: t("adminCatalog.dealer"),
            cell: (p) =>
              p.dealer_id
                ? dealers.find((d) => d.dealer_id === p.dealer_id)?.display_name ?? p.dealer_id
                : "—",
          },
          {
            key: "offer_status",
            header: t("adminCatalog.offerCol"),
            cell: (p) => (p.offer_status ? <StatusBadge status={p.offer_status} /> : "—"),
          },
          {
            key: "verification",
            header: t("adminCatalog.verification"),
            cell: (p) => p.verification_status,
          },
        ]}
      />
    </div>
  );
}
