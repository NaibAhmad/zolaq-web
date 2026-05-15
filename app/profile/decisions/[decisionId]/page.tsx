"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { DecisionStatusBadge } from "@/components/decisions/DecisionStatusBadge";
import { RecentActivityList } from "@/components/decisions/RecentActivityList";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api";
import { LEAD_STATE_LABELS_AZ } from "@/lib/leads/labels";
import { ROUTES, otpHref } from "@/lib/routes";
import type {
  Decision,
  DecisionStatus,
  DecisionWorkspaceResponse,
} from "@/lib/decisions/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string; notFound?: boolean }
  | { status: "ready"; data: DecisionWorkspaceResponse };

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const PRICE_FMT = new Intl.NumberFormat("az-AZ");

export default function ProfileDecisionWorkspacePage({
  params,
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = use(params);
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet<DecisionWorkspaceResponse>(`/api/profile/decisions/${decisionId}`)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({
              purpose: "profile_access",
              next: ROUTES.profileDecision(decisionId),
            })
          );
          return;
        }
        if (err instanceof ApiError) {
          setState({
            status: "error",
            message: err.message,
            code: err.code,
            notFound: err.status === 404,
          });
          return;
        }
        const message = err instanceof Error ? err.message : "Şəbəkə xətası";
        setState({ status: "error", message, code: "NETWORK" });
      });
    return () => {
      cancelled = true;
    };
  }, [decisionId, reloadKey, router]);

  const patchStatus = useCallback(
    async (next: DecisionStatus) => {
      setBusy(true);
      try {
        await apiPatch<{ decision: Decision }>(
          `/api/profile/decisions/${decisionId}`,
          { status: next }
        );
        setReloadKey((k) => k + 1);
      } catch {
        // surface via reload-driven error path
        setReloadKey((k) => k + 1);
      } finally {
        setBusy(false);
      }
    },
    [decisionId]
  );

  const closeNow = useCallback(async () => {
    setBusy(true);
    try {
      await apiPost<{ decision: Decision }>(
        `/api/profile/decisions/${decisionId}/close`
      );
      setReloadKey((k) => k + 1);
    } catch {
      setReloadKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }, [decisionId]);

  if (state.status === "loading") {
    return <LoadingState label="Qərar İş Sahəsi yüklənir…" />;
  }
  if (state.status === "error" && state.notFound) {
    return (
      <EmptyState
        title="Qərar tapılmadı"
        note="Bu qərar mövcud deyil və ya sənə aid deyil."
        action={
          <Link
            href={ROUTES.profileDecisions}
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated"
          >
            Qərarlara qayıt
          </Link>
        }
      />
    );
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Qərar yüklənmədi"
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  const { decision, leads, saved, offers, history } = state.data;
  const isFinal =
    decision.status === "closed" || decision.status === "abandoned";

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <nav className="text-xs text-foreground-muted">
        <Link
          href={ROUTES.profileDecisions}
          className="hover:text-foreground hover:underline"
        >
          ← Qərarlar
        </Link>
      </nav>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            {decision.title}
          </h1>
          <DecisionStatusBadge status={decision.status} />
        </div>
        <p className="text-xs text-foreground-muted">
          Qərar İş Sahəsi · {decision.candidate_trim_ids.length} namizəd ·{" "}
          {decision.lead_ids.length} sorğu · yaradıldı{" "}
          {DATE_FMT.format(decision.created_at)}
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || isFinal || decision.status === "decided"}
          onClick={() => patchStatus("decided")}
          className="rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-accent-orange-fg hover:opacity-90 disabled:opacity-50"
        >
          Qərar verildi
        </button>
        <button
          type="button"
          disabled={busy || isFinal}
          onClick={() => patchStatus("abandoned")}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated disabled:opacity-50"
        >
          İmtina et
        </button>
        <button
          type="button"
          disabled={busy || decision.status === "closed"}
          onClick={closeNow}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated disabled:opacity-50"
        >
          Bağla
        </button>
      </div>

      <Section title="Sorğular">
        {leads.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Bu qərara bağlı sorğu yoxdur.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
            {leads.map((lead) => (
              <li key={lead.lead_id}>
                <Link
                  href={ROUTES.profileLead(lead.lead_id)}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {lead.trim.brand_name} · {lead.trim.model_name}
                    </p>
                    <p className="truncate text-xs text-foreground-muted">
                      {lead.trim.display_name}
                    </p>
                  </div>
                  <span className="shrink-0 rounded border border-border bg-surface px-2 py-0.5 text-xs text-foreground">
                    {LEAD_STATE_LABELS_AZ[lead.state]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Namizəd maşınlar">
        {saved.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Namizəd maşın seçilməyib.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
            {saved.map((item) => (
              <li key={item.saved_id}>
                <Link
                  href={ROUTES.car(item.trim_id)}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.trim.brand_name} · {item.trim.model_name}
                    </p>
                    <p className="truncate text-xs text-foreground-muted">
                      {item.trim.display_name} · {item.trim.year}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Diler təklifləri">
        {offers.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Rəsmi təklif hələ yoxdur.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
            {offers.map((offer) => (
              <li
                key={offer.offer_id ?? `${offer.trim_id}-${offer.last_updated}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {offer.source_name}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">
                    {offer.trim_id}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-foreground">
                  {PRICE_FMT.format(offer.amount)} {offer.currency}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Qərar tarixçəsi">
        <RecentActivityList
          events={history}
          emptyLabel="Bu qərarda hələ fəaliyyət yoxdur."
        />
      </Section>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}
