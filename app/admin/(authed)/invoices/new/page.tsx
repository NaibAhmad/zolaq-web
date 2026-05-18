import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listAdRequests } from "@/lib/ads/store";
import { getServerT } from "@/lib/i18n/server";

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
  const t = await getServerT();
  return (
    <div className="max-w-2xl">
      <AdminFormShell
        title={t("adminCommercial.newInvoiceTitle")}
        description={t("adminCommercial.newInvoiceDescription")}
        action="/api/internal/invoices"
        footer={<Button type="submit">{t("adminCommercial.createInvoiceAction")}</Button>}
      >
        <Select
          name="ad_request_id"
          label={t("adminCommercial.adRequestLabel")}
          required
          defaultValue={sp.ad_request_id ?? ""}
          options={[
            { value: "", label: t("adminCommercial.selectPlaceholder") },
            ...ads.map((a) => ({
              value: a.ad_request_id,
              label: `${a.ad_request_id} · ${a.package_type}`,
            })),
          ]}
        />
        <Input
          name="amount"
          label={t("adminCommercial.amountLabel")}
          type="number"
          step="0.01"
          required
        />
        <Select
          name="currency"
          label={t("adminCommercial.currencyLabel")}
          defaultValue="AZN"
          options={[
            { value: "AZN", label: "AZN" },
            { value: "USD", label: "USD" },
            { value: "EUR", label: "EUR" },
          ]}
        />
        <Input name="due_at" label={t("adminCommercial.dueDateLabel")} type="date" required />
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {t("adminCommercial.notesLabel")}
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
