import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getTrim, listBrands } from "@/lib/admin";
import { getTrimSpec } from "@/lib/catalog/trim-specs-store";
import { listGenerations } from "@/lib/generations/repository";
import { BODY_TYPES, BODY_TYPE_LABEL } from "@/lib/cars/taxonomy";
import { ENERGY_TYPES } from "@/lib/cars/types";

export default async function AdminTrimEditPage({
  params,
}: {
  params: Promise<{ trimId: string }>;
}) {
  const { trimId } = await params;
  const trim = getTrim(trimId);
  if (!trim) notFound();
  const brands = listBrands();
  const spec = getTrimSpec(trimId);
  const allGenerations = listGenerations({ brand_id: trim.brand_id, model_name: trim.model_name });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{trim.display_name}</h1>
      <form
        action={`/api/internal/trims/${trim.trim_id}`}
        method="post"
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="_method" value="patch" />

        {/* ---- Basic fields ---- */}
        <div className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2">
          <Select
            name="brand_id"
            label="Marka"
            defaultValue={trim.brand_id}
            options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
          />
          <Input name="model_name" label="Model adı" defaultValue={trim.model_name} />
          <Select
            name="generation_id"
            label="Nəsil"
            defaultValue={trim.generation_id ?? ""}
            placeholderOption="Bütün nəsillər"
            options={allGenerations.map((g) => ({
              value: g.generation_id,
              label: g.display_name,
            }))}
          />
          <Input name="year" label="İl" type="number" defaultValue={trim.year} />
          <Input name="display_name" label="Tam ad" defaultValue={trim.display_name} />
          <Select
            name="energy_type"
            label="Enerji"
            defaultValue={trim.energy_type}
            options={ENERGY_TYPES.map((e) => ({ value: e, label: e }))}
          />
          <Select
            name="body_type"
            label="Kuzov tipi"
            defaultValue={trim.body_type ?? ""}
            placeholderOption="Seçilməyib"
            options={BODY_TYPES.map((bt) => ({ value: bt, label: BODY_TYPE_LABEL[bt] }))}
          />
          <Input name="power_hp" label="Güc (HP)" type="number" defaultValue={trim.power_hp ?? ""} />
          <Input name="range_km" label="Yürüş (km)" type="number" defaultValue={trim.range_km ?? ""} />
          <Input name="image_url" label="Şəkil URL" defaultValue={trim.image_url ?? ""} />
          <Select
            name="status"
            label="Status"
            defaultValue={trim.status}
            options={[
              { value: "active", label: "Aktiv" },
              { value: "inactive", label: "Deaktiv" },
            ]}
          />
        </div>

        {/* ---- Advanced specs (Sprint 9C) ---- */}
        <details className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Texniki xüsusiyyətlər (opsional)
          </summary>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input name="engine" label="Mühərrik" defaultValue={spec?.engine ?? ""} />
            <Input
              name="engine_displacement_l"
              label="Mühərrik həcmi (L)"
              type="number"
              step="0.1"
              defaultValue={spec?.engine_displacement_l ?? ""}
            />
            <Input
              name="torque_nm"
              label="Burulma momenti (N·m)"
              type="number"
              defaultValue={spec?.torque_nm ?? ""}
            />
            <Input
              name="transmission"
              label="Transmissiya"
              defaultValue={spec?.transmission ?? ""}
            />
            <Input
              name="drivetrain"
              label="Sürücü oxu"
              defaultValue={spec?.drivetrain ?? ""}
            />
            <Input
              name="seats"
              label="Oturacaq sayı"
              type="number"
              defaultValue={spec?.seats ?? ""}
            />
            <Input
              name="battery_kwh"
              label="Batareya (kWh)"
              type="number"
              step="0.1"
              defaultValue={spec?.battery_kwh ?? ""}
            />
            <Input
              name="fuel_consumption_l_100km"
              label="Yanacaq sərfi (L/100km)"
              type="number"
              step="0.1"
              defaultValue={spec?.fuel_consumption_l_100km ?? ""}
            />
            <Input
              name="charging_ac_kw"
              label="AC dolanma gücü (kW)"
              type="number"
              step="0.1"
              defaultValue={spec?.charging_ac_kw ?? ""}
            />
            <Input
              name="charging_dc_kw"
              label="DC dolanma gücü (kW)"
              type="number"
              step="0.1"
              defaultValue={spec?.charging_dc_kw ?? ""}
            />
            <Input
              name="acceleration_0_100"
              label="0–100 km/saat (san)"
              type="number"
              step="0.1"
              defaultValue={spec?.acceleration_0_100 ?? ""}
            />
            <Input
              name="ground_clearance"
              label="Dövriyyə (mm)"
              type="number"
              defaultValue={spec?.ground_clearance ?? ""}
            />
            <Input
              name="dimensions"
              label="Ölçülər (uz · en · hün)"
              defaultValue={spec?.dimensions ?? ""}
            />
            <Input
              name="warranty"
              label="Zəmanət"
              defaultValue={spec?.warranty ?? ""}
            />
            <Input name="source" label="Mənbə" defaultValue={spec?.source ?? ""} />
            <Input
              name="verification_status"
              label="Təsdiq statusu"
              defaultValue={spec?.verification_status ?? ""}
            />
          </div>
        </details>

        <div className="flex items-end">
          <Button type="submit">Yadda saxla</Button>
        </div>
      </form>
    </div>
  );
}
