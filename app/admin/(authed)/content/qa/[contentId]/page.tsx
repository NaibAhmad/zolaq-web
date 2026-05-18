import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getQA } from "@/lib/content/admin-store";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminQAEditPage({
  params,
}: {
  params: Promise<{ contentId: string }>;
}) {
  const { contentId } = await params;
  const qa = getQA(contentId);
  if (!qa) notFound();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("adminContent.qaHeader", { id: qa.id })}</h1>
        <StatusBadge status={qa.status ?? "draft"} />
      </header>
      <form
        action={`/api/internal/content/qa/${contentId}`}
        method="post"
        className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
      >
        <input type="hidden" name="_method" value="patch" />
        <Input
          name="question"
          label={t("adminContent.question")}
          defaultValue={getLocalizedText(qa.question, "az")}
        />
        <Textarea
          name="answer"
          label={t("adminContent.answerLabel")}
          defaultValue={getLocalizedText(qa.answer, "az")}
          rows={6}
        />
        <Input
          name="related_trim_ids"
          label={t("adminContent.relatedTrimIdsHint")}
          defaultValue={qa.related_trim_ids.join(", ")}
        />
        <div>
          <Button type="submit">{t("buttons.save")}</Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <form action={`/api/internal/content/qa/${contentId}/publish`} method="post">
          <Button type="submit" variant="primary">{t("adminContent.approveAndPublish")}</Button>
        </form>
        <form action={`/api/internal/content/qa/${contentId}/unpublish`} method="post">
          <Button type="submit" variant="danger">{t("adminContent.spamUnpublish")}</Button>
        </form>
      </div>
    </div>
  );
}
