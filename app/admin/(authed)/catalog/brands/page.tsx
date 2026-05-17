import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands } from "@/lib/admin";

export default function AdminBrandsPage() {
  const brands = listBrands();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Markalar</h1>

      <form
        action="/api/internal/brands"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <Input name="name" label="Ad" required />
        <Input name="country" label="Ölkə" placeholder="opsional" />
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
          <Button type="submit">Marka əlavə et</Button>
        </div>
      </form>

      <AdminTable
        rows={brands}
        rowKey={(b) => b.brand_id}
        empty="Hələ marka yoxdur."
        columns={[
          {
            key: "name",
            header: "Ad",
            cell: (b) => (
              <Link href={`/admin/catalog/brands/${b.brand_id}`} className="font-medium hover:underline">
                {b.name}
              </Link>
            ),
          },
          { key: "country", header: "Ölkə", cell: (b) => b.country ?? "—" },
          { key: "status", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
          { key: "id", header: "ID", cell: (b) => <code className="text-xs text-foreground-muted">{b.brand_id}</code> },
        ]}
      />
    </div>
  );
}
