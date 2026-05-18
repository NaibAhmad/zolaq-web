import {
  EncyclopediaListClient,
  type EncyclopediaListItem,
} from "@/components/content/EncyclopediaListClient";
import { categoryLabel } from "@/lib/content/encyclopedia-categories";
import { listEncyclopedia } from "@/lib/content/lookup";
import { getServerLocale } from "@/lib/i18n/server";
import { getLocalizedText } from "@/lib/i18n/localized";
import { ROUTES } from "@/lib/routes";

export default async function EncyclopediaPage() {
  const locale = await getServerLocale();
  const items: EncyclopediaListItem[] = listEncyclopedia().map((entry) => {
    const title = getLocalizedText(entry.title, locale);
    const excerpt = getLocalizedText(entry.excerpt ?? entry.summary, locale);
    return {
      key: entry.content_id,
      href: ROUTES.encyclopediaItem(entry.slug),
      title,
      excerpt,
      publishedAt: entry.published_at,
      category: entry.category,
      categoryLabel: categoryLabel(entry.category, locale),
      hasRelatedModel: entry.related_trim_ids.length > 0,
      cover: {
        src: entry.image_url,
        alt: entry.image_alt ?? `${title} — Zolaq`,
      },
    };
  });

  return <EncyclopediaListClient items={items} />;
}
