import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listDealers, listPrices, listTrims } from "@/lib/admin";

const PRICE_STATUS_OPTIONS = [
  { value: "catalog_price", label: "Kataloq qiyməti" },
  { value: "estimated", label: "Təxmin" },
  { value: "dealer_quote_pending", label: "Diler — gözləmədə" },
  { value: "dealer_official_offer", label: "Diler — rəsmi" },
  { value: "expired_offer", label: "Müddəti bitmiş" },
  { value: "conflict", label: "Ziddiyyət" },
  { value: "price_unknown", label: "Naməlum" },
  { value: "not_available", label: "Mövcud deyil" },
];

const SOURCE_TYPE_OPTIONS = [
  { value: "catalog", label: "Kataloq" },
  { value: "estimate", label: "Təxmin" },
  { value: "official_dealer", label: "Rəsmi diler" },
  { value: "partner", label: "Tərəfdaş" },
  { value: "zolaq_manual", label: "Zolaq əl ilə" },
  { value: "imported", label: "İdxal" },
];

const VERIFICATION_STATUS_OPTIONS = [
  { value: "verified", label: "Təsdiqlənmiş" },
  { value: "unverified", label: "Təsdiqlənməyib" },
  { value: "pending", label: "Gözləmədə" },
  { value: "conflict", label: "Ziddiyyət" },
  { value: "outdated", label: "Köhnəlmiş" },
];

export default function AdminPricesPage() {
  const prices = listPrices();
  const trims = listTrims();
  const dealers = listDealers();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Qiymətlər və təkliflər</h1>

      <form
        action="/api/internal/prices"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-3"
      >
        <Select
          name="trim_id"
          label="Komplektasiya"
          required
          options={trims.map((t) => ({ value: t.trim_id, label: t.display_name }))}
          placeholderOption="Trim seç"
        />
        <Input name="amount" label="Məbləğ" type="number" step="0.01" required />
        <Select
          name="currency"
          label="Valyuta"
          defaultValue="AZN"
          options={[
            { value: "AZN", label: "AZN" },
            { value: "USD", label: "USD" },
            { value: "CNY", label: "CNY" },
          ]}
        />
        <Select name="status" label="Status" required options={PRICE_STATUS_OPTIONS} defaultValue="catalog_price" />
        <Select name="source_type" label="Mənbə tipi" required options={SOURCE_TYPE_OPTIONS} defaultValue="catalog" />
        <Input name="source_name" label="Mənbə adı" required defaultValue="Zolaq kataloqu" />
        <Select
          name="verification_status"
          label="Təsdiq"
          options={VERIFICATION_STATUS_OPTIONS}
          defaultValue="verified"
        />
        <Select
          name="dealer_id"
          label="Diler (opsional)"
          placeholderOption="Yoxdur (kataloq qiyməti)"
          options={dealers.map((d) => ({ value: d.dealer_id, label: d.display_name }))}
        />
        <Input name="valid_until" label="Etibarlıdır" type="date" />
        <div className="flex items-end md:col-span-3">
          <Button type="submit">Qiymət əlavə et</Button>
        </div>
      </form>

      <AdminTable
        rows={prices}
        rowKey={(p) => p.price_id}
        empty="Qiymət yoxdur."
        columns={[
          {
            key: "trim",
            header: "Komplektasiya",
            cell: (p) => (
              <Link href={`/admin/catalog/prices/${p.price_id}`} className="font-medium hover:underline">
                {trims.find((t) => t.trim_id === p.trim_id)?.display_name ?? p.trim_id}
              </Link>
            ),
          },
          {
            key: "amount",
            header: "Məbləğ",
            cell: (p) =>
              p.status === "price_unknown" || p.status === "not_available"
                ? "—"
                : `${p.amount.toLocaleString("az-AZ")} ${p.currency}`,
          },
          {
            key: "dealer",
            header: "Diler",
            cell: (p) =>
              p.dealer_id
                ? dealers.find((d) => d.dealer_id === p.dealer_id)?.display_name ?? p.dealer_id
                : "—",
          },
          {
            key: "offer_status",
            header: "Təklif",
            cell: (p) => (p.offer_status ? <StatusBadge status={p.offer_status} /> : "—"),
          },
          { key: "verification", header: "Təsdiq", cell: (p) => p.verification_status },
        ]}
      />
    </div>
  );
}
