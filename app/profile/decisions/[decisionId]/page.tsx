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
import { formatDateAz } from "@/lib/format/date";
import { useCurrentLocale, useT } from "@/lib/i18n/client";
import { leadStateLabel } from "@/lib/leads/labels";
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

const PRICE_FMT = new Intl.NumberFormat("az-AZ");

export default function ProfileDecisionWorkspacePage({
  params,
}: {
  params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = use(params);
  const router = useRouter();
  const t = useT();
  const locale = useCurrentLocale();
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
        const message = err instanceof Error ? err.message : t("errors.networkError");
        setState({ status: "error", message, code: "NETWORK" });
      });
    return () => {
      cancelled = true;
    };
  }, [decisionId, reloadKey, router, t]);

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
    return <LoadingState label={t("profileDecisions.workspaceLoading")} />;
  }
  if (state.status === "error" && state.notFound) {
    return (
      <EmptyState
        title={t("profileDecisions.detailNotFound")}
        note={t("profileDecisions.notOwnNote")}
        action={
          <ButtonLink href={ROUTES.profileDecisions} variant="secondary">
            {t("profileDecisions.backToList")}
          </ButtonLink>
        }
      />
    );
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title={t("profileDecisions.errorWorkspace")}
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
              ← {t("profileDecisions.backLinkLabel")}
            </Link>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-on-dark md:text-3xl">
              {decision.title}
            </h1>
            <DecisionStatusBadge status={decision.status} size="md" />
          </div>
          <p className="mt-2 text-sm text-on-dark-muted">
            {t("profileDecisions.createdOn", { date: formatDateAz(decision.created_at) })}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat
              tone="dark"
              label={t("profileDecisions.statCandidate")}
              value={decision.candidate_trim_ids.length}
            />
            <Stat
              tone="dark"
              label={t("profileDecisions.statLead")}
              value={decision.lead_ids.length}
            />
            <Stat
              tone="dark"
              label={t("profileDecisions.statOffer")}
              value={offers.length}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={busy || isFinal || decision.status === "decided"}
              onClick={() => patchStatus("decided")}
            >
              {t("profileDecisions.markDecided")}
            </Button>
            <Button
              variant="secondary"
              className="!border-border-on-dark !bg-white/5 !text-on-dark hover:!bg-white/10"
              disabled={busy || isFinal}
              onClick={() => patchStatus("abandoned")}
            >
              {t("profileDecisions.abandonAction")}
            </Button>
            <Button
              variant="secondary"
              className="!border-border-on-dark !bg-white/5 !text-on-dark hover:!bg-white/10"
              disabled={busy || decision.status === "closed"}
              onClick={closeNow}
            >
              {t("profileDecisions.closeNow")}
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-6">
          <WorkspaceSection title={t("profileDecisions.sectionLeads")} count={leads.length}>
            {leads.length === 0 ? (
              <EmptyMini text={t("profileDecisions.noLeadsForDecision")} />
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
                        {leadStateLabel(lead.state, locale)}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </Card>
            )}
          </WorkspaceSection>

          <WorkspaceSection title={t("profileDecisions.sectionCandidates")} count={saved.length}>
            {saved.length === 0 ? (
              <EmptyMini text={t("profileDecisions.noCandidates")} />
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

          <WorkspaceSection title={t("profileDecisions.sectionOffers")} count={offers.length}>
            {offers.length === 0 ? (
              <EmptyMini text={t("profileDecisions.noOffers")} />
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

          <WorkspaceSection title={t("profileDecisions.sectionHistory")} count={history.length}>
            <RecentActivityList
              events={history}
              emptyLabel={t("profileDecisions.noHistory")}
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
