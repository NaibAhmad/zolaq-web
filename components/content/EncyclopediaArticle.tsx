import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ContentCoverImage } from "@/components/content/ContentCoverImage";
import { ContentViewTracker } from "@/components/content/ContentViewTracker";
import { RelatedModelDarkCard } from "@/components/content/RelatedModelDarkCard";
import { RelatedModelLink } from "@/components/content/RelatedModelLink";
import { categoryLabel } from "@/lib/content/encyclopedia-categories";
import { formatDateAz } from "@/lib/format/date";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { getLocalizedText } from "@/lib/i18n/localized";
import { ROUTES } from "@/lib/routes";
import type { EncyclopediaEntry } from "@/lib/content/types";
import type { LeadTrimSummary } from "@/lib/leads/types";

type Props = {
  entry: EncyclopediaEntry;
  relatedTrims: readonly LeadTrimSummary[];
};

export async function EncyclopediaArticle({ entry, relatedTrims }: Props) {
  const t = await getServerT();
  const locale = await getServerLocale();
  const title = getLocalizedText(entry.title, locale);
  const summary = getLocalizedText(entry.summary, locale);
  const bodyText = getLocalizedText(entry.body, locale);
  const catLabel = categoryLabel(entry.category, locale);
  const coverAlt = entry.image_alt ?? `${title} — Zolaq`;
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const primaryTrim = relatedTrims[0];
  const extraTrims = relatedTrims.slice(1);
  const hasSidebar = Boolean(primaryTrim || entry.source);
  const reasonText = entry.related_model_reason
    ? getLocalizedText(entry.related_model_reason, locale)
    : null;

  return (
    <>
      <ContentViewTracker
        contentId={entry.content_id}
        contentType="encyclopedia"
        slugOrId={entry.slug}
      />

      <Section tone="muted" padding="sm">
        <Container size="wide">
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-foreground-muted"
          >
            <Link
              href={ROUTES.encyclopedia}
              className="hover:text-foreground hover:underline"
            >
              {t("content.encyclopediaBreadcrumb")}
            </Link>
            <span aria-hidden className="mx-2">·</span>
            <span>{catLabel}</span>
            <span aria-hidden className="mx-2">·</span>
            <span>{t("dates.updated")} {formatDateAz(entry.published_at)}</span>
          </nav>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-foreground-soft md:text-lg">
            {summary}
          </p>
          <ContentCoverImage
            src={entry.image_url}
            alt={coverAlt}
            aspect="21/9"
            categoryLabel={catLabel}
            moduleLabel={t("content.moduleEncyclopedia")}
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
            <div className="min-w-0 space-y-8">
              {entry.stats && entry.stats.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {entry.stats.map((stat, i) => (
                    <li key={i}>
                      <Card tone="light" padding="md" className="h-full">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                          {getLocalizedText(stat.label, locale)}
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                          {getLocalizedText(stat.value, locale)}
                        </p>
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : null}

              {paragraphs.map((para, i) => {
                const heading = i === 0 ? t("content.howItWorks") : null;
                return (
                  <div key={i} className="space-y-4">
                    {heading ? (
                      <h2 className="text-2xl font-semibold text-foreground">
                        {heading}
                      </h2>
                    ) : null}
                    <p className="whitespace-pre-line text-base leading-7 text-foreground">
                      {para}
                    </p>
                  </div>
                );
              })}

              {extraTrims.length > 0 ? (
                <div className="space-y-3 pt-4">
                  <h2 className="text-base font-semibold text-foreground">
                    {t("content.moreRelatedModels")}
                  </h2>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {extraTrims.map((s) => (
                      <li key={s.trim_id}>
                        <RelatedModelLink
                          contentId={entry.content_id}
                          summary={s}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {hasSidebar ? (
              <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                {primaryTrim ? (
                  <RelatedModelDarkCard
                    contentId={entry.content_id}
                    trim={primaryTrim}
                    reason={
                      reasonText ?? `${primaryTrim.display_name}`
                    }
                    surface="encyclopedia"
                  />
                ) : null}
                {entry.source ? (
                  <Card tone="raised" padding="md" className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                      {t("content.sourceAndTrust")}
                    </p>
                    {entry.source.verified ? (
                      <Badge tone="success" size="sm">
                        ✓ {t("content.verified")}
                      </Badge>
                    ) : null}
                    <p className="text-sm text-foreground-muted">
                      {t("content.sourceLine", {
                        name: entry.source.name,
                        count: entry.source.source_count,
                        date: formatDateAz(entry.published_at),
                      })}
                    </p>
                  </Card>
                ) : null}
              </aside>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section tone="muted" padding="sm">
        <Container size="wide">
          <Link
            href={ROUTES.encyclopedia}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent-blue hover:underline"
          >
            ← {t("content.backToEncyclopedia")}
          </Link>
          <p className="mt-2 text-xs text-foreground-muted">
            {t("dates.updated")}: {formatDateAz(entry.published_at)}
          </p>
        </Container>
      </Section>
    </>
  );
}
