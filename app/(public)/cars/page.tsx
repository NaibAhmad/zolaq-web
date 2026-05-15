"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CarCard } from "@/components/catalog/CarCard";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import { ROUTES } from "@/lib/routes";
import type { Trim } from "@/lib/cars/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; trims: Trim[] };

const FILTER_KEYS = ["brand", "energy_type", "year", "q"] as const;

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
    apiGet<{ trims: Trim[] }>(path)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", trims: data.trims });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setState({ status: "error", message: err.message, code: err.code });
        } else {
          const message = err instanceof Error ? err.message : "Şəbəkə xətası";
          setState({ status: "error", message, code: "NETWORK" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  function retry() {
    setReloadKey((k) => k + 1);
  }

  function clearFilters() {
    router.replace(ROUTES.cars, { scroll: false });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Maşınlar</h1>
        <p className="text-sm text-foreground-muted">
          Markaya, enerji növünə və ilə görə filtrlə.
        </p>
      </header>

      <div className="mb-6">
        <CatalogFilters />
      </div>

      {state.status === "loading" && (
        <LoadingState label="Maşınlar yüklənir…" />
      )}

      {state.status === "error" && (
        <ErrorState
          title="Xəta baş verdi"
          message={state.message}
          code={state.code}
          onRetry={retry}
        />
      )}

      {state.status === "ready" && state.trims.length === 0 && (
        <EmptyState
          title="Maşın tapılmadı"
          note="Filtrləri dəyişib yenidən cəhd edin."
          action={
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated"
            >
              Sıfırla
            </button>
          }
        />
      )}

      {state.status === "ready" && state.trims.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.trims.map((trim) => (
            <li key={trim.trim_id}>
              <CarCard
                trim={trim}
                brandName={brandLookup.get(trim.brand_id) ?? trim.brand_id}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<LoadingState label="Maşınlar yüklənir…" />}>
      <CatalogInner />
    </Suspense>
  );
}
