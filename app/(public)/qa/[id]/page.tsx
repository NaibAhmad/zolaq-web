import { notFound } from "next/navigation";
import { ContentDetail } from "@/components/content/ContentDetail";
import { trimSummaryFor } from "@/lib/cars/summary";
import { getQAById } from "@/lib/content/lookup";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { getLocalizedText } from "@/lib/i18n/localized";
import { ROUTES } from "@/lib/routes";

export default async function QaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const qa = getQAById(id);
  if (!qa) notFound();

  const t = await getServerT();
  const locale = await getServerLocale();

  const relatedTrims = qa.related_trim_ids.map((trimId) =>
    trimSummaryFor(trimId)
  );

  return (
    <ContentDetail
      contentId={qa.content_id}
      contentType="qa"
      slugOrId={qa.id}
      title={getLocalizedText(qa.question, locale)}
      body={getLocalizedText(qa.answer, locale)}
      publishedAt={qa.published_at}
      backHref={ROUTES.qa}
      backLabel={t("qaDetail.backLabel")}
      relatedTrims={relatedTrims}
    />
  );
}
