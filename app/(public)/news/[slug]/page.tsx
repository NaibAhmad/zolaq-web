import { notFound } from "next/navigation";
import { NewsArticle } from "@/components/content/NewsArticle";
import { getSession } from "@/lib/auth/session";
import { trimSummaryFor } from "@/lib/cars/summary";
import { getNewsBySlug } from "@/lib/content/lookup";
import { onNewsRead } from "@/lib/gamification/hooks";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getNewsBySlug(slug);
  if (!article) notFound();

  // Sprint 8F P0-lite: capped daily points on first news read per slug.
  // Owner-visible only; no public effect.
  const session = await getSession();
  if (session) onNewsRead(session.userId, slug);

  const relatedTrims = article.related_trim_ids.map((id) =>
    trimSummaryFor(id),
  );

  return <NewsArticle article={article} relatedTrims={relatedTrims} />;
}
