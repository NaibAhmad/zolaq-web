import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ContentCoverImage } from "@/components/content/ContentCoverImage";
import { ContentViewTracker } from "@/components/content/ContentViewTracker";
import { RelatedModelDarkCard } from "@/components/content/RelatedModelDarkCard";
import { RelatedModelLink } from "@/components/content/RelatedModelLink";
import { formatDateAz } from "@/lib/format/date";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { getLocalizedText } from "@/lib/i18n/localized";
import { ROUTES } from "@/lib/routes";
import type { NewsArticle as NewsArticleType } from "@/lib/content/types";
import type { LeadTrimSummary } from "@/lib/leads/types";

type Props = {
  article: NewsArticleType;
  relatedTrims: readonly LeadTrimSummary[];
};

export async function NewsArticle({ article, relatedTrims }: Props) {
  const t = await getServerT();
  const locale = await getServerLocale();
  const title = getLocalizedText(article.title, locale);
  const summary = getLocalizedText(article.summary, locale);
  const bodyText = getLocalizedText(article.body, locale);
  const categoryLabel =
    article.category ?? article.source_name ?? t("content.categoryFallback");
  const coverAlt = article.image_alt ?? `${title} — Zolaq`;
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const primaryTrim = relatedTrims[0];
  const extraTrims = relatedTrims.slice(1);
  const hasSidebar = Boolean(primaryTrim);
  const reasonText = article.related_model_reason
    ? getLocalizedText(article.related_model_reason, locale)
    : null;

  return (
    <>
      <ContentViewTracker
        contentId={article.content_id}
        contentType="news"
        slugOrId={article.slug}
      />

      <Section tone="muted" padding="sm">
        <Container size="wide">
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-foreground-muted"
          >
            <Link
              href={ROUTES.news}
              className="hover:text-foreground hover:underline"
            >
              {t("content.newsBreadcrumb")}
            </Link>
            <span aria-hidden className="mx-2">·</span>
            <span>{categoryLabel}</span>
            <span aria-hidden className="mx-2">·</span>
            <span>{t("content.publishedOn")} {formatDateAz(article.published_at)}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-foreground-soft md:text-lg">
            {summary}
          </p>
          <ContentCoverImage
            src={article.image_url}
            alt={coverAlt}
            aspect="21/9"
            categoryLabel={categoryLabel}
            moduleLabel={t("content.moduleNews")}
            className="mt-8"
            priority
          />
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="wide">
          <div
            className={
              hasSidebar
                ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"
                : ""
            }
          >
            <article className="min-w-0 space-y-4 text-base leading-7 text-foreground">
              {paragraphs.map((para, i) => (
                <p key={i} className="whitespace-pre-line">
                  {para}
                </p>
              ))}
              {article.source_name ? (
                <p className="pt-4 text-sm text-foreground-muted">
                  {t("dealerTrust.source")}: {article.source_name} · {t("content.publishedOn")}{" "}
                  {formatDateAz(article.published_at)}
                </p>
              ) : null}

              {extraTrims.length > 0 ? (
                <div className="space-y-3 pt-4">
                  <h2 className="text-base font-semibold text-foreground">
                    {t("content.moreRelatedModels")}
                  </h2>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {extraTrims.map((s) => (
                      <li key={s.trim_id}>
                        <RelatedModelLink
                          contentId={article.content_id}
                          summary={s}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>

            {hasSidebar && primaryTrim ? (
              <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                <RelatedModelDarkCard
                  contentId={article.content_id}
                  trim={primaryTrim}
                  reason={
                    reasonText ?? `${primaryTrim.display_name}`
                  }
                  surface="content"
                />
              </aside>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section tone="muted" padding="sm">
        <Container size="wide">
          <Link
            href={ROUTES.news}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent-blue hover:underline"
          >
            ← {t("content.backToNews")}
          </Link>
        </Container>
      </Section>
    </>
  );
}
