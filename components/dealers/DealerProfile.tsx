"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { DealerOfferCard } from "@/components/dealers/DealerOfferCard";
import { DealerTrustSummary } from "@/components/dealers/DealerTrustSummary";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { NotFoundState } from "@/components/state/NotFoundState";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS, TRIMS } from "@/lib/cars/seed";
import { ROUTES } from "@/lib/routes";
import type { PriceRecord } from "@/lib/cars/types";
import type { Dealer } from "@/lib/dealers/types";

type Props = {
  dealerId: string;
};

type FetchState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; dealer: Dealer; offers: PriceRecord[] };

export function DealerProfile({ dealerId }: Props) {
  return (
    <Suspense fallback={<LoadingState label="Diler yüklənir…" />}>
      <DealerProfileInner dealerId={dealerId} />
    </Suspense>
  );
}

function DealerProfileInner({ dealerId }: Props) {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const brandLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS) map.set(b.brand_id, b.name);
    return map;
  }, []);

  const trimNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of TRIMS) map.set(t.trim_id, t.display_name);
    return map;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = encodeURIComponent(dealerId);
    Promise.all([
      apiGet<{ dealer: Dealer }>(`/api/dealers/${id}`),
      apiGet<{ offers: PriceRecord[] }>(`/api/dealers/${id}/offers`),
    ])
      .then(([dealerRes, offersRes]) => {
        if (cancelled) return;
        setState({
          status: "ready",
          dealer: dealerRes.dealer,
          offers: offersRes.offers,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
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
      });
    return () => {
      cancelled = true;
    };
  }, [dealerId, reloadKey]);

  function retry() {
    setState({ status: "loading" });
    setReloadKey((k) => k + 1);
  }

  if (state.status === "loading") {
    return <LoadingState label="Diler yüklənir…" />;
  }

  if (state.status === "not_found") {
    return (
      <NotFoundState
        title="Diler tapılmadı"
        note="Bu diler mövcud deyil və ya silinib."
      />
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="Xəta baş verdi"
        message={state.message}
        code={state.code}
        onRetry={retry}
      />
    );
  }

  const { dealer, offers } = state;

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <nav className="mb-4 text-sm">
        <Link
          href={ROUTES.dealers}
          className="text-accent-blue underline-offset-2 hover:underline"
        >
          ← Dilerlərə qayıt
        </Link>
      </nav>

      <DealerTrustSummary dealer={dealer} brandLookup={brandLookup} />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Diler təklifləri
        </h2>
        {offers.length === 0 ? (
          <EmptyState
            title="Təklif yoxdur"
            note="Bu diler üçün hələ ki aktiv təklif mövcud deyil."
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {offers.map((o, i) => (
              <li key={o.offer_id ?? `${o.trim_id}-${i}`}>
                <DealerOfferCard
                  offer={o}
                  trimName={trimNameLookup.get(o.trim_id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
