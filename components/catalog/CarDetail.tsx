"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CarImage } from "@/components/catalog/CarImage";
import { PriceCard } from "@/components/catalog/PriceCard";
import { LeadFormLauncher } from "@/components/leads/LeadFormLauncher";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { NotFoundState } from "@/components/state/NotFoundState";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import { ROUTES } from "@/lib/routes";
import {
  isLeadSourceSurface,
  type LeadSourceSurface,
} from "@/lib/leads/types";
import type { EnergyType, PriceRecord, Trim } from "@/lib/cars/types";

type Props = {
  carId: string;
};

type FetchState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; trim: Trim; prices: PriceRecord[] };

const ENERGY_LABEL: Record<EnergyType, string> = {
  EV: "Tam elektrik",
  PHEV: "Plug-in hibrid",
  EREV: "Diapazon genişləndirici elektrik",
  HEV: "Hibrid",
  ICE: "Daxili yanma mühərriki",
};

function deriveTrimSuffix(displayName: string, brandName: string, modelName: string): string {
  const head = `${brandName} ${modelName}`;
  if (displayName.startsWith(head)) return displayName.slice(head.length).trim();
  if (displayName.startsWith(modelName)) return displayName.slice(modelName.length).trim();
  return displayName;
}

export function CarDetail({ carId }: Props) {
  return (
    <Suspense fallback={<LoadingState label="Maşın yüklənir…" />}>
      <CarDetailInner carId={carId} />
    </Suspense>
  );
}

function CarDetailInner({ carId }: Props) {
  const searchParams = useSearchParams();
  const sourceParam = searchParams.get("source");
  const sourceSurface: LeadSourceSurface = isLeadSourceSurface(sourceParam)
    ? sourceParam
    : "car_detail";

  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const brandLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS) map.set(b.brand_id, b.name);
    return map;
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet<{ trim: Trim }>(`/api/cars/${encodeURIComponent(carId)}`),
      apiGet<{ prices: PriceRecord[] }>(
        `/api/cars/${encodeURIComponent(carId)}/prices`
      ),
    ])
      .then(([trimRes, pricesRes]) => {
        if (cancelled) return;
        setState({
          status: "ready",
          trim: trimRes.trim,
          prices: pricesRes.prices,
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
  }, [carId, reloadKey]);

  function retry() {
    setState({ status: "loading" });
    setReloadKey((k) => k + 1);
  }

  if (state.status === "loading") {
    return <LoadingState label="Maşın yüklənir…" />;
  }

  if (state.status === "not_found") {
    return (
      <NotFoundState
        title="Maşın tapılmadı"
        note="Bu trim mövcud deyil və ya silinib."
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

  const { trim, prices } = state;
  const brandName = brandLookup.get(trim.brand_id) ?? trim.brand_id;
  const trimSuffix = deriveTrimSuffix(trim.display_name, brandName, trim.model_name);

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <nav className="mb-4 text-sm">
        <Link
          href={ROUTES.cars}
          className="text-accent-blue underline-offset-2 hover:underline"
        >
          ← Kataloqa qayıt
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <CarImage
            src={trim.image_url}
            alt={trim.display_name}
            brandName={brandName}
            energyType={trim.energy_type}
          />
        </div>

        <div className="flex flex-col gap-4">
          <header className="space-y-1">
            <p className="text-sm font-medium text-foreground-muted">
              {brandName} · {trim.model_name}
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              {trimSuffix || trim.display_name}
            </h1>
            <p className="text-sm text-foreground-muted">
              {trim.year} · {ENERGY_LABEL[trim.energy_type]}
            </p>
          </header>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border bg-surface-elevated p-4 text-sm">
            <div>
              <dt className="text-foreground-muted">Marka</dt>
              <dd className="font-medium text-foreground">{brandName}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Model</dt>
              <dd className="font-medium text-foreground">{trim.model_name}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Komplektasiya</dt>
              <dd className="font-medium text-foreground">
                {trimSuffix || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">İl</dt>
              <dd className="font-medium text-foreground">{trim.year}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Enerji növü</dt>
              <dd className="font-medium text-foreground">
                {trim.energy_type} · {ENERGY_LABEL[trim.energy_type]}
              </dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Güc</dt>
              <dd className="font-medium text-foreground">
                {trim.power_hp ? `${trim.power_hp} a.g.` : "—"}
              </dd>
            </div>
            {trim.range_km != null ? (
              <div className="col-span-2">
                <dt className="text-foreground-muted">Yürüş məsafəsi</dt>
                <dd className="font-medium text-foreground">
                  {trim.range_km} km
                </dd>
              </div>
            ) : null}
          </dl>

          <div
            id="sorgu"
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface-elevated p-4"
          >
            <LeadFormLauncher
              trimId={trim.trim_id}
              sourceSurface={sourceSurface}
            />
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                Müqayisəyə əlavə et
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                Saxla
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Qiymət məlumatları
        </h2>
        {prices.length === 0 ? (
          <EmptyState
            title="Qiymət məlumatı yoxdur"
            note="Bu trim üçün hələ ki, qiymət qeydi mövcud deyil."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {prices.map((p, i) => (
              <li key={`${p.trim_id}-${p.offer_id ?? p.status}-${i}`}>
                <PriceCard price={p} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
