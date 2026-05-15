import { ContentList } from "@/components/content/ContentList";
import { listEncyclopedia } from "@/lib/content/lookup";
import { ROUTES } from "@/lib/routes";

export default function EncyclopediaPage() {
  const items = listEncyclopedia().map((entry) => ({
    key: entry.content_id,
    href: ROUTES.encyclopediaItem(entry.slug),
    title: entry.title,
    summary: entry.summary,
    publishedAt: entry.published_at,
  }));

  return (
    <ContentList
      heading="Bələdçi"
      intro="Avtomobil texnologiyaları və terminlər haqqında qısa məqalələr."
      emptyTitle="Hələ məqalə yoxdur"
      items={items}
    />
  );
}
