import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getPrice, listDealers, listTrims } from "@/lib/admin";

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
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Qiymət: {price.price_id}</h1>
      <form
        action={`/api/internal/prices/${price.price_id}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Select
          name="trim_id"
          label="Komplektasiya"
          defaultValue={price.trim_id}
          options={trims.map((t) => ({ value: t.trim_id, label: t.display_name }))}
        />
        <Input name="amount" label="Məbləğ" type="number" step="0.01" defaultValue={price.amount} />
        <Select
          name="currency"
          label="Valyuta"
          defaultValue={price.currency}
          options={[
            { value: "AZN", label: "AZN" },
            { value: "USD", label: "USD" },
            { value: "CNY", label: "CNY" },
          ]}
        />
        <Input name="source_name" label="Mənbə adı" defaultValue={price.source_name} />
        <Select
          name="verification_status"
          label="Təsdiq"
          defaultValue={price.verification_status}
          options={[
            { value: "verified", label: "Təsdiqlənmiş" },
            { value: "unverified", label: "Təsdiqlənməyib" },
            { value: "pending", label: "Gözləmədə" },
            { value: "conflict", label: "Ziddiyyət" },
            { value: "outdated", label: "Köhnəlmiş" },
          ]}
        />
        <Select
          name="dealer_id"
          label="Diler"
          defaultValue={price.dealer_id ?? ""}
          placeholderOption="Yoxdur"
          options={dealers.map((d) => ({ value: d.dealer_id, label: d.display_name }))}
        />
        <Input name="valid_until" label="Etibarlıdır" type="date" defaultValue={price.valid_until ?? ""} />
        <Input name="notes" label="Qeyd" defaultValue={price.notes ?? ""} />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">Yadda saxla</Button>
        </div>
      </form>
    </div>
  );
}
