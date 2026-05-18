"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { QuickSearch } from "@/components/catalog/QuickSearch";
import { listTrimsForModel } from "@/lib/cars/client-lookup";
import { getGenerationById } from "@/lib/cars/generations";
import { BRANDS, TRIMS } from "@/lib/cars/seed";
import { useT } from "@/lib/i18n/client";
import {
  AVAILABILITY_LABEL,
  AVAILABILITY_OPTIONS,
  BODY_TYPES,
  BODY_TYPE_LABEL,
  SORT_LABEL,
  SORT_OPTIONS,
} from "@/lib/cars/taxonomy";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES } from "@/lib/routes";

// Sprint 8H Correction v2: identity dimensions (brand/model/generation/year-
// range/price-range/keyword/energy) live in <QuickSearch>. The advanced panel
// owns trim (Komplektasiya), kuzov, range, dealer-verified, availability and
// sort. TODO (post-sprint): transmission, drivetrain, seats, engine,
// fuel_consumption_max, profile_match — pending Trim data fields.
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
type FilterKey = (typeof FILTER_KEYS)[number];

// Sprint 10I-B: range_min/range_max target range_km (EV electric range), not
// odometer mileage — UI label changed from "Yürüş" to "Avtonomiya" / "Range" /
// "Запас хода" via the dictionary.
const FILTER_LABEL_KEY: Record<FilterKey, TranslationKey> = {
  q: "catalogFilters.keyword",
  brand: "catalogFilters.brand",
  model: "catalogFilters.model",
  generation: "catalogFilters.generation",
  trim: "catalogFilters.trim",
  year: "catalogFilters.year",
  year_from: "catalogFilters.yearMin",
  year_to: "catalogFilters.yearMax",
  energy_type: "catalogFilters.energyTypeShort",
  body_type: "catalogFilters.bodyTypeShort",
  price_min: "catalogFilters.priceMin",
  price_max: "catalogFilters.priceMax",
  range_min: "catalogFilters.rangeMinShort",
  range_max: "catalogFilters.rangeMaxShort",
  dealer_verified: "catalogFilters.dealerVerified",
  availability: "catalogFilters.availability",
  sort: "catalogFilters.sortLabel",
};

const ADVANCED_KEYS: FilterKey[] = [
  "trim",
  "body_type",
  "range_min",
  "range_max",
  "dealer_verified",
  "availability",
  "sort",
];

function buildHref(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${ROUTES.cars}?${qs}` : ROUTES.cars;
}

type Props = {
  count?: number;
};

export function CatalogFilters({ count }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const bodyOptions = useMemo(
    () =>
      BODY_TYPES.map((bt) => ({
        value: bt,
        label: BODY_TYPE_LABEL[bt],
      })),
    [],
  );
  const availabilityOptions = useMemo(
    () =>
      AVAILABILITY_OPTIONS.map((a) => ({
        value: a,
        label: AVAILABILITY_LABEL[a],
      })),
    [],
  );
  const sortOptions = useMemo(
    () =>
      SORT_OPTIONS.map((s) => ({
        value: s,
        label: SORT_LABEL[s],
      })),
    [],
  );
  const brandNameLookup = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of BRANDS) m.set(b.brand_id, b.name);
    return m;
  }, []);

  const currentBrand = searchParams.get("brand") ?? "";
  const currentModel = searchParams.get("model") ?? "";
  const currentGeneration = searchParams.get("generation") ?? "";
  const currentTrim = searchParams.get("trim") ?? "";
  const currentYearRaw = searchParams.get("year") ?? "";
  const currentYearNum = /^\d+$/.test(currentYearRaw)
    ? Number.parseInt(currentYearRaw, 10)
    : undefined;

  const trimOptions = useMemo(() => {
    if (!currentBrand || !currentModel) return [];
    return listTrimsForModel(
      currentBrand,
      currentModel,
      currentYearNum,
      currentGeneration || undefined,
    ).map((t) => ({ value: t.trim_id, label: t.display_name }));
  }, [currentBrand, currentModel, currentYearNum, currentGeneration]);

  const trimNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of TRIMS) map.set(t.trim_id, t.display_name);
    return map;
  }, []);

  const [advancedOpen, setAdvancedOpen] = useState<boolean>(() =>
    ADVANCED_KEYS.some((k) => searchParams.get(k)),
  );

  function pushParams(
    updates: Partial<Record<FilterKey, string | null>>,
  ) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === undefined || v === "") {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    }
    router.replace(buildHref(next), { scroll: false });
  }

  function removeParam(key: FilterKey) {
    pushParams({ [key]: null });
  }

  function reset() {
    router.replace(ROUTES.cars, { scroll: false });
  }

  const activeChips = FILTER_KEYS.filter((k) => searchParams.get(k)).map(
    (k) => {
      const raw = searchParams.get(k) ?? "";
      let display = raw;
      if (k === "brand") display = brandNameLookup.get(raw) ?? raw;
      else if (k === "trim") display = trimNameLookup.get(raw) ?? raw;
      else if (k === "generation") {
        display = getGenerationById(raw)?.display_name ?? raw;
      } else if (k === "body_type") {
        display = BODY_TYPE_LABEL[raw as keyof typeof BODY_TYPE_LABEL] ?? raw;
      } else if (k === "availability") {
        display =
          AVAILABILITY_LABEL[raw as keyof typeof AVAILABILITY_LABEL] ?? raw;
      } else if (k === "sort") {
        display = SORT_LABEL[raw as keyof typeof SORT_LABEL] ?? raw;
      } else if (k === "dealer_verified") {
        display = t("catalogFilters.dealerVerifiedYes");
      }
      return { key: k, display };
    },
  );

  return (
    <Card padding="md" tone="raised" className="space-y-4">
      <QuickSearch
        mode="syncUrl"
        count={count}
        advancedOpen={advancedOpen}
        onToggleAdvanced={() => setAdvancedOpen((v) => !v)}
      />

      {/* Advanced filter — Komplektasiya stays the first, most prominent field. */}
      {advancedOpen ? (
        <div className="space-y-4 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            {t("catalogFilters.advancedLabel")}
          </p>

          {/* Row 1: Komplektasiya + Kuzov */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label={t("catalogFilters.trim")}
              value={currentTrim}
              onChange={(e) =>
                pushParams({ trim: e.target.value || null })
              }
              placeholderOption={
                currentModel
                  ? t("catalogFilters.all")
                  : t("catalogFilters.selectModelFirst")
              }
              disabled={!currentModel}
              options={trimOptions}
              helpText={
                currentGeneration
                  ? t("catalogFilters.matchesGeneration")
                  : t("catalogFilters.dependsOnBrandModel")
              }
            />
            <Select
              label={t("catalogFilters.bodyType")}
              value={searchParams.get("body_type") ?? ""}
              onChange={(e) =>
                pushParams({ body_type: e.target.value || null })
              }
              placeholderOption={t("catalogFilters.all")}
              options={bodyOptions}
            />
            <Input
              label={t("catalogFilters.rangeMin")}
              type="number"
              inputMode="numeric"
              min={0}
              value={searchParams.get("range_min") ?? ""}
              onChange={(e) =>
                pushParams({ range_min: e.target.value || null })
              }
              placeholder="0"
              inputClassName="min-w-0"
            />
            <Input
              label={t("catalogFilters.rangeMax")}
              type="number"
              inputMode="numeric"
              min={0}
              value={searchParams.get("range_max") ?? ""}
              onChange={(e) =>
                pushParams({ range_max: e.target.value || null })
              }
              placeholder="—"
              inputClassName="min-w-0"
            />
          </div>

          {/* Row 2: dealer-verified + availability + sort */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={searchParams.get("dealer_verified") === "1"}
                onChange={(e) =>
                  pushParams({
                    dealer_verified: e.target.checked ? "1" : null,
                  })
                }
                className="h-4 w-4 accent-accent-orange"
              />
              <span>{t("catalogFilters.dealerVerifiedOnly")}</span>
            </label>
            <Select
              label={t("catalogFilters.availability")}
              value={searchParams.get("availability") ?? ""}
              onChange={(e) =>
                pushParams({ availability: e.target.value || null })
              }
              placeholderOption={t("catalogFilters.all")}
              options={availabilityOptions}
            />
            <Select
              label={t("catalogFilters.sortLabel")}
              value={searchParams.get("sort") ?? ""}
              onChange={(e) => pushParams({ sort: e.target.value || null })}
              placeholderOption={t("catalogFilters.sortRecommended")}
              options={sortOptions}
            />
          </div>
        </div>
      ) : null}

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs uppercase tracking-wide text-foreground-muted">
            {t("catalogFilters.activeFilters")}
          </span>
          {activeChips.map((chip) => {
            const chipLabel = t(FILTER_LABEL_KEY[chip.key]);
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => removeParam(chip.key)}
                aria-label={t("catalogFilters.chipRemoveAria", { label: chipLabel })}
                className="rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
              >
                <Badge tone="blue" size="md">
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {chipLabel}
                  </span>
                  {chip.display}
                  <span aria-hidden>×</span>
                </Badge>
              </button>
            );
          })}
          <button
            type="button"
            onClick={reset}
            className="ml-auto text-xs font-medium text-foreground-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            {t("catalogFilters.clearAll")}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
