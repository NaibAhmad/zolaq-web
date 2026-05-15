"use client";

import Link from "next/link";
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
    <Link
      href={href}
      onClick={handleClick}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-elevated p-3 text-sm hover:bg-surface"
    >
      <div className="min-w-0">
        <p className="truncate text-xs text-foreground-muted">
          {summary.brand_name} · {summary.model_name}
        </p>
        <p className="truncate font-medium text-foreground">
          {summary.display_name}
        </p>
        <p className="text-xs text-foreground-muted">
          {summary.year} · {summary.energy_type}
        </p>
      </div>
      <span
        aria-hidden="true"
        className="text-accent-blue underline-offset-2 hover:underline"
      >
        Aç →
      </span>
    </Link>
  );
}
