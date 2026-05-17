import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listAdRequests } from "@/lib/ads/store";

type SearchParams = { ad_request_id?: string };

export default async function AdminInvoiceNewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const ads = listAdRequests().filter((a) =>
    [
      "under_review",
      "approved",
      "invoice_required",
      "submitted",
    ].includes(a.status),
  );
  return (
    <div className="max-w-2xl">
      <AdminFormShell
        title="Yeni faktura"
        description="Təsdiqlənmiş reklam tələbi üçün manual faktura yarat. Yaratdıqdan sonra faktura avtomatik 'invoice_sent' statusuna keçir."
        action="/api/internal/invoices"
        footer={<Button type="submit">Faktura yarat və göndər</Button>}
      >
        <Select
          name="ad_request_id"
          label="Reklam tələbi"
          required
          defaultValue={sp.ad_request_id ?? ""}
          options={[
            { value: "", label: "— Seç —" },
            ...ads.map((a) => ({
              value: a.ad_request_id,
              label: `${a.ad_request_id} · ${a.package_type}`,
            })),
          ]}
        />
        <Input
          name="amount"
          label="Məbləğ"
          type="number"
          step="0.01"
          required
        />
        <Select
          name="currency"
          label="Valyuta"
          defaultValue="AZN"
          options={[
            { value: "AZN", label: "AZN" },
            { value: "USD", label: "USD" },
            { value: "EUR", label: "EUR" },
          ]}
        />
        <Input name="due_at" label="Son ödəniş tarixi" type="date" required />
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Qeyd
            </span>
            <textarea
              name="notes"
              rows={3}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
        </div>
      </AdminFormShell>
    </div>
  );
}
