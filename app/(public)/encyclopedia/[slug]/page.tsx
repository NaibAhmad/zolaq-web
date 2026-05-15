import { notFound } from "next/navigation";
import { ContentDetail } from "@/components/content/ContentDetail";
import { trimSummaryFor } from "@/lib/cars/summary";
import { getEncyclopediaBySlug } from "@/lib/content/lookup";
import { ROUTES } from "@/lib/routes";

export default async function EncyclopediaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEncyclopediaBySlug(slug);
  if (!entry) notFound();

  const relatedTrims = entry.related_trim_ids.map((id) => trimSummaryFor(id));

  return (
    <ContentDetail
      contentId={entry.content_id}
      contentType="encyclopedia"
      slugOrId={entry.slug}
      title={entry.title}
      summary={entry.summary}
      body={entry.body}
      publishedAt={entry.published_at}
      backHref={ROUTES.encyclopedia}
      backLabel="Bələdçiyə qayıt"
      relatedTrims={relatedTrims}
    />
  );
}
