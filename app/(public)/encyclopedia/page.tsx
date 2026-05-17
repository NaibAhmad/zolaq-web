import {
  EncyclopediaListClient,
  type EncyclopediaListItem,
} from "@/components/content/EncyclopediaListClient";
import { categoryLabel } from "@/lib/content/encyclopedia-categories";
import { listEncyclopedia } from "@/lib/content/lookup";
import { ROUTES } from "@/lib/routes";

export default function EncyclopediaPage() {
  const items: EncyclopediaListItem[] = listEncyclopedia().map((entry) => ({
    key: entry.content_id,
    href: ROUTES.encyclopediaItem(entry.slug),
    title: entry.title,
    excerpt: entry.excerpt ?? entry.summary,
    publishedAt: entry.published_at,
    category: entry.category,
    categoryLabel: categoryLabel(entry.category),
    hasRelatedModel: entry.related_trim_ids.length > 0,
    cover: {
      src: entry.image_url,
      alt: entry.image_alt ?? `${entry.title} — Zolaq ensiklopediya`,
    },
  }));

  return <EncyclopediaListClient items={items} />;
}
