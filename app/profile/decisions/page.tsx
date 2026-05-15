"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DecisionStatusBadge } from "@/components/decisions/DecisionStatusBadge";
import { NewDecisionForm } from "@/components/decisions/NewDecisionForm";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { ApiError, apiGet } from "@/lib/api";
import { ROUTES, otpHref } from "@/lib/routes";
import { trackEvent } from "@/lib/tracking/track";
import type {
  Decision,
  SavedCarWithTrim,
} from "@/lib/decisions/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; decisions: Decision[]; saved: SavedCarWithTrim[] };

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function ProfileDecisionsPage() {
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    trackEvent("decision_center_opened", {});
  }, []);

  const load = useCallback(async () => {
    const [decisionsRes, savedRes] = await Promise.all([
      apiGet<{ decisions: Decision[] }>("/api/profile/decisions"),
      apiGet<{ saved: SavedCarWithTrim[] }>("/api/profile/saved"),
    ]);
    return { decisions: decisionsRes.decisions, saved: savedRes.saved };
  }, []);

  useEffect(() => {
    let cancelled = false;
    load()
      .then(({ decisions, saved }) => {
        if (!cancelled) setState({ status: "ready", decisions, saved });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({
              purpose: "profile_access",
              next: ROUTES.profileDecisions,
            })
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
  }, [load, reloadKey, router]);

  if (state.status === "loading") {
    return <LoadingState label="Qərarlar yüklənir…" />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Qərarlar yüklənmədi"
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Qərarlar</h1>
        <p className="text-sm text-foreground-muted">
          Hər qərar bir alış prosesini birləşdirir: namizəd maşınlar, sorğular,
          təkliflər.
        </p>
      </header>

      <NewDecisionForm
        saved={state.saved}
        onCreated={() => setReloadKey((k) => k + 1)}
      />

      {state.decisions.length === 0 ? (
        <EmptyState
          title="Hələ qərar yoxdur"
          note="Yuxarıdakı formadan ilk qərarını yarat."
        />
      ) : (
        <ul className="space-y-3">
          {state.decisions.map((decision) => (
            <li key={decision.decision_id}>
              <Link
                href={ROUTES.profileDecision(decision.decision_id)}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface-elevated p-4 hover:bg-surface md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {decision.title}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {decision.candidate_trim_ids.length} namizəd ·{" "}
                    {decision.lead_ids.length} sorğu
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <DecisionStatusBadge status={decision.status} />
                  <time
                    dateTime={new Date(decision.created_at).toISOString()}
                    className="text-xs text-foreground-muted"
                  >
                    {DATE_FMT.format(decision.created_at)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
