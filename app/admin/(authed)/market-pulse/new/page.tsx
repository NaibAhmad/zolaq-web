import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  BAZAR_CADENCES,
  BAZAR_CADENCE_LABEL_AZ,
} from "@/lib/market-pulse/types";

export default function AdminMarketPulseNewPage() {
  return (
    <div className="max-w-3xl">
      <AdminFormShell
        title="Yeni Bazar Nəbzi mövzusu"
        description="3-4 variant seçimli sual. Sponsorlu mövzular admin yoxlamasından keçir və 'Sponsorlu' etiketi ilə görsənir."
        action="/api/internal/market-pulse"
        footer={<Button type="submit">Yarat</Button>}
      >
        <div className="sm:col-span-2">
          <Input name="question" label="Sual" required />
        </div>
        <Select
          name="cadence"
          label="Tezlik"
          required
          options={BAZAR_CADENCES.map((c) => ({
            value: c,
            label: BAZAR_CADENCE_LABEL_AZ[c],
          }))}
        />
        <Select
          name="sponsored"
          label="Sponsorlu?"
          defaultValue="false"
          options={[
            { value: "false", label: "Üzvi (organic)" },
            { value: "true", label: "Sponsorlu — yoxlamaya getsin" },
          ]}
        />
        <Input name="start_date" label="Başlanğıc" type="date" required />
        <Input name="end_date" label="Bitmə" type="date" required />
        <Input name="option_1" label="Variant 1" required />
        <Input name="option_2" label="Variant 2" required />
        <Input name="option_3" label="Variant 3" required />
        <Input name="option_4" label="Variant 4 (opsional)" />
        <Input
          name="sponsor_ad_request_id"
          label="Reklam tələbi ID (sponsorlu üçün)"
        />
        <Input
          name="sponsor_name"
          label="Sponsor adı (sponsorlu üçün)"
          placeholder="Diler / şirkət adı"
        />
      </AdminFormShell>
    </div>
  );
}
