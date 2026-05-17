import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands } from "@/lib/admin";
import { listGenerations } from "@/lib/generations/repository";

export default function AdminGenerationsPage() {
  const brands = listBrands();
  const generations = listGenerations();
  const brandName = (id: string) => brands.find((b) => b.brand_id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Nəsillər</h1>
      <p className="text-sm text-foreground-muted">
        Nəsil (generation) Marka → Model → Komplektasiya zəncirində ortadakı dimensiyadır.
        Nümunə: BMW X5 → G05 (nəsil) → xDrive40i M Sport (komplektasiya).
      </p>

      <form
        action="/api/internal/generations"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      >
        <Select
          name="brand_id"
          label="Marka"
          required
          placeholderOption="Seçin"
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
        />
        <Input name="model_name" label="Model adı" required placeholder="Camry" />
        <Input name="name" label="Nəsil adı" required placeholder="XV80" />
        <Input
          name="display_name"
          label="Görünən ad"
          required
          placeholder="XV80 · 2023–"
        />
        <div className="flex items-end">
          <Button type="submit">Əlavə et</Button>
        </div>
        <Input
          name="production_year_from"
          label="İstehsal ili, başlanğıc"
          type="number"
          required
          min={1900}
        />
        <Input
          name="production_year_to"
          label="İstehsal ili, bitiş (opsional)"
          type="number"
          min={1900}
        />
        <Select
          name="status"
          label="Status"
          defaultValue="active"
          options={[
            { value: "active", label: "Aktiv" },
            { value: "inactive", label: "Deaktiv" },
          ]}
        />
        <Input name="source" label="Mənbə" placeholder="opsional" />
      </form>

      <AdminTable
        rows={generations}
        rowKey={(g) => g.generation_id}
        empty="Hələ nəsil yoxdur."
        columns={[
          { key: "brand", header: "Marka", cell: (g) => brandName(g.brand_id) },
          { key: "model", header: "Model", cell: (g) => g.model_name },
          {
            key: "name",
            header: "Nəsil",
            cell: (g) => (
              <Link
                href={`/admin/catalog/generations/${g.generation_id}`}
                className="font-medium hover:underline"
              >
                {g.display_name}
              </Link>
            ),
          },
          {
            key: "years",
            header: "İllər",
            cell: (g) =>
              g.production_year_to
                ? `${g.production_year_from}–${g.production_year_to}`
                : `${g.production_year_from}–`,
          },
          {
            key: "status",
            header: "Status",
            cell: (g) => <StatusBadge status={g.status} />,
          },
          {
            key: "id",
            header: "ID",
            cell: (g) => (
              <code className="text-xs text-foreground-muted">{g.generation_id}</code>
            ),
          },
        ]}
      />
    </div>
  );
}
