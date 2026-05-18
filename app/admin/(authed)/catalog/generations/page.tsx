import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands } from "@/lib/admin";
import { listGenerations } from "@/lib/generations/repository";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminGenerationsPage() {
  const brands = listBrands();
  const generations = listGenerations();
  const brandName = (id: string) => brands.find((b) => b.brand_id === id)?.name ?? id;
  const t = await getServerT();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminCatalog.generationsTitle")}</h1>
      <p className="text-sm text-foreground-muted">
        {t("adminCatalog.generationsLongDescription")}
      </p>

      <form
        action="/api/internal/generations"
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      >
        <Select
          name="brand_id"
          label={t("adminCatalog.brand")}
          required
          placeholderOption={t("adminCatalog.selectGeneric")}
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
        />
        <Input name="model_name" label={t("adminCatalog.modelName")} required placeholder="Camry" />
        <Input name="name" label={t("adminCatalog.generationName")} required placeholder="XV80" />
        <Input
          name="display_name"
          label={t("adminCatalog.displayName")}
          required
          placeholder="XV80 · 2023–"
        />
        <div className="flex items-end">
          <Button type="submit">{t("adminCatalog.addGeneration")}</Button>
        </div>
        <Input
          name="production_year_from"
          label={t("adminCatalog.yearStart")}
          type="number"
          required
          min={1900}
        />
        <Input
          name="production_year_to"
          label={t("adminCatalog.yearEndOptional")}
          type="number"
          min={1900}
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
        <Input
          name="source"
          label={t("adminCatalog.source")}
          placeholder={t("forms.optionalField")}
        />
      </form>

      <AdminTable
        rows={generations}
        rowKey={(g) => g.generation_id}
        empty={t("adminCatalog.emptyGenerations")}
        columns={[
          { key: "brand", header: t("adminCatalog.brand"), cell: (g) => brandName(g.brand_id) },
          { key: "model", header: t("adminCatalog.model"), cell: (g) => g.model_name },
          {
            key: "name",
            header: t("adminCatalog.generationLabel"),
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
            header: t("adminCatalog.years"),
            cell: (g) =>
              g.production_year_to
                ? `${g.production_year_from}–${g.production_year_to}`
                : `${g.production_year_from}–`,
          },
          {
            key: "status",
            header: t("adminCatalog.status"),
            cell: (g) => <StatusBadge status={g.status} />,
          },
          {
            key: "id",
            header: t("adminCatalog.idColumn"),
            cell: (g) => (
              <code className="text-xs text-foreground-muted">{g.generation_id}</code>
            ),
          },
        ]}
      />
    </div>
  );
}
