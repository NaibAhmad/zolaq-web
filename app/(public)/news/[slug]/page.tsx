import { notFound } from "next/navigation";
import { ContentDetail } from "@/components/content/ContentDetail";
import { trimSummaryFor } from "@/lib/cars/summary";
import { getNewsBySlug } from "@/lib/content/lookup";
import { ROUTES } from "@/lib/routes";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getNewsBySlug(slug);
  if (!article) notFound();

  const relatedTrims = article.related_trim_ids.map((id) => trimSummaryFor(id));

  return (
    <ContentDetail
      contentId={article.content_id}
      contentType="news"
      slugOrId={article.slug}
      title={article.title}
      summary={article.summary}
      body={article.body}
      publishedAt={article.published_at}
      backHref={ROUTES.news}
      backLabel="Xəbərlərə qayıt"
      relatedTrims={relatedTrims}
    />
  );
}
