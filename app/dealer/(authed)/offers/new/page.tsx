import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { listTrims } from "@/lib/admin";

export default function DealerNewOfferPage() {
  const trims = listTrims();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Yeni təklif</h1>
      <Card padding="md">
        <p className="text-sm text-foreground-muted">
          Təklifi göndərdikdən sonra admin yoxlayır. Təsdiqlənənədək təklif publik saytda görünmür.
        </p>
      </Card>
      <form
        action="/api/dealer/offers"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
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
        <Select
          name="stock_status"
          label="Stok"
          defaultValue="available"
          options={[
            { value: "available", label: "Mövcud" },
            { value: "order", label: "Sifariş" },
            { value: "coming_soon", label: "Tezliklə" },
            { value: "not_available", label: "Yoxdur" },
          ]}
        />
        <Input name="valid_until" label="Etibarlıdır" type="date" />
        <Input name="image_url" label="Şəkil URL (opsional)" />
        <Textarea name="notes" label="Qeyd" placeholder="Daxili qeyd (opsional)" />
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit">Yoxlamaya göndər</Button>
        </div>
      </form>
    </div>
  );
}
