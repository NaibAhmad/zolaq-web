"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { trackEvent } from "@/lib/tracking/track";
import type { LeadTrimSummary } from "@/lib/leads/types";

type Props = {
  contentId: string;
  summary: LeadTrimSummary;
};

export function RelatedModelLink({ contentId, summary }: Props) {
  const href = `/cars/${encodeURIComponent(summary.trim_id)}?source=content`;

  function handleClick() {
    trackEvent("related_model_clicked", {
      content_id: contentId,
      trim_id: summary.trim_id,
    });
    trackEvent("cta_clicked", {
      cta_id: "related_model",
      surface: "content",
      destination: href,
    });
  }

  return (
    <Link href={href} onClick={handleClick} className="block h-full">
      <Card
        padding="md"
        tone="raised"
        interactive
        className="flex h-full items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            {summary.brand_name} · {summary.model_name}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {summary.display_name}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="muted" size="sm">
              {summary.year}
            </Badge>
            <Badge tone="blue" size="sm">
              {summary.energy_type}
            </Badge>
          </div>
        </div>
        <span
          aria-hidden="true"
          className="shrink-0 text-base font-medium text-accent-blue"
        >
          Aç →
        </span>
      </Card>
    </Link>
  );
}
