import { ContentList } from "@/components/content/ContentList";
import { listQA } from "@/lib/content/lookup";
import { ROUTES } from "@/lib/routes";

export default function QaPage() {
  const items = listQA().map((entry) => ({
    key: entry.content_id,
    href: ROUTES.qaItem(entry.id),
    title: entry.question,
    summary: entry.answer,
    publishedAt: entry.published_at,
  }));

  return (
    <ContentList
      heading="Suallar və cavablar"
      intro="Ekspert cavabları və real alıcı sualları."
      emptyTitle="Hələ sual yoxdur"
      items={items}
    />
  );
}
