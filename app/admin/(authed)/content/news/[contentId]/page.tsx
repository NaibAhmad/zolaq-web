import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getNews } from "@/lib/content/admin-store";
import { listTrims } from "@/lib/admin";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminNewsEditPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const news = getNews(contentId);
  if (!news) notFound();
  const trims = listTrims();
  const title = getLocalizedText(news.title, "az");
  const summary = getLocalizedText(news.summary, "az");
  const body = getLocalizedText(news.body, "az");
  const excerpt = news.excerpt ? getLocalizedText(news.excerpt, "az") : "";
  const reason = news.related_model_reason
    ? getLocalizedText(news.related_model_reason, "az")
    : "";
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("adminContent.newsHeader", { title })}</h1>
        <StatusBadge status={news.status ?? "draft"} />
      </header>
      <form
        action={`/api/internal/content/news/${contentId}`}
        method="post"
        className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Input name="title" label={t("adminContent.newsTitleField")} defaultValue={title} />
        <Input name="slug" label={t("adminContent.slug")} defaultValue={news.slug} />
        <Input name="category" label={t("adminContent.category")} defaultValue={news.category ?? ""} />
        <Input name="source_name" label={t("adminContent.sourceLabel")} defaultValue={news.source_name ?? ""} />
        <Input name="image_url" label={t("adminContent.imageUrl")} defaultValue={news.image_url ?? ""} />
        <Input name="image_alt" label={t("adminContent.imageAlt")} defaultValue={news.image_alt ?? ""} />
        <Textarea name="summary" label={t("adminContent.summaryLabel")} defaultValue={summary} />
        <Textarea name="excerpt" label={t("adminContent.excerptLabel")} defaultValue={excerpt} />
        <Textarea name="body" label={t("adminContent.bodyLabel")} defaultValue={body} rows={6} />
        <Input
          name="related_trim_ids"
          label={t("adminContent.relatedTrimIdsHint")}
          defaultValue={news.related_trim_ids.join(", ")}
          helpText={t("adminContent.relatedTrimsHelpAvailable", { count: trims.length })}
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
        <form action={`/api/internal/content/news/${contentId}/publish`} method="post">
          <Button type="submit" variant="primary">{t("adminContent.publish")}</Button>
        </form>
        <form action={`/api/internal/content/news/${contentId}/unpublish`} method="post">
          <Button type="submit" variant="secondary">{t("adminContent.unpublish")}</Button>
        </form>
      </div>
    </div>
  );
}
