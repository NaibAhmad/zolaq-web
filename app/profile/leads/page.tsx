"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LEAD_STATE_TONE } from "@/components/leads/LeadStatusCard";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError, apiGet } from "@/lib/api";
import { formatDateAz } from "@/lib/format/date";
import { useT } from "@/lib/i18n/client";
import { LEAD_STATE_LABELS_AZ } from "@/lib/leads/labels";
import type { LeadState, LeadWithTrim } from "@/lib/leads/types";
import { ROUTES, otpHref } from "@/lib/routes";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; leads: LeadWithTrim[] };

const TERMINAL_STATES: ReadonlySet<LeadState> = new Set([
  "expired",
  "no_response",
  "closed",
  "accepted",
]);

export default function ProfileLeadsPage() {
  const router = useRouter();
  const t = useT();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ leads: LeadWithTrim[] }>("/api/profile/leads")
      .then((data) => {
        if (!cancelled) setState({ status: "ready", leads: data.leads });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({ purpose: "profile_access", next: ROUTES.profileLeads }),
          );
          return;
        }
        if (err instanceof ApiError) {
          setState({ status: "error", message: err.message, code: err.code });
          return;
        }
        const message = err instanceof Error ? err.message : t("errors.networkError");
        setState({ status: "error", message, code: "NETWORK" });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, router, t]);

  if (state.status === "loading") {
    return <LoadingState label={t("profileLeads.loading")} />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title={t("profileLeads.loadFailed")}
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }
  if (state.leads.length === 0) {
    return (
      <EmptyState
        title={t("profileLeads.emptyTitle")}
        note={t("profileLeads.emptyNote")}
        action={
          <ButtonLink href={ROUTES.cars} variant="primary">
            {t("nav.cars")}
          </ButtonLink>
        }
      />
    );
  }

  const sorted = state.leads
    .slice()
    .sort((a, b) => b.updated_at - a.updated_at);
  const active = sorted.filter((l) => !TERMINAL_STATES.has(l.state));
  const archived = sorted.filter((l) => TERMINAL_STATES.has(l.state));

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container size="narrow">
          <SectionHeading
            eyebrow={t("profileLeads.eyebrow")}
            title={t("profileLeads.title")}
            subtitle={t("profileLeads.subtitle")}
          />
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-8">
          <LeadGroup
            title={t("profileLeads.sectionActive")}
            count={active.length}
            leads={active}
            empty={t("profileLeads.noActive")}
          />
          {archived.length > 0 ? (
            <LeadGroup
              title={t("profileLeads.sectionArchive")}
              count={archived.length}
              leads={archived}
              empty={t("profileLeads.noArchive")}
            />
          ) : null}
        </Container>
      </Section>
    </>
  );
}

function LeadGroup({
  title,
  count,
  leads,
  empty,
}: {
  title: string;
  count: number;
  leads: LeadWithTrim[];
  empty: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
          {title}
        </h2>
        <span className="text-xs text-foreground-muted">{count}</span>
      </div>
      {leads.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-6 text-center text-sm text-foreground-muted">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.lead_id}>
              <LeadRow lead={lead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeadRow({ lead }: { lead: LeadWithTrim }) {
  const t = useT();
  const tone = LEAD_STATE_TONE[lead.state];
  return (
    <Link
      href={ROUTES.profileLead(lead.lead_id)}
      className="block focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:ring-offset-2 rounded-[var(--radius-lg)]"
    >
      <Card
        padding="md"
        tone="raised"
        interactive
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
            <span className="font-mono">#{lead.lead_id}</span>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-foreground-muted">
            {lead.trim.brand_name}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {lead.trim.model_name} · {lead.trim.year}
          </p>
          <p className="mt-0.5 truncate text-xs text-foreground-muted">
            {lead.trim.display_name}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <Badge tone={tone} size="md">
            {LEAD_STATE_LABELS_AZ[lead.state]}
          </Badge>
          <time
            dateTime={new Date(lead.updated_at).toISOString()}
            className="text-xs text-foreground-muted"
          >
            {formatDateAz(lead.updated_at)}
          </time>
          <span className="text-xs font-medium text-accent-blue">
            {t("profileLeads.viewStatus")}
          </span>
        </div>
      </Card>
    </Link>
  );
}
