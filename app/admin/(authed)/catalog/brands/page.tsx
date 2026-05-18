import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands } from "@/lib/admin";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminBrandsPage() {
  const brands = listBrands();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminCatalog.brandsTitle")}</h1>

      <form
        action="/api/internal/brands"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <Input name="name" label={t("adminCatalog.name")} required />
        <Input
          name="country"
          label={t("adminCatalog.country")}
          placeholder={t("forms.optionalField")}
        />
        <Select
          name="status"
          label={t("adminCatalog.status")}
          defaultValue="active"
          options={[
            { value: "active", label: t("adminCatalog.statusActive") },
            { value: "inactive", label: t("adminCatalog.statusInactive") },
          ]}
        />
        <div className="flex items-end">
          <Button type="submit">{t("adminCatalog.addBrand")}</Button>
        </div>
      </form>

      <AdminTable
        rows={brands}
        rowKey={(b) => b.brand_id}
        empty={t("adminCatalog.emptyBrands")}
        columns={[
          {
            key: "name",
            header: t("adminCatalog.name"),
            cell: (b) => (
              <Link href={`/admin/catalog/brands/${b.brand_id}`} className="font-medium hover:underline">
                {b.name}
              </Link>
            ),
          },
          { key: "country", header: t("adminCatalog.country"), cell: (b) => b.country ?? "—" },
          { key: "status", header: t("adminCatalog.status"), cell: (b) => <StatusBadge status={b.status} /> },
          { key: "id", header: t("adminCatalog.idColumn"), cell: (b) => <code className="text-xs text-foreground-muted">{b.brand_id}</code> },
        ]}
      />
    </div>
  );
}
