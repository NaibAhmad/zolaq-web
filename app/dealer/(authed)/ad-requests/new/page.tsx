import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  AD_PACKAGE_LABEL_AZ,
  AD_PLACEMENT_LABEL_AZ,
} from "@/lib/ads/labels";
import {
  AD_LABELS,
  AD_PACKAGE_TYPES,
  AD_PLACEMENT_AREAS,
} from "@/lib/ads/types";

export default function DealerAdRequestNewPage() {
  return (
    <div className="max-w-3xl">
      <AdminFormShell
        title="Yeni reklam tələbi"
        description="Tələb 'göndərildi' statusu ilə Zolaq satış komandasına göndərilir. Faktura yaradıldıqdan sonra ödəniş təsdiqi yükləyə bilərsiniz."
        action="/api/dealer/ad-requests"
        footer={<Button type="submit">Göndər</Button>}
      >
        <Select
          name="package_type"
          label="Paket"
          required
          options={AD_PACKAGE_TYPES.map((p) => ({
            value: p,
            label: AD_PACKAGE_LABEL_AZ[p],
          }))}
        />
        <Select
          name="placement"
          label="Yerləşmə"
          required
          options={AD_PLACEMENT_AREAS.map((p) => ({
            value: p,
            label: AD_PLACEMENT_LABEL_AZ[p] ?? p,
          }))}
        />
        <Select
          name="label"
          label="Tövsiyə olunan etiket"
          options={[
            { value: "", label: "— Zolaq təyin etsin —" },
            ...AD_LABELS.map((l) => ({ value: l, label: l })),
          ]}
          helpText="Son etiket Zolaq sales komandasının yoxlamasından sonra təyin olunur."
        />
        <Input name="start_date" label="İstənən başlanğıc" type="date" />
        <Input name="end_date" label="İstənən bitmə" type="date" />
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Kampaniya qeydi
            </span>
            <textarea
              name="campaign_note"
              rows={4}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              placeholder="Hədəf model, kreativ, mesaj, və s."
            />
          </label>
        </div>
      </AdminFormShell>
    </div>
  );
}
