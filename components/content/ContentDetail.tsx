"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RelatedModelLink } from "@/components/content/RelatedModelLink";
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

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

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
  useEffect(() => {
    trackEvent("content_viewed", {
      content_id: contentId,
      content_type: contentType,
      slug: slugOrId,
    });
  }, [contentId, contentType, slugOrId]);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <nav className="mb-4 text-sm">
        <Link
          href={backHref}
          className="text-accent-blue underline-offset-2 hover:underline"
        >
          ← {backLabel}
        </Link>
      </nav>

      <header className="mb-4 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <time
          dateTime={new Date(publishedAt).toISOString()}
          className="text-xs text-foreground-muted"
        >
          {DATE_FMT.format(publishedAt)}
        </time>
      </header>

      {summary ? (
        <p className="mb-4 text-base text-foreground-muted">{summary}</p>
      ) : null}

      <div className="whitespace-pre-line text-base leading-relaxed text-foreground">
        {body}
      </div>

      {relatedTrims.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold text-foreground">
            Əlaqəli modellər
          </h2>
          <ul className="space-y-2">
            {relatedTrims.map((summary) => (
              <li key={summary.trim_id}>
                <RelatedModelLink contentId={contentId} summary={summary} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
