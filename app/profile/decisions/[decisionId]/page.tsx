"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { DecisionStatusBadge } from "@/components/decisions/DecisionStatusBadge";
import { RecentActivityList } from "@/components/decisions/RecentActivityList";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Stat } from "@/components/ui/Stat";
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
            }),
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
          { status: next },
        );
        setReloadKey((k) => k + 1);
      } catch {
        setReloadKey((k) => k + 1);
      } finally {
        setBusy(false);
      }
    },
    [decisionId],
  );

  const closeNow = useCallback(async () => {
    setBusy(true);
    try {
      await apiPost<{ decision: Decision }>(
        `/api/profile/decisions/${decisionId}/close`,
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
          <ButtonLink href={ROUTES.profileDecisions} variant="secondary">
            Qərarlara qayıt
          </ButtonLink>
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
    <>
      <Section tone="dark" padding="md">
        <Container size="narrow">
          <nav className="mb-4 text-sm">
            <Link
              href={ROUTES.profileDecisions}
              className="text-on-dark-muted underline-offset-2 hover:text-on-dark hover:underline"
            >
              ← Qərarlar
            </Link>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-on-dark md:text-3xl">
              {decision.title}
            </h1>
            <DecisionStatusBadge status={decision.status} size="md" />
          </div>
          <p className="mt-2 text-sm text-on-dark-muted">
            Yaradıldı {DATE_FMT.format(decision.created_at)}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              tone="dark"
              label="Namizəd"
              value={decision.candidate_trim_ids.length}
            />
            <Stat
              tone="dark"
              label="Sorğu"
              value={decision.lead_ids.length}
            />
            <Stat
              tone="dark"
              label="Təklif"
              value={offers.length}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={busy || isFinal || decision.status === "decided"}
              onClick={() => patchStatus("decided")}
            >
              Qərar verildi
            </Button>
            <Button
              variant="secondary"
              className="!border-border-on-dark !bg-white/5 !text-on-dark hover:!bg-white/10"
              disabled={busy || isFinal}
              onClick={() => patchStatus("abandoned")}
            >
              İmtina et
            </Button>
            <Button
              variant="secondary"
              className="!border-border-on-dark !bg-white/5 !text-on-dark hover:!bg-white/10"
              disabled={busy || decision.status === "closed"}
              onClick={closeNow}
            >
              Bağla
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-6">
          <WorkspaceSection title="Sorğular" count={leads.length}>
            {leads.length === 0 ? (
              <EmptyMini text="Bu qərara bağlı sorğu yoxdur." />
            ) : (
              <Card padding="none" tone="raised" as="ul">
                {leads.map((lead, i) => (
                  <li
                    key={lead.lead_id}
                    className={i > 0 ? "border-t border-border" : ""}
                  >
                    <Link
                      href={ROUTES.profileLead(lead.lead_id)}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {lead.trim.brand_name} · {lead.trim.model_name}
                        </p>
                        <p className="truncate text-xs text-foreground-muted">
                          {lead.trim.display_name}
                        </p>
                      </div>
                      <Badge tone="blue" size="sm">
                        {LEAD_STATE_LABELS_AZ[lead.state]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </Card>
            )}
          </WorkspaceSection>

          <WorkspaceSection title="Namizəd maşınlar" count={saved.length}>
            {saved.length === 0 ? (
              <EmptyMini text="Namizəd maşın seçilməyib." />
            ) : (
              <Card padding="none" tone="raised" as="ul">
                {saved.map((item, i) => (
                  <li
                    key={item.saved_id}
                    className={i > 0 ? "border-t border-border" : ""}
                  >
                    <Link
                      href={ROUTES.car(item.trim_id)}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted"
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
              </Card>
            )}
          </WorkspaceSection>

          <WorkspaceSection title="Diler təklifləri" count={offers.length}>
            {offers.length === 0 ? (
              <EmptyMini text="Rəsmi təklif hələ yoxdur." />
            ) : (
              <Card padding="none" tone="raised" as="ul">
                {offers.map((offer, i) => (
                  <li
                    key={
                      offer.offer_id ?? `${offer.trim_id}-${offer.last_updated}`
                    }
                    className={`flex items-center justify-between gap-3 px-5 py-3 ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
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
              </Card>
            )}
          </WorkspaceSection>

          <WorkspaceSection title="Qərar tarixçəsi" count={history.length}>
            <RecentActivityList
              events={history}
              emptyLabel="Bu qərarda hələ fəaliyyət yoxdur."
            />
          </WorkspaceSection>
        </Container>
      </Section>
    </>
  );
}

function WorkspaceSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
          {title}
        </h2>
        {typeof count === "number" ? (
          <Badge tone="muted" size="sm">
            {count}
          </Badge>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-4 text-center text-sm text-foreground-muted">
      {text}
    </p>
  );
}
