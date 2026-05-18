import { notFound } from "next/navigation";
import { ContentDetail } from "@/components/content/ContentDetail";
import { trimSummaryFor } from "@/lib/cars/summary";
import { getQAById } from "@/lib/content/lookup";
import { ROUTES } from "@/lib/routes";

export default async function QaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const qa = getQAById(id);
  if (!qa) notFound();

  const relatedTrims = qa.related_trim_ids.map((trimId) =>
    trimSummaryFor(trimId)
  );

  return (
    <ContentDetail
      contentId={qa.content_id}
      contentType="qa"
      slugOrId={qa.id}
      title={qa.question}
      body={qa.answer}
      publishedAt={qa.published_at}
      backHref={ROUTES.qa}
      backLabel="Sorğuya qayıt"
      relatedTrims={relatedTrims}
    />
  );
}
