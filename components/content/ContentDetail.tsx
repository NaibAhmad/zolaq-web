"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { RelatedModelLink } from "@/components/content/RelatedModelLink";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { formatDateAz } from "@/lib/format/date";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { trackEvent } from "@/lib/tracking/track";
import type { LeadTrimSummary } from "@/lib/leads/types";
import type { ContentType } from "@/lib/content/types";

type Props = {
  contentId: string;
  contentType: ContentType;
  slugOrId: string;
  title: string;
  summary?: string;
  body: string;
  publishedAt: number;
  backHref: string;
  backLabel: string;
  relatedTrims: readonly LeadTrimSummary[];
};

const TYPE_KEY: Record<ContentType, TranslationKey> = {
  news: "content.typeNews",
  encyclopedia: "content.typeEncyclopedia",
  qa: "content.typeQa",
};

export function ContentDetail({
  contentId,
  contentType,
  slugOrId,
  title,
  summary,
  body,
  publishedAt,
  backHref,
  backLabel,
  relatedTrims,
}: Props) {
  const t = useT();
  useEffect(() => {
    trackEvent("content_viewed", {
      content_id: contentId,
      content_type: contentType,
      slug: slugOrId,
    });
  }, [contentId, contentType, slugOrId]);

  const paragraphs = useMemo(
    () => body.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0),
    [body],
  );
  const readMinutes = Math.max(1, Math.round(body.length / 1000));

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container size="narrow">
          <nav className="mb-4 text-sm">
            <Link
              href={backHref}
              className="text-accent-blue underline-offset-2 hover:underline"
            >
              ← {backLabel}
            </Link>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
            {t(TYPE_KEY[contentType])}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
            {title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
            <time dateTime={new Date(publishedAt).toISOString()}>
              {formatDateAz(publishedAt)}
            </time>
            <span aria-hidden>·</span>
            <span>{t("content.readMinutes", { count: readMinutes })}</span>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-6">
          {summary ? (
            <p className="border-l-4 border-accent-orange bg-accent-orange-soft/40 px-4 py-3 text-lg leading-8 text-foreground">
              {summary}
            </p>
          ) : null}

          <article className="space-y-4 text-base leading-7 text-foreground">
            {paragraphs.map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </article>
        </Container>
      </Section>

      {relatedTrims.length > 0 ? (
        <Section tone="muted" padding="md">
          <Container size="narrow">
            <SectionHeading eyebrow={t("content.relatedEyebrow")} title={t("content.relatedModels")} />
            <ul className="mt-6 grid gap-3 md:grid-cols-2">
              {relatedTrims.map((s) => (
                <li key={s.trim_id}>
                  <RelatedModelLink contentId={contentId} summary={s} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : (
        <Section tone="light" padding="sm">
          <Container size="narrow">
            <Card padding="md" tone="muted">
              <p className="text-sm text-foreground-muted">
                {t("content.noRelatedModels")}
              </p>
            </Card>
          </Container>
        </Section>
      )}
    </>
  );
}
