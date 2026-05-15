"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { DealerCard } from "@/components/dealers/DealerCard";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import type { Dealer } from "@/lib/dealers/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; dealers: Dealer[] };

function DealersInner() {
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
          const message = err instanceof Error ? err.message : "Şəbəkə xətası";
          setState({ status: "error", message, code: "NETWORK" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setReloadKey((k) => k + 1);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Dilerlər</h1>
        <p className="text-sm text-foreground-muted">
          Rəsmi və təsdiqlənmiş tərəfdaşlar.
        </p>
      </header>

      {state.status === "loading" && (
        <LoadingState label="Dilerlər yüklənir…" />
      )}

      {state.status === "error" && (
        <ErrorState
          title="Xəta baş verdi"
          message={state.message}
          code={state.code}
          onRetry={retry}
        />
      )}

      {state.status === "ready" && state.dealers.length === 0 && (
        <EmptyState
          title="Diler tapılmadı"
          note="Hələ ki aktiv diler qeydiyyatı yoxdur."
        />
      )}

      {state.status === "ready" && state.dealers.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.dealers.map((dealer) => (
            <li key={dealer.dealer_id}>
              <DealerCard dealer={dealer} brandLookup={brandLookup} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DealersPage() {
  return (
    <Suspense fallback={<LoadingState label="Dilerlər yüklənir…" />}>
      <DealersInner />
    </Suspense>
  );
}
