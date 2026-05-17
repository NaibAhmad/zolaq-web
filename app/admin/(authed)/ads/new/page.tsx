import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listDealers } from "@/lib/admin";
import {
  AD_PACKAGE_LABEL_AZ,
  AD_PLACEMENT_LABEL_AZ,
} from "@/lib/ads/labels";
import {
  AD_LABELS,
  AD_PACKAGE_TYPES,
  AD_PLACEMENT_AREAS,
} from "@/lib/ads/types";

export default function AdminAdNewPage() {
  const dealers = listDealers();
  return (
    <div className="max-w-3xl">
      <AdminFormShell
        title="Yeni reklam yerləşdirməsi"
        description="Daxili yerləşdirmələr və ya diler üçün proqnozlanmış yerləşdirməni yarat. Status: qaralama."
        action="/api/internal/ad-requests"
        footer={<Button type="submit">Yarat</Button>}
      >
        <Select
          name="dealer_id"
          label="Diler (opsional)"
          options={[
            { value: "", label: "— Daxili yerləşdirmə —" },
            ...dealers.map((d) => ({
              value: d.dealer_id,
              label: d.display_name,
            })),
          ]}
        />
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
          label="Etiket"
          options={[
            { value: "", label: "— Sonra təyin et —" },
            ...AD_LABELS.map((l) => ({ value: l, label: l })),
          ]}
          helpText="Aktiv kampaniya etiketsiz buraxıla bilməz."
        />
        <Input name="start_date" label="Başlanğıc tarixi" type="date" />
        <Input name="end_date" label="Bitmə tarixi" type="date" />
        <div className="sm:col-span-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Kampaniya qeydi
            </span>
            <textarea
              name="campaign_note"
              rows={3}
              className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              placeholder="İçərik, hədəf auditoriya, kreativ bağlantısı və s."
            />
          </label>
        </div>
      </AdminFormShell>
    </div>
  );
}
