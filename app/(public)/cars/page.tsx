"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SponsoredSlot } from "@/components/ads/SponsoredSlot";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CarCard } from "@/components/catalog/CarCard";
import { CompareSelectionBar } from "@/components/compare/CompareSelectionBar";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import { useT } from "@/lib/i18n/client";
import { ROUTES } from "@/lib/routes";
import type { PriceRecord, Trim } from "@/lib/cars/types";

type SearchResult = { trim: Trim; best_price: PriceRecord | null };

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; results: SearchResult[] };

const FILTER_KEYS = [
  "q",
  "brand",
  "model",
  "generation",
  "trim",
  "year",
  "year_from",
  "year_to",
  "energy_type",
  "body_type",
  "price_min",
  "price_max",
  "range_min",
  "range_max",
  "dealer_verified",
  "availability",
  "sort",
] as const;

function buildQuery(searchParams: URLSearchParams): string {
  const next = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const v = searchParams.get(key);
    if (v) next.set(key, v);
  }
  return next.toString();
}

function CatalogInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const brandLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS) map.set(b.brand_id, b.name);
    return map;
  }, []);

  const query = buildQuery(searchParams);

  useEffect(() => {
    let cancelled = false;
    const path = query ? `/api/cars?${query}` : "/api/cars";
    apiGet<{ trims: Trim[]; results: SearchResult[] }>(path)
      .then((data) => {
        if (cancelled) return;
        // Prefer the new `results` shape; fall back to trims-only if absent.
        const results: SearchResult[] = data.results
          ? data.results
          : (data.trims ?? []).map((trim) => ({ trim, best_price: null }));
        setState({ status: "ready", results });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setState({ status: "error", message: err.message, code: err.code });
        } else {
          const message =
            err instanceof Error ? err.message : t("carsList.networkError");
          setState({ status: "error", message, code: "NETWORK" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey, t]);

  function retry() {
    setReloadKey((k) => k + 1);
  }

  function clearFilters() {
    router.replace(ROUTES.cars, { scroll: false });
  }

  const resultCount =
    state.status === "ready" ? state.results.length : null;

  return (
    <>
      <Section tone="muted" padding="md">
        <Container>
          <SectionHeading
            eyebrow={t("carsList.eyebrow")}
            title={t("carsList.title")}
            subtitle={t("carsList.subtitle")}
          />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {resultCount !== null ? (
              <Badge tone="blue" size="md">
                {t("carsList.resultCount", { count: resultCount })}
              </Badge>
            ) : null}
            <Badge tone="muted" size="md">
              {t("carsList.updatedDaily")}
            </Badge>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <div className="flex flex-col gap-6">
            <CatalogFilters count={resultCount ?? undefined} />

            <SponsoredSlot area="catalog" variant="strip" />

            <CompareSelectionBar />

            {state.status === "loading" && (
              <LoadingState label={t("carsList.loading")} />
            )}

            {state.status === "error" && (
              <ErrorState
                title={t("carsList.errorTitle")}
                message={state.message}
                code={state.code}
                onRetry={retry}
              />
            )}

            {state.status === "ready" && state.results.length === 0 && (
              <EmptyState
                title={t("carsList.emptyTitle")}
                note={t("carsList.emptyNote")}
                action={
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    {t("carsList.clearFilter")}
                  </Button>
                }
              />
            )}

            {state.status === "ready" && state.results.length > 0 && (
              <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {state.results.map((r) => (
                  <li key={r.trim.trim_id} className="flex">
                    <CarCard
                      trim={r.trim}
                      brandName={brandLookup.get(r.trim.brand_id) ?? r.trim.brand_id}
                      bestPrice={r.best_price}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<CarsFallback />}>
      <CatalogInner />
    </Suspense>
  );
}

function CarsFallback() {
  const t = useT();
  return <LoadingState label={t("carsList.loading")} />;
}
