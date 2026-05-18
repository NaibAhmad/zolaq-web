"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { DealerCard } from "@/components/dealers/DealerCard";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stat } from "@/components/ui/Stat";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import { useT } from "@/lib/i18n/client";
import type { Dealer } from "@/lib/dealers/types";

const VERIFIED_STATUSES = new Set([
  "official_dealer",
  "verified_partner",
  "premium_partner",
]);

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; dealers: Dealer[] };

function DealersInner() {
  const t = useT();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const brandLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS) map.set(b.brand_id, b.name);
    return map;
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ dealers: Dealer[] }>("/api/dealers")
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", dealers: data.dealers });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setState({ status: "error", message: err.message, code: err.code });
        } else {
          const message =
            err instanceof Error ? err.message : t("dealersHero.errorTitle");
          setState({ status: "error", message, code: "NETWORK" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, t]);

  function retry() {
    setReloadKey((k) => k + 1);
  }

  const stats = useMemo(() => {
    if (state.status !== "ready") return null;
    const total = state.dealers.length;
    const verified = state.dealers.filter((d) =>
      VERIFIED_STATUSES.has(d.verification_status),
    ).length;
    const avgSla =
      total === 0
        ? 0
        : Math.round(
            state.dealers.reduce((s, d) => s + d.response_sla_hours, 0) / total,
          );
    return { total, verified, avgSla };
  }, [state]);

  return (
    <>
      <Section tone="dark" padding="md">
        <Container>
          <SectionHeading
            tone="dark"
            eyebrow={t("dealersHero.eyebrow")}
            title={t("dealersHero.title")}
            subtitle={t("dealersHero.subtitle")}
          />
          {stats ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat tone="dark" label={t("dealersHero.statTotal")} value={stats.total} />
              <Stat
                tone="dark"
                label={t("dealersHero.statVerified")}
                value={stats.verified}
                hint={t("dealersHero.statVerifiedHint")}
              />
              <Stat
                tone="dark"
                label={t("dealersHero.statAvgResponse")}
                value={t("dealersHero.statAvgResponseValue", {
                  hours: stats.avgSla,
                })}
              />
            </div>
          ) : null}
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          {state.status === "loading" && (
            <LoadingState label={t("dealersHero.loading")} />
          )}

          {state.status === "error" && (
            <ErrorState
              title={t("dealersHero.errorTitle")}
              message={state.message}
              code={state.code}
              onRetry={retry}
            />
          )}

          {state.status === "ready" && state.dealers.length === 0 && (
            <EmptyState
              title={t("dealersHero.emptyTitle")}
              note={t("dealersHero.emptyNote")}
            />
          )}

          {state.status === "ready" && state.dealers.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.dealers.map((dealer) => (
                <li key={dealer.dealer_id} className="flex">
                  <DealerCard dealer={dealer} brandLookup={brandLookup} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}

export default function DealersPage() {
  return (
    <Suspense fallback={<DealersFallback />}>
      <DealersInner />
    </Suspense>
  );
}

function DealersFallback() {
  const t = useT();
  return <LoadingState label={t("dealersHero.loading")} />;
}
