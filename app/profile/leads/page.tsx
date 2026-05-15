"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { ApiError, apiGet } from "@/lib/api";
import { LEAD_STATE_LABELS_AZ } from "@/lib/leads/labels";
import type { LeadWithTrim } from "@/lib/leads/types";
import { ROUTES, otpHref } from "@/lib/routes";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; leads: LeadWithTrim[] };

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function ProfileLeadsPage() {
  const router = useRouter();
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
            otpHref({ purpose: "profile_access", next: ROUTES.profileLeads })
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
    return <LoadingState label="Sorğular yüklənir…" />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Sorğular yüklənmədi"
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }
  if (state.leads.length === 0) {
    return (
      <EmptyState
        title="Hələ sorğu yoxdur"
        note="İlk sorğunu kataloqdan və ya maşın səhifəsindən göndər."
        action={
          <Link
            href={ROUTES.cars}
            className="inline-flex items-center justify-center rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-accent-orange-fg hover:opacity-90"
          >
            Maşınlara bax
          </Link>
        }
      />
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Sorğular</h1>
        <p className="text-sm text-foreground-muted">
          Göndərdiyin sorğuların siyahısı və cari vəziyyət.
        </p>
      </header>
      <ul className="space-y-3">
        {state.leads.map((lead) => (
          <li key={lead.lead_id}>
            <Link
              href={ROUTES.profileLead(lead.lead_id)}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface-elevated p-4 hover:bg-surface md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {lead.trim.brand_name} · {lead.trim.model_name}
                </p>
                <p className="truncate text-xs text-foreground-muted">
                  {lead.trim.display_name} · {lead.trim.year}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded border border-border bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                  {LEAD_STATE_LABELS_AZ[lead.state]}
                </span>
                <time
                  dateTime={new Date(lead.created_at).toISOString()}
                  className="text-xs text-foreground-muted"
                >
                  {DATE_FMT.format(lead.created_at)}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
