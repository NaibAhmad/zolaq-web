import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands, listTrims } from "@/lib/admin";
import { GENERATIONS } from "@/lib/cars/generations";
import { BODY_TYPES, BODY_TYPE_LABEL } from "@/lib/cars/taxonomy";
import { ENERGY_TYPES } from "@/lib/cars/types";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminTrimsPage() {
  const brands = listBrands();
  const trims = listTrims();
  const brandNameById = new Map(brands.map((b) => [b.brand_id, b.name]));
  const generationOptions = GENERATIONS.filter((g) => g.status === "active").map(
    (g) => ({
      value: g.generation_id,
      label: `${brandNameById.get(g.brand_id) ?? g.brand_id} ${g.model_name} — ${g.name}`,
    }),
  );
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminCatalog.trimsTitle")}</h1>

      <form
        action="/api/internal/trims"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-3"
      >
        <Select
          name="brand_id"
          label={t("adminCatalog.brand")}
          required
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
          placeholderOption={t("adminCatalog.selectBrand")}
        />
        <Input name="model_name" label={t("adminCatalog.modelName")} required />
        <Input
          name="year"
          label={t("adminCatalog.year")}
          type="number"
          required
          defaultValue={new Date().getFullYear()}
        />
        <Input
          name="display_name"
          label={t("adminCatalog.fullName")}
          required
          placeholder={t("adminCatalog.displayNamePlaceholder")}
          helpText={t("adminCatalog.displayNameHelp")}
        />
        <Select
          name="energy_type"
          label={t("adminCatalog.energyType")}
          required
          options={ENERGY_TYPES.map((e) => ({ value: e, label: e }))}
        />
        <Select
          name="body_type"
          label={t("adminCatalog.bodyType")}
          placeholderOption={t("adminCatalog.selectNone")}
          options={BODY_TYPES.map((bt) => ({ value: bt, label: BODY_TYPE_LABEL[bt] }))}
        />
        <Select
          name="generation_id"
          label={t("adminCatalog.generationOptional")}
          placeholderOption={t("adminCatalog.allGenerationsOption")}
          options={generationOptions}
          helpText={t("adminCatalog.generationHelp")}
        />
        <Input name="power_hp" label={t("adminCatalog.hpLabel")} type="number" />
        <Input name="range_km" label={t("adminCatalog.mileageKm")} type="number" />
        <Input name="image_url" label={t("adminCatalog.imageUrl")} />
        <Select
          name="status"
          label={t("adminCatalog.status")}
          defaultValue="active"
          options={[
            { value: "active", label: t("adminCatalog.statusActive") },
            { value: "inactive", label: t("adminCatalog.statusInactive") },
          ]}
        />
        <div className="flex items-end md:col-span-3">
          <Button type="submit">{t("adminCatalog.addTrim")}</Button>
        </div>
      </form>

      <AdminTable
        rows={trims}
        rowKey={(tr) => tr.trim_id}
        empty={t("adminCatalog.emptyTrims")}
        columns={[
          {
            key: "name",
            header: t("adminCatalog.name"),
            cell: (tr) => (
              <Link href={`/admin/catalog/trims/${tr.trim_id}`} className="font-medium hover:underline">
                {tr.display_name}
              </Link>
            ),
          },
          {
            key: "brand",
            header: t("adminCatalog.brand"),
            cell: (tr) => brands.find((b) => b.brand_id === tr.brand_id)?.name ?? tr.brand_id,
          },
          { key: "year", header: t("adminCatalog.year"), cell: (tr) => tr.year },
          { key: "energy", header: t("adminCatalog.energy"), cell: (tr) => tr.energy_type },
          { key: "power", header: t("adminCatalog.hp"), cell: (tr) => tr.power_hp ?? "—" },
          { key: "range", header: t("adminCatalog.km"), cell: (tr) => tr.range_km ?? "—" },
          { key: "status", header: t("adminCatalog.status"), cell: (tr) => <StatusBadge status={tr.status} /> },
        ]}
      />
    </div>
  );
}
