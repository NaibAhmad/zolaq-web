"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReadinessCard } from "@/components/decisions/ReadinessCard";
import { RecentActivityList } from "@/components/decisions/RecentActivityList";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError, apiGet } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { ROUTES, otpHref } from "@/lib/routes";
import type { DecisionCenterSummary } from "@/lib/decisions/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; summary: DecisionCenterSummary };

export default function ProfileDecisionCenterPage() {
  const router = useRouter();
  const t = useT();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<DecisionCenterSummary>("/api/profile/decision-center")
      .then((data) => {
        if (!cancelled) setState({ status: "ready", summary: data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({ purpose: "profile_access", next: ROUTES.profile }),
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
    return <LoadingState label={t("profile.loading")} />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title={t("profile.loadFailed")}
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  const { summary } = state;

  return (
    <>
      <Section tone="dark" padding="md">
        <Container>
          <SectionHeading
            tone="dark"
            eyebrow={t("profile.decisionCenterEyebrow")}
            title={t("profile.decisionCenterTitle")}
            subtitle={t("profile.decisionCenterSubtitle")}
          />
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <CountTile
              label={t("profile.activeLeads")}
              count={summary.active_leads_count}
              href={ROUTES.profileLeads}
            />
            <CountTile
              label={t("profile.savedCars")}
              count={summary.saved_cars_count}
              href={ROUTES.profileSaved}
            />
            <CountTile
              label={t("profile.compares")}
              count={summary.comparisons_count}
              href={ROUTES.compare}
            />
            <CountTile
              label={t("profile.dealerOffers")}
              count={summary.dealer_offers_count}
              href={ROUTES.profileLeads}
            />
          </div>

          <div className="mt-8">
            <ReadinessCard summary={summary.readiness} />
          </div>

          <div className="mt-10 space-y-4">
            <SectionHeading
              eyebrow={t("profile.activityEyebrow")}
              title={t("profile.recentActivity")}
              action={{ label: t("profile.viewAll"), href: ROUTES.profileHistory }}
            />
            <RecentActivityList
              events={summary.recent_activity}
              limit={5}
              emptyLabel={t("profile.emptyActivity")}
            />
          </div>

          <div className="mt-10 space-y-4">
            <SectionHeading
              eyebrow={t("profile.quickLinksEyebrow")}
              title={t("profile.quickLinksTitle")}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickLink
                label={t("profile.catalogLinkTitle")}
                note={t("profile.catalogLinkNote")}
                href={ROUTES.cars}
              />
              <QuickLink
                label={t("profile.newDecisionTitle")}
                note={t("profile.newDecisionNote")}
                href={ROUTES.profileDecisions}
              />
              <QuickLink
                label={t("profile.activeLeadsTitle")}
                note={t("profile.activeLeadsNote")}
                href={ROUTES.profileLeads}
              />
              <QuickLink
                label={t("profile.badgesLinkTitle")}
                note={t("profile.badgesLinkNote")}
                href="/profile/badges"
              />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function CountTile({
  label,
  count,
  href,
  note,
}: {
  label: string;
  count: number;
  href: string | null;
  note?: string;
}) {
  const inner = (
    <Card
      padding="md"
      tone="raised"
      interactive={Boolean(href)}
      className={`h-full ${href ? "" : "opacity-70"}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-foreground">{count}</p>
      {note ? (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-accent-blue">
          {note}
        </p>
      ) : null}
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

function QuickLink({
  label,
  note,
  href,
}: {
  label: string;
  note: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card padding="md" tone="raised" interactive className="h-full">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="mt-1 text-xs text-foreground-muted">{note}</p>
          </div>
          <span aria-hidden className="text-lg text-accent-blue">
            →
          </span>
        </div>
      </Card>
    </Link>
  );
}
