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
import { ROUTES, otpHref } from "@/lib/routes";
import type { DecisionCenterSummary } from "@/lib/decisions/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; summary: DecisionCenterSummary };

export default function ProfileDecisionCenterPage() {
  const router = useRouter();
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
        const message = err instanceof Error ? err.message : "Şəbəkə xətası";
        setState({ status: "error", message, code: "NETWORK" });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, router]);

  if (state.status === "loading") {
    return <LoadingState label="Qərar Mərkəzi yüklənir…" />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Qərar Mərkəzi yüklənmədi"
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
            eyebrow="Qərar Mərkəzi"
            title="Sənin maşın seçim mərkəzin"
            subtitle="Hazırlıq qiyməti, aktiv sorğular, müqayisələr və növbəti addım — hamısı bir nəzərdə."
          />
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <CountTile
              label="Aktiv sorğu"
              count={summary.active_leads_count}
              href={ROUTES.profileLeads}
            />
            <CountTile
              label="Saxlanılan maşın"
              count={summary.saved_cars_count}
              href={ROUTES.profileSaved}
            />
            <CountTile
              label="Müqayisə"
              count={summary.comparisons_count}
              href={ROUTES.compare}
            />
            <CountTile
              label="Diler təklifi"
              count={summary.dealer_offers_count}
              href={ROUTES.profileLeads}
            />
          </div>

          <div className="mt-8">
            <ReadinessCard summary={summary.readiness} />
          </div>

          <div className="mt-10 space-y-4">
            <SectionHeading
              eyebrow="Fəaliyyət"
              title="Son fəaliyyət"
              action={{ label: "Hamısına bax", href: ROUTES.profileHistory }}
            />
            <RecentActivityList
              events={summary.recent_activity}
              limit={5}
              emptyLabel="Son fəaliyyət yoxdur."
            />
          </div>

          <div className="mt-10 space-y-4">
            <SectionHeading
              eyebrow="Tez keçidlər"
              title="Davam et"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickLink
                label="Maşın kataloqu"
                note="Yeni modelləri kəşf et"
                href={ROUTES.cars}
              />
              <QuickLink
                label="Yeni qərar"
                note="Müqayisə və izləmə başlat"
                href={ROUTES.profileDecisions}
              />
              <QuickLink
                label="Aktiv sorğular"
                note="Diler cavablarını izlə"
                href={ROUTES.profileLeads}
              />
              <QuickLink
                label="Nişanlarım"
                note="Qazandığın nişanlar və balın"
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
