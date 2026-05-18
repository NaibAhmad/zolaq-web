import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/state/EmptyState";
import { RichContentCard } from "@/components/content/RichContentCard";
import { listNews } from "@/lib/content/lookup";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { getLocalizedText } from "@/lib/i18n/localized";
import { ROUTES } from "@/lib/routes";

export default async function NewsPage() {
  const t = await getServerT();
  const locale = await getServerLocale();
  const articles = listNews();

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container>
          <SectionHeading
            eyebrow={t("newsHero.eyebrow")}
            title={t("newsHero.title")}
            subtitle={t("newsHero.subtitle")}
          />
        </Container>
      </Section>
      <Section tone="light" padding="md">
        <Container>
          {articles.length === 0 ? (
            <EmptyState title={t("newsHero.emptyTitle")} />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const title = getLocalizedText(article.title, locale);
                const excerpt = getLocalizedText(
                  article.excerpt ?? article.summary,
                  locale,
                );
                return (
                  <li key={article.content_id}>
                    <RichContentCard
                      href={ROUTES.newsItem(article.slug)}
                      title={title}
                      excerpt={excerpt}
                      publishedAt={article.published_at}
                      category={{
                        label: article.category ?? t("newsHero.defaultCategory"),
                        tone: "blue",
                      }}
                      cover={{
                        src: article.image_url,
                        alt: article.image_alt ?? `${title} — Zolaq`,
                        moduleLabel: t("newsHero.moduleLabel"),
                      }}
                      hasRelatedModel={article.related_trim_ids.length > 0}
                      dateLabel={t("newsHero.dateLabel")}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
