import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getModel, listBrands } from "@/lib/admin";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminModelEditPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  const model = getModel(modelId);
  if (!model) notFound();
  const brands = listBrands();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">
        {t("adminCatalog.modelEditTitle", { name: model.name })}
      </h1>
      <form
        action={`/api/internal/models/${model.model_id}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Select
          name="brand_id"
          label={t("adminCatalog.brand")}
          defaultValue={model.brand_id}
          options={brands.map((b) => ({ value: b.brand_id, label: b.name }))}
        />
        <Input name="name" label={t("adminCatalog.name")} defaultValue={model.name} />
        <Input
          name="body_type"
          label={t("adminCatalog.bodyTypeShort")}
          defaultValue={model.body_type ?? ""}
        />
        <Select
          name="status"
          label={t("adminCatalog.status")}
          defaultValue={model.status}
          options={[
            { value: "active", label: t("adminCatalog.statusActive") },
            { value: "inactive", label: t("adminCatalog.statusInactive") },
          ]}
        />
        <div className="flex items-end md:col-span-2">
          <Button type="submit">{t("buttons.save")}</Button>
        </div>
      </form>
    </div>
  );
}
