import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands, listModels } from "@/lib/admin";

export default function AdminModelsPage() {
  const brands = listBrands();
  const models = listModels();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Modellər</h1>

      <form
        action="/api/internal/models"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      >
        <Select
          name="brand_id"
          label="Marka"
          required
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
          placeholderOption="Marka seç"
        />
        <Input name="name" label="Model adı" required />
        <Input name="body_type" label="Kuzov" placeholder="opsional" />
        <Select
          name="status"
          label="Status"
          defaultValue="active"
          options={[
            { value: "active", label: "Aktiv" },
            { value: "inactive", label: "Deaktiv" },
          ]}
        />
        <div className="flex items-end">
          <Button type="submit">Model əlavə et</Button>
        </div>
      </form>

      <AdminTable
        rows={models}
        rowKey={(m) => m.model_id}
        empty="Hələ model yoxdur."
        columns={[
          {
            key: "name",
            header: "Model",
            cell: (m) => (
              <Link href={`/admin/catalog/models/${m.model_id}`} className="font-medium hover:underline">
                {m.name}
              </Link>
            ),
          },
          {
            key: "brand",
            header: "Marka",
            cell: (m) => brands.find((b) => b.brand_id === m.brand_id)?.name ?? m.brand_id,
          },
          { key: "body", header: "Kuzov", cell: (m) => m.body_type ?? "—" },
          { key: "status", header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
        ]}
      />
    </div>
  );
}
