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

export default function AdminTrimsPage() {
  const brands = listBrands();
  const trims = listTrims();
  const brandNameById = new Map(brands.map((b) => [b.brand_id, b.name]));
  const generationOptions = GENERATIONS.filter((g) => g.status === "active").map(
    (g) => ({
      value: g.generation_id,
      label: `${brandNameById.get(g.brand_id) ?? g.brand_id} ${g.model_name} — ${g.name}`,
    }),
  );
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Komplektasiyalar</h1>

      <form
        action="/api/internal/trims"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-3"
      >
        <Select
          name="brand_id"
          label="Marka"
          required
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
          placeholderOption="Marka seç"
        />
        <Input name="model_name" label="Model adı" required />
        <Input name="year" label="İl" type="number" required defaultValue={new Date().getFullYear()} />
        <Input
          name="display_name"
          label="Tam ad (Komplektasiya display)"
          required
          placeholder="Marka + model + komplektasiya"
          helpText="Publik kataloqda Komplektasiya kimi göstərilir. Məsələn: BYD Han EV Premium AWD"
        />
        <Select
          name="energy_type"
          label="Enerji növü"
          required
          options={ENERGY_TYPES.map((e) => ({ value: e, label: e }))}
        />
        <Select
          name="body_type"
          label="Kuzov tipi"
          placeholderOption="Seçilməyib"
          options={BODY_TYPES.map((bt) => ({ value: bt, label: BODY_TYPE_LABEL[bt] }))}
        />
        <Select
          name="generation_id"
          label="Nəsil (opsional)"
          placeholderOption="Bütün nəsillər"
          options={generationOptions}
          helpText="Boş buraxılarsa, komplektasiya nəsilə bağlanmır."
        />
        <Input name="power_hp" label="Güc (HP)" type="number" />
        <Input name="range_km" label="Yürüş (km)" type="number" />
        <Input name="image_url" label="Şəkil URL" />
        <Select
          name="status"
          label="Status"
          defaultValue="active"
          options={[
            { value: "active", label: "Aktiv" },
            { value: "inactive", label: "Deaktiv" },
          ]}
        />
        <div className="flex items-end md:col-span-3">
          <Button type="submit">Komplektasiya əlavə et</Button>
        </div>
      </form>

      <AdminTable
        rows={trims}
        rowKey={(t) => t.trim_id}
        empty="Hələ komplektasiya yoxdur."
        columns={[
          {
            key: "name",
            header: "Ad",
            cell: (t) => (
              <Link href={`/admin/catalog/trims/${t.trim_id}`} className="font-medium hover:underline">
                {t.display_name}
              </Link>
            ),
          },
          {
            key: "brand",
            header: "Marka",
            cell: (t) => brands.find((b) => b.brand_id === t.brand_id)?.name ?? t.brand_id,
          },
          { key: "year", header: "İl", cell: (t) => t.year },
          { key: "energy", header: "Enerji", cell: (t) => t.energy_type },
          { key: "power", header: "HP", cell: (t) => t.power_hp ?? "—" },
          { key: "range", header: "km", cell: (t) => t.range_km ?? "—" },
          { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
        ]}
      />
    </div>
  );
}
