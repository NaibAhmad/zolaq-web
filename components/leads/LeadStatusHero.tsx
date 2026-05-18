"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { useCurrentLocale, useT } from "@/lib/i18n/client";
import { leadSourceSurfaceLabel, leadStateLabel } from "@/lib/leads/labels";
import { LEAD_STATE_TONE } from "./LeadStatusCard";
import type { Lead } from "@/lib/leads/types";

type Props = {
  lead: Pick<Lead, "lead_id" | "state" | "source_surface">;
  backHref: string;
  backLabel: string;
  brandName: string;
  modelName: string;
  trimTitle: string;
  meta?: string;
  hint?: string;
};

export function LeadStatusHero({
  lead,
  backHref,
  backLabel,
  brandName,
  modelName,
  trimTitle,
  meta,
  hint,
}: Props) {
  const t = useT();
  const locale = useCurrentLocale();
  const stateLabel = leadStateLabel(lead.state, locale);
  const stateTone = LEAD_STATE_TONE[lead.state];
  const sourceLabel = leadSourceSurfaceLabel(lead.source_surface, locale);

  return (
    <Section tone="dark" padding="md">
      <Container size="narrow">
        <nav className="mb-4 text-sm">
          <Link
            href={backHref}
            className="text-on-dark-muted underline-offset-2 hover:text-on-dark hover:underline"
          >
            ← {backLabel}
          </Link>
        </nav>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue">
          {brandName} · {modelName}
        </p>
        <h1 className="mt-2 text-xl font-semibold text-on-dark md:text-2xl lg:text-3xl">
          {trimTitle}
        </h1>
        {meta ? (
          <p className="mt-1 text-sm text-on-dark-muted">{meta}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={stateTone} size="md">
            {stateLabel}
          </Badge>
          <span className="inline-flex items-center rounded-full border border-border-on-dark bg-white/5 px-2 py-0.5 font-mono text-[11px] text-on-dark-muted">
            #{lead.lead_id}
          </span>
          {sourceLabel ? (
            <Badge tone="on-dark" size="sm">
              {t("compare.sourcePrefix", { source: sourceLabel })}
            </Badge>
          ) : null}
        </div>

        {hint ? (
          <p className="mt-3 max-w-xl text-sm text-on-dark-muted">{hint}</p>
        ) : null}
      </Container>
    </Section>
  );
}
