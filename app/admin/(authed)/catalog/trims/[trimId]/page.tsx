import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getTrim, listBrands } from "@/lib/admin";
import { getTrimSpec } from "@/lib/catalog/trim-specs-store";
import { listGenerations } from "@/lib/generations/repository";
import { BODY_TYPES, BODY_TYPE_LABEL } from "@/lib/cars/taxonomy";
import { ENERGY_TYPES } from "@/lib/cars/types";
import { getServerT } from "@/lib/i18n/server";

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
  const t = await getServerT();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{trim.display_name}</h1>
      <form
        action={`/api/internal/trims/${trim.trim_id}`}
        method="post"
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="_method" value="patch" />

        <div className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2">
          <Select
            name="brand_id"
            label={t("adminCatalog.brand")}
            defaultValue={trim.brand_id}
            options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
          />
          <Input
            name="model_name"
            label={t("adminCatalog.modelName")}
            defaultValue={trim.model_name}
          />
          <Select
            name="generation_id"
            label={t("adminCatalog.generationLabel")}
            defaultValue={trim.generation_id ?? ""}
            placeholderOption={t("adminCatalog.allGenerationsOption")}
            options={allGenerations.map((g) => ({
              value: g.generation_id,
              label: g.display_name,
            }))}
          />
          <Input
            name="year"
            label={t("adminCatalog.year")}
            type="number"
            defaultValue={trim.year}
          />
          <Input
            name="display_name"
            label={t("adminCatalog.trimEditFullName")}
            defaultValue={trim.display_name}
          />
          <Select
            name="energy_type"
            label={t("adminCatalog.energy")}
            defaultValue={trim.energy_type}
            options={ENERGY_TYPES.map((e) => ({ value: e, label: e }))}
          />
          <Select
            name="body_type"
            label={t("adminCatalog.bodyType")}
            defaultValue={trim.body_type ?? ""}
            placeholderOption={t("adminCatalog.selectNone")}
            options={BODY_TYPES.map((bt) => ({ value: bt, label: BODY_TYPE_LABEL[bt] }))}
          />
          <Input
            name="power_hp"
            label={t("adminCatalog.hpLabel")}
            type="number"
            defaultValue={trim.power_hp ?? ""}
          />
          <Input
            name="range_km"
            label={t("adminCatalog.mileageKm")}
            type="number"
            defaultValue={trim.range_km ?? ""}
          />
          <Input
            name="image_url"
            label={t("adminCatalog.imageUrl")}
            defaultValue={trim.image_url ?? ""}
          />
          <Select
            name="status"
            label={t("adminCatalog.status")}
            defaultValue={trim.status}
            options={[
              { value: "active", label: t("adminCatalog.statusActive") },
              { value: "inactive", label: t("adminCatalog.statusInactive") },
            ]}
          />
        </div>

        <details className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            {t("adminCatalog.techSpecsToggle")}
          </summary>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input name="engine" label={t("adminCatalog.engine")} defaultValue={spec?.engine ?? ""} />
            <Input
              name="engine_displacement_l"
              label={t("adminCatalog.engineDisplacement")}
              type="number"
              step="0.1"
              defaultValue={spec?.engine_displacement_l ?? ""}
            />
            <Input
              name="torque_nm"
              label={t("adminCatalog.torque")}
              type="number"
              defaultValue={spec?.torque_nm ?? ""}
            />
            <Input
              name="transmission"
              label={t("adminCatalog.transmission")}
              defaultValue={spec?.transmission ?? ""}
            />
            <Input
              name="drivetrain"
              label={t("adminCatalog.drivetrain")}
              defaultValue={spec?.drivetrain ?? ""}
            />
            <Input
              name="seats"
              label={t("adminCatalog.seats")}
              type="number"
              defaultValue={spec?.seats ?? ""}
            />
            <Input
              name="battery_kwh"
              label={t("adminCatalog.batteryKwh")}
              type="number"
              step="0.1"
              defaultValue={spec?.battery_kwh ?? ""}
            />
            <Input
              name="fuel_consumption_l_100km"
              label={t("adminCatalog.fuelConsumption")}
              type="number"
              step="0.1"
              defaultValue={spec?.fuel_consumption_l_100km ?? ""}
            />
            <Input
              name="charging_ac_kw"
              label={t("adminCatalog.chargingAc")}
              type="number"
              step="0.1"
              defaultValue={spec?.charging_ac_kw ?? ""}
            />
            <Input
              name="charging_dc_kw"
              label={t("adminCatalog.chargingDc")}
              type="number"
              step="0.1"
              defaultValue={spec?.charging_dc_kw ?? ""}
            />
            <Input
              name="acceleration_0_100"
              label={t("adminCatalog.acceleration")}
              type="number"
              step="0.1"
              defaultValue={spec?.acceleration_0_100 ?? ""}
            />
            <Input
              name="ground_clearance"
              label={t("adminCatalog.groundClearance")}
              type="number"
              defaultValue={spec?.ground_clearance ?? ""}
            />
            <Input
              name="dimensions"
              label={t("adminCatalog.dimensions")}
              defaultValue={spec?.dimensions ?? ""}
            />
            <Input
              name="warranty"
              label={t("adminCatalog.warranty")}
              defaultValue={spec?.warranty ?? ""}
            />
            <Input name="source" label={t("adminCatalog.source")} defaultValue={spec?.source ?? ""} />
            <Input
              name="verification_status"
              label={t("adminCatalog.verificationStatus")}
              defaultValue={spec?.verification_status ?? ""}
            />
          </div>
        </details>

        <div className="flex items-end">
          <Button type="submit">{t("buttons.save")}</Button>
        </div>
      </form>
    </div>
  );
}
