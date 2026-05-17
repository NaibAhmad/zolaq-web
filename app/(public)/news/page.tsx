import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/state/EmptyState";
import { RichContentCard } from "@/components/content/RichContentCard";
import { listNews } from "@/lib/content/lookup";
import { ROUTES } from "@/lib/routes";

export default function NewsPage() {
  const articles = listNews();

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container>
          <SectionHeading
            eyebrow="Xəbərlər"
            title="Bazar və modellər"
            subtitle="Yeni modellər, dilerlər və bazar yenilikləri."
          />
        </Container>
      </Section>
      <Section tone="light" padding="md">
        <Container>
          {articles.length === 0 ? (
            <EmptyState title="Hələ xəbər yoxdur" />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <li key={article.content_id}>
                  <RichContentCard
                    href={ROUTES.newsItem(article.slug)}
                    title={article.title}
                    excerpt={article.excerpt ?? article.summary}
                    publishedAt={article.published_at}
                    category={{
                      label: article.category ?? "Xəbər",
                      tone: "blue",
                    }}
                    cover={{
                      src: article.image_url,
                      alt:
                        article.image_alt ??
                        `${article.title} — Zolaq xəbər`,
                      moduleLabel: "Xəbər",
                    }}
                    hasRelatedModel={article.related_trim_ids.length > 0}
                    dateLabel="Dərc olundu"
                  />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
