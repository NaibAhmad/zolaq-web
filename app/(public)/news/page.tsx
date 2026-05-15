import { ContentList } from "@/components/content/ContentList";
import { listNews } from "@/lib/content/lookup";
import { ROUTES } from "@/lib/routes";

export default function NewsPage() {
  const items = listNews().map((article) => ({
    key: article.content_id,
    href: ROUTES.newsItem(article.slug),
    title: article.title,
    summary: article.summary,
    publishedAt: article.published_at,
  }));

  return (
    <ContentList
      heading="Xəbərlər"
      intro="Yeni modellər, dilerlər və bazar yenilikləri."
      emptyTitle="Hələ xəbər yoxdur"
      items={items}
    />
  );
}
