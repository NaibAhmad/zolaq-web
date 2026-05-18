import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { listBrands } from "@/lib/admin";
import { getGeneration } from "@/lib/generations/repository";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminGenerationEditPage({
  params,
}: {
  params: Promise<{ generationId: string }>;
}) {
  const { generationId } = await params;
  const generation = getGeneration(generationId);
  if (!generation) notFound();
  const brands = listBrands();
  const t = await getServerT();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {t("adminCatalog.generationEditTitle", { displayName: generation.display_name })}
      </h1>

      <form
        action={`/api/internal/generations/${generation.generation_id}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Select
          name="brand_id"
          label={t("adminCatalog.brand")}
          defaultValue={generation.brand_id}
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
        />
        <Input
          name="model_name"
          label={t("adminCatalog.modelName")}
          defaultValue={generation.model_name}
        />
        <Input
          name="name"
          label={t("adminCatalog.generationName")}
          defaultValue={generation.name}
        />
        <Input
          name="display_name"
          label={t("adminCatalog.displayName")}
          defaultValue={generation.display_name}
        />
        <Input
          name="production_year_from"
          label={t("adminCatalog.yearStart")}
          type="number"
          defaultValue={generation.production_year_from}
        />
        <Input
          name="production_year_to"
          label={t("adminCatalog.yearEnd")}
          type="number"
          defaultValue={generation.production_year_to ?? ""}
        />
        <Select
          name="status"
          label={t("adminCatalog.status")}
          defaultValue={generation.status}
          options={[
            { value: "active", label: t("adminCatalog.statusActive") },
            { value: "inactive", label: t("adminCatalog.statusInactive") },
          ]}
        />
        <Input
          name="source"
          label={t("adminCatalog.source")}
          defaultValue={generation.source ?? ""}
        />
        <Input
          name="verification_status"
          label={t("adminCatalog.verificationStatus")}
          defaultValue={generation.verification_status ?? ""}
        />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">{t("buttons.save")}</Button>
        </div>
      </form>

      <form
        action={`/api/internal/generations/${generation.generation_id}`}
        method="post"
        className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
      >
        <input type="hidden" name="_method" value="delete" />
        <p className="mb-3 text-sm text-foreground-muted">
          {t("adminCatalog.archiveHint")}
        </p>
        <Button type="submit" variant="ghost">
          {t("adminCatalog.archive")}
        </Button>
      </form>
    </div>
  );
}
