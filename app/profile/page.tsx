"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReadinessCard } from "@/components/decisions/ReadinessCard";
import { RecentActivityList } from "@/components/decisions/RecentActivityList";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
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
            otpHref({ purpose: "profile_access", next: ROUTES.profile })
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
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Qərar Mərkəzi
        </h1>
        <p className="text-sm text-foreground-muted">
          Araşdırmanın və sorğularının bir nəzərdə yığcamı.
        </p>
      </header>

      <ReadinessCard summary={summary.readiness} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CountTile
          label="Aktiv sorğular"
          count={summary.active_leads_count}
          href={ROUTES.profileLeads}
        />
        <CountTile
          label="Saxlanılan maşınlar"
          count={summary.saved_cars_count}
          href={ROUTES.profileSaved}
        />
        <CountTile
          label="Müqayisələr"
          count={summary.comparisons_count}
          href={null}
          note="Tezliklə"
        />
        <CountTile
          label="Diler təklifləri"
          count={summary.dealer_offers_count}
          href={ROUTES.profileLeads}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Son fəaliyyət
          </h2>
          <Link
            href={ROUTES.profileHistory}
            className="text-xs font-medium text-accent-orange hover:underline"
          >
            Hamısına bax
          </Link>
        </div>
        <RecentActivityList
          events={summary.recent_activity}
          limit={5}
          emptyLabel="Son fəaliyyət yoxdur."
        />
      </div>
    </section>
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
    <>
      <p className="text-xs font-medium text-foreground-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{count}</p>
      {note ? (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-foreground-muted">
          {note}
        </p>
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="rounded-lg border border-border bg-surface-elevated p-3 hover:bg-surface"
      >
        {inner}
      </Link>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-3 opacity-70">
      {inner}
    </div>
  );
}
