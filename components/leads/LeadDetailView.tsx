"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LeadStatusCard } from "@/components/leads/LeadStatusCard";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { NotFoundState } from "@/components/state/NotFoundState";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import type { Trim } from "@/lib/cars/types";
import { LEAD_STATE_LABELS_AZ } from "@/lib/leads/labels";
import { canTransition } from "@/lib/leads/state-machine";
import type {
  Lead,
  LeadState,
  LeadTimelineEvent,
} from "@/lib/leads/types";
import { ROUTES, otpHref } from "@/lib/routes";

type Props = { leadId: string };

type FetchState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string; code: string }
  | {
      status: "ready";
      lead: Lead;
      timeline: LeadTimelineEvent[];
      trim: Trim | null;
    };

type ActionKey =
  | "request-test-drive"
  | "request-second-offer"
  | "whatsapp-handoff"
  | "close";

const ACTION_TO_STATE: Record<ActionKey, LeadState> = {
  "request-test-drive": "test_drive_requested",
  "request-second-offer": "second_offer",
  "whatsapp-handoff": "whatsapp_handoff",
  close: "closed",
};

const ACTION_LABEL: Record<ActionKey, string> = {
  "request-test-drive": "Test-sürüş istə",
  "request-second-offer": "İkinci təklif istə",
  "whatsapp-handoff": "WhatsApp-da davam et",
  close: "Sorğunu bağla",
};

const PRIMARY_ACTIONS: readonly ActionKey[] = [
  "request-test-drive",
  "request-second-offer",
  "whatsapp-handoff",
];

const DATE_TIME_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const CONTACT_LABEL: Record<"phone" | "whatsapp", string> = {
  phone: "Zəng",
  whatsapp: "WhatsApp",
};

function deriveTrimSuffix(
  displayName: string,
  brandName: string,
  modelName: string
): string {
  const head = `${brandName} ${modelName}`;
  if (displayName.startsWith(head)) return displayName.slice(head.length).trim();
  if (displayName.startsWith(modelName))
    return displayName.slice(modelName.length).trim();
  return displayName;
}

export function LeadDetailView({ leadId }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [actionInFlight, setActionInFlight] = useState<ActionKey | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const brandLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS) map.set(b.brand_id, b.name);
    return map;
  }, []);

  const load = useCallback(
    async (signal: { cancelled: boolean }) => {
      try {
        const data = await apiGet<{
          lead: Lead;
          timeline: LeadTimelineEvent[];
        }>(`/api/profile/leads/${encodeURIComponent(leadId)}`);
        let trim: Trim | null = null;
        try {
          const trimRes = await apiGet<{ trim: Trim }>(
            `/api/cars/${encodeURIComponent(data.lead.trim_id)}`
          );
          trim = trimRes.trim;
        } catch {
          trim = null;
        }
        if (signal.cancelled) return;
        setState({
          status: "ready",
          lead: data.lead,
          timeline: data.timeline,
          trim,
        });
      } catch (err) {
        if (signal.cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({
              purpose: "profile_access",
              next: ROUTES.profileLead(leadId),
            })
          );
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setState({ status: "not_found" });
          return;
        }
        if (err instanceof ApiError) {
          setState({ status: "error", message: err.message, code: err.code });
          return;
        }
        const message = err instanceof Error ? err.message : "Şəbəkə xətası";
        setState({ status: "error", message, code: "NETWORK" });
      }
    },
    [leadId, router]
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void (async () => {
      await load(signal);
    })();
    return () => {
      signal.cancelled = true;
    };
  }, [load, reloadKey]);

  function reload() {
    setState({ status: "loading" });
    setActionError(null);
    setReloadKey((k) => k + 1);
  }

  async function runAction(action: ActionKey) {
    setActionInFlight(action);
    setActionError(null);
    try {
      await apiPost(`/api/profile/leads/${encodeURIComponent(leadId)}/${action}`);
      reload();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Əməliyyat alınmadı.";
      setActionError(message);
    } finally {
      setActionInFlight(null);
    }
  }

  if (state.status === "loading") {
    return <LoadingState label="Sorğu yüklənir…" />;
  }
  if (state.status === "not_found") {
    return (
      <NotFoundState
        title="Sorğu tapılmadı"
        note="Bu sorğu mövcud deyil və ya silinib."
      />
    );
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Sorğu yüklənmədi"
        message={state.message}
        code={state.code}
        onRetry={reload}
      />
    );
  }

  const { lead, timeline, trim } = state;
  const brandName = trim
    ? (brandLookup.get(trim.brand_id) ?? trim.brand_id)
    : "—";
  const modelName = trim?.model_name ?? "—";
  const trimSuffix = trim
    ? deriveTrimSuffix(trim.display_name, brandName, trim.model_name)
    : "";

  const availableActions = PRIMARY_ACTIONS.filter((action) =>
    canTransition(lead.state, ACTION_TO_STATE[action])
  );
  const canClose = canTransition(lead.state, "closed");

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <nav className="mb-4 text-sm">
        <Link
          href={ROUTES.profileLeads}
          className="text-accent-blue underline-offset-2 hover:underline"
        >
          ← Sorğulara qayıt
        </Link>
      </nav>

      <header className="mb-6 space-y-1">
        <p className="text-sm font-medium text-foreground-muted">
          {brandName} · {modelName}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {trim ? trimSuffix || trim.display_name : lead.trim_id}
        </h1>
        {trim ? (
          <p className="text-sm text-foreground-muted">
            {trim.year} · {trim.energy_type}
          </p>
        ) : null}
      </header>

      <div className="space-y-4">
        <LeadStatusCard lead={lead} />

        {(lead.name || lead.preferred_contact || lead.note) && (
          <dl className="grid gap-y-2 rounded-lg border border-border bg-surface-elevated p-4 text-sm">
            {lead.name ? (
              <div className="flex flex-wrap gap-x-3">
                <dt className="text-foreground-muted">Ad:</dt>
                <dd className="font-medium text-foreground">{lead.name}</dd>
              </div>
            ) : null}
            {lead.preferred_contact ? (
              <div className="flex flex-wrap gap-x-3">
                <dt className="text-foreground-muted">Əlaqə üsulu:</dt>
                <dd className="font-medium text-foreground">
                  {CONTACT_LABEL[lead.preferred_contact]}
                </dd>
              </div>
            ) : null}
            {lead.note ? (
              <div className="flex flex-wrap gap-x-3">
                <dt className="text-foreground-muted">Qeyd:</dt>
                <dd className="text-foreground">{lead.note}</dd>
              </div>
            ) : null}
          </dl>
        )}

        {(availableActions.length > 0 || canClose) && (
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <button
                key={action}
                type="button"
                disabled={actionInFlight !== null}
                onClick={() => void runAction(action)}
                className="rounded-md bg-accent-orange px-3 py-2 text-sm font-medium text-accent-orange-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionInFlight === action ? "Göndərilir…" : ACTION_LABEL[action]}
              </button>
            ))}
            {canClose ? (
              <button
                type="button"
                disabled={actionInFlight !== null}
                onClick={() => void runAction("close")}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionInFlight === "close"
                  ? "Göndərilir…"
                  : ACTION_LABEL.close}
              </button>
            ) : null}
          </div>
        )}

        {actionError ? (
          <p role="alert" className="text-sm text-danger">
            {actionError}
          </p>
        ) : null}

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Tarixçə
          </h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              Hələ tarixçə qeydi yoxdur.
            </p>
          ) : (
            <ol className="space-y-2">
              {timeline.map((event) => {
                const label = event.to_state
                  ? LEAD_STATE_LABELS_AZ[event.to_state]
                  : event.type;
                return (
                  <li
                    key={event.event_id}
                    className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{label}</span>
                      <time
                        dateTime={new Date(event.created_at).toISOString()}
                        className="text-xs text-foreground-muted"
                      >
                        {DATE_TIME_FMT.format(event.created_at)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}
