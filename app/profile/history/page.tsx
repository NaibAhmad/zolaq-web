"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError, apiGet } from "@/lib/api";
import { DECISION_HISTORY_EVENT_LABELS_AZ } from "@/lib/decisions/labels";
import { formatDateAz, formatTimeAz } from "@/lib/format/date";
import { useT } from "@/lib/i18n/client";
import { ROUTES, otpHref } from "@/lib/routes";
import type { DecisionHistoryEvent } from "@/lib/decisions/types";

type ActivityItem = {
  id: string;
  kind: string;
  label: string;
  detail?: string;
  at: number;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | {
      status: "ready";
      events: DecisionHistoryEvent[];
      activity: ActivityItem[];
    };

export default function ProfileHistoryPage() {
  const router = useRouter();
  const t = useT();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet<{ events: DecisionHistoryEvent[] }>("/api/profile/history"),
      apiGet<{ activity: ActivityItem[] }>("/api/profile/activity"),
    ])
      .then(([h, a]) => {
        if (!cancelled)
          setState({
            status: "ready",
            events: h.events,
            activity: a.activity,
          });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({ purpose: "profile_access", next: ROUTES.profileHistory }),
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
    return <LoadingState label={t("profileHistory.loading")} />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title={t("profileHistory.loadFailed")}
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }
  if (state.events.length === 0 && state.activity.length === 0) {
    return (
      <EmptyState
        title={t("profileHistory.emptyTitle")}
        note={t("profileHistory.emptyNote")}
      />
    );
  }

  const groups = groupByDate(state.events);

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container size="narrow">
          <SectionHeading
            eyebrow={t("nav.profile")}
            title={t("profileHistory.title")}
            subtitle={t("profileHistory.subtitle")}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="blue" size="md">
              {state.events.length} qərar hadisəsi
            </Badge>
            <Badge tone="orange" size="md">
              {state.activity.length} Bazar Nəbzi / nişan
            </Badge>
          </div>
        </Container>
      </Section>

      {state.activity.length > 0 ? (
        <Section tone="light" padding="md">
          <Container size="narrow" className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
              Bazar Nəbzi və nişan fəaliyyəti
            </h2>
            <Card padding="none" tone="raised" as="ul">
              {state.activity.map((item, i) => (
                <li
                  key={item.id}
                  className={`flex items-start justify-between gap-3 px-5 py-3 ${
                    i > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    {item.detail ? (
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                  <time
                    dateTime={new Date(item.at).toISOString()}
                    className="shrink-0 text-xs text-foreground-muted"
                  >
                    {formatDateAz(item.at)}
                  </time>
                </li>
              ))}
            </Card>
          </Container>
        </Section>
      ) : null}

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-8">
          {groups.map((group) => (
            <div key={group.key} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
                {group.label}
              </h2>
              <Card padding="none" tone="raised" as="ul">
                {group.events.map((event, i) => (
                  <li
                    key={event.event_id}
                    className={`flex items-start justify-between gap-3 px-5 py-3 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
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
                      {formatTimeAz(event.created_at)}
                    </time>
                  </li>
                ))}
              </Card>
            </div>
          ))}
        </Container>
      </Section>
    </>
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
        label: formatDateAz(event.created_at),
        events: [event],
      });
    }
  }
  return [...map.values()];
}
