import { notFound } from "next/navigation";
import { EncyclopediaArticle } from "@/components/content/EncyclopediaArticle";
import { getSession } from "@/lib/auth/session";
import { trimSummaryFor } from "@/lib/cars/summary";
import { getEncyclopediaBySlug } from "@/lib/content/lookup";
import { onEncyclopediaRead } from "@/lib/gamification/hooks";

export default async function EncyclopediaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEncyclopediaBySlug(slug);
  if (!entry) notFound();

  // Sprint 8F P0-lite: award badge + capped daily points on first read.
  // Owner-visible only; no public effect.
  const session = await getSession();
  if (session) onEncyclopediaRead(session.userId, slug);

  const relatedTrims = entry.related_trim_ids.map((id) => trimSummaryFor(id));

  return <EncyclopediaArticle entry={entry} relatedTrims={relatedTrims} />;
}
