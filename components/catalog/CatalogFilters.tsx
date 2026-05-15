"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRANDS, TRIMS } from "@/lib/cars/seed";
import { ENERGY_TYPES } from "@/lib/cars/types";
import { ROUTES } from "@/lib/routes";

const FILTER_KEYS = ["brand", "energy_type", "year", "q"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

function buildHref(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${ROUTES.cars}?${qs}` : ROUTES.cars;
}

export function CatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeBrands = useMemo(
    () => BRANDS.filter((b) => b.status === "active"),
    []
  );
  const yearOptions = useMemo(
    () => Array.from(new Set(TRIMS.map((t) => t.year))).sort((a, b) => b - a),
    []
  );

  function pushParam(key: FilterKey, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.replace(buildHref(next), { scroll: false });
  }

  function reset() {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of FILTER_KEYS) next.delete(key);
    router.replace(buildHref(next), { scroll: false });
  }

  const hasActive = FILTER_KEYS.some((k) => searchParams.get(k));

  return (
    <section
      aria-label="Kataloq filtrləri"
      className="rounded-lg border border-border bg-surface-elevated p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Marka</span>
          <select
            value={searchParams.get("brand") ?? ""}
            onChange={(e) => pushParam("brand", e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-brand"
          >
            <option value="">Hamısı</option>
            {activeBrands.map((b) => (
              <option key={b.brand_id} value={b.brand_id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Enerji növü</span>
          <select
            value={searchParams.get("energy_type") ?? ""}
            onChange={(e) => pushParam("energy_type", e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-brand"
          >
            <option value="">Hamısı</option>
            {ENERGY_TYPES.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">İl</span>
          <select
            value={searchParams.get("year") ?? ""}
            onChange={(e) => pushParam("year", e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-brand"
          >
            <option value="">Hamısı</option>
            {yearOptions.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Axtar</span>
          <input
            type="search"
            value={searchParams.get("q") ?? ""}
            onChange={(e) => pushParam("q", e.target.value)}
            placeholder="Model və ya komplektasiya"
            className="rounded-md border border-border bg-surface px-3 py-2 text-foreground outline-none focus:border-brand"
          />
        </label>
      </div>

      {hasActive ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={reset}
            className="text-sm text-accent-blue underline-offset-2 hover:underline"
          >
            Sıfırla
          </button>
        </div>
      ) : null}
    </section>
  );
}
