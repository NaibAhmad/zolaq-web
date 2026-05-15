"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { ApiError, apiGet } from "@/lib/api";
import { DECISION_HISTORY_EVENT_LABELS_AZ } from "@/lib/decisions/labels";
import { ROUTES, otpHref } from "@/lib/routes";
import type { DecisionHistoryEvent } from "@/lib/decisions/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; events: DecisionHistoryEvent[] };

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const TIME_FMT = new Intl.DateTimeFormat("az-AZ", {
  hour: "2-digit",
  minute: "2-digit",
});

export default function ProfileHistoryPage() {
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ events: DecisionHistoryEvent[] }>("/api/profile/history")
      .then((data) => {
        if (!cancelled) setState({ status: "ready", events: data.events });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({ purpose: "profile_access", next: ROUTES.profileHistory })
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
    return <LoadingState label="Tarixçə yüklənir…" />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Tarixçə yüklənmədi"
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }
  if (state.events.length === 0) {
    return (
      <EmptyState
        title="Tarixçə boşdur"
        note="Axtarış, maşına baxış və sorğu kimi fəaliyyətlər burada toplanacaq."
      />
    );
  }

  const groups = groupByDate(state.events);

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          Qərar Tarixçəsi
        </h1>
        <p className="text-sm text-foreground-muted">
          Bütün araşdırma və sorğu hərəkətlərinin xronoloji jurnalı.
        </p>
      </header>

      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {group.label}
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
            {group.events.map((event) => (
              <li
                key={event.event_id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {DECISION_HISTORY_EVENT_LABELS_AZ[event.type]}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {[event.trim_id, event.lead_id, event.offer_id]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <time
                  dateTime={new Date(event.created_at).toISOString()}
                  className="shrink-0 text-xs text-foreground-muted"
                >
                  {TIME_FMT.format(event.created_at)}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

type Group = {
  key: string;
  label: string;
  events: DecisionHistoryEvent[];
};

function groupByDate(events: DecisionHistoryEvent[]): Group[] {
  const map = new Map<string, Group>();
  for (const event of events) {
    const d = new Date(event.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const existing = map.get(key);
    if (existing) {
      existing.events.push(event);
    } else {
      map.set(key, {
        key,
        label: DATE_FMT.format(event.created_at),
        events: [event],
      });
    }
  }
  return [...map.values()];
}
