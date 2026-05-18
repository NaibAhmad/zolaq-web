import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands, listModels } from "@/lib/admin";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminModelsPage() {
  const brands = listBrands();
  const models = listModels();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminCatalog.modelsTitle")}</h1>

      <form
        action="/api/internal/models"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      >
        <Select
          name="brand_id"
          label={t("adminCatalog.brand")}
          required
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
          placeholderOption={t("adminCatalog.selectBrand")}
        />
        <Input name="name" label={t("adminCatalog.modelName")} required />
        <Input
          name="body_type"
          label={t("adminCatalog.bodyTypeShort")}
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
          <Button type="submit">{t("adminCatalog.addModel")}</Button>
        </div>
      </form>

      <AdminTable
        rows={models}
        rowKey={(m) => m.model_id}
        empty={t("adminCatalog.emptyModels")}
        columns={[
          {
            key: "name",
            header: t("adminCatalog.model"),
            cell: (m) => (
              <Link href={`/admin/catalog/models/${m.model_id}`} className="font-medium hover:underline">
                {m.name}
              </Link>
            ),
          },
          {
            key: "brand",
            header: t("adminCatalog.brand"),
            cell: (m) => brands.find((b) => b.brand_id === m.brand_id)?.name ?? m.brand_id,
          },
          { key: "body", header: t("adminCatalog.bodyTypeShort"), cell: (m) => m.body_type ?? "—" },
          { key: "status", header: t("adminCatalog.status"), cell: (m) => <StatusBadge status={m.status} /> },
        ]}
      />
    </div>
  );
}
