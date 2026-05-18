import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getEncyclopedia } from "@/lib/content/admin-store";
import { ENCYCLOPEDIA_CATEGORIES } from "@/lib/content/types";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminEncyclopediaEditPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const entry = getEncyclopedia(contentId);
  if (!entry) notFound();
  // Admin is AZ-first: edit fields show the AZ source. EN/RU translations are
  // added separately via the seed (or, later, an admin translation panel).
  const title = getLocalizedText(entry.title, "az");
  const summary = getLocalizedText(entry.summary, "az");
  const body = getLocalizedText(entry.body, "az");
  const excerpt = entry.excerpt ? getLocalizedText(entry.excerpt, "az") : "";
  const reason = entry.related_model_reason
    ? getLocalizedText(entry.related_model_reason, "az")
    : "";
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <StatusBadge status={entry.status ?? "draft"} />
      </header>
      <form
        action={`/api/internal/content/encyclopedia/${contentId}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Input name="title" label={t("adminContent.newsTitleField")} defaultValue={title} />
        <Input name="slug" label={t("adminContent.slug")} defaultValue={entry.slug} />
        <Select
          name="category"
          label={t("adminContent.category")}
          defaultValue={entry.category ?? ""}
          placeholderOption="—"
          options={ENCYCLOPEDIA_CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Input name="image_url" label={t("adminContent.imageUrl")} defaultValue={entry.image_url ?? ""} />
        <Input name="image_alt" label={t("adminContent.imageAlt")} defaultValue={entry.image_alt ?? ""} />
        <Input
          name="source_name"
          label={t("adminContent.sourceNameLabel")}
          defaultValue={entry.source?.name ?? ""}
        />
        <Textarea name="summary" label={t("adminContent.summaryLabel")} defaultValue={summary} />
        <Textarea name="excerpt" label={t("adminContent.excerptLabel")} defaultValue={excerpt} />
        <Textarea name="body" label={t("adminContent.bodyLabel")} defaultValue={body} rows={6} />
        <Input
          name="related_trim_ids"
          label={t("adminContent.relatedTrimIdsHint")}
          defaultValue={entry.related_trim_ids.join(", ")}
        />
        <Input
          name="related_model_reason"
          label={t("adminContent.relatedReason")}
          defaultValue={reason}
        />
        <div className="flex flex-wrap items-end gap-2 md:col-span-2">
          <Button type="submit">{t("buttons.save")}</Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={`/api/internal/content/encyclopedia/${contentId}/publish`} method="post">
          <Button type="submit" variant="primary">{t("adminContent.publish")}</Button>
        </form>
        <form action={`/api/internal/content/encyclopedia/${contentId}/unpublish`} method="post">
          <Button type="submit" variant="secondary">{t("adminContent.unpublish")}</Button>
        </form>
      </div>
    </div>
  );
}
