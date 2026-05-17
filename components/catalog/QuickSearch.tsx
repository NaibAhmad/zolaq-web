"use client";

// Sprint 8H Correction v2: shared decision-first search card used by the
// homepage hero and the /cars page top. Two modes:
//   - "navigate": local form state; submit pushes /cars?...
//   - "syncUrl":  reads/writes useSearchParams on the current /cars route.
//
// Identity row: Marka → Model → Nəsil → keyword.
// Narrows row: İl min/max → Qiymət min/max → Enerji növü → CTA.

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  listModelsForBrand,
  listTrimsForModel,
} from "@/lib/cars/client-lookup";
import {
  listGenerationsForModel,
} from "@/lib/cars/generations";
import { BRANDS } from "@/lib/cars/seed";
import { ENERGY_TYPES, type EnergyType } from "@/lib/cars/types";
import { ROUTES } from "@/lib/routes";

type Mode = "navigate" | "syncUrl";

type Props = {
  mode: Mode;
  // syncUrl-only: dynamic CTA count + advanced-panel toggle wiring.
  count?: number;
  onToggleAdvanced?: () => void;
  advancedOpen?: boolean;
};

// Short Azerbaijani labels for the Energy select. Dizel is intentionally not
// listed — current Trim model has no diesel split (TODO when fuel_type lands).
const ENERGY_LABEL: Record<EnergyType, string> = {
  EV: "EV (elektrik)",
  PHEV: "Plug-in hibrid",
  EREV: "EREV",
  HEV: "Hibrid",
  ICE: "Benzin",
};

export function QuickSearch({
  mode,
  count,
  onToggleAdvanced,
  advancedOpen,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state used only in "navigate" mode (homepage).
  const [localBrand, setLocalBrand] = useState("");
  const [localModel, setLocalModel] = useState("");
  const [localGeneration, setLocalGeneration] = useState("");
  const [localQ, setLocalQ] = useState("");
  const [localYearFrom, setLocalYearFrom] = useState("");
  const [localYearTo, setLocalYearTo] = useState("");
  const [localPriceMin, setLocalPriceMin] = useState("");
  const [localPriceMax, setLocalPriceMax] = useState("");
  const [localEnergy, setLocalEnergy] = useState("");

  // Effective values come from URL in syncUrl mode, local state otherwise.
  const brand =
    mode === "syncUrl" ? searchParams.get("brand") ?? "" : localBrand;
  const model =
    mode === "syncUrl" ? searchParams.get("model") ?? "" : localModel;
  const generation =
    mode === "syncUrl"
      ? searchParams.get("generation") ?? ""
      : localGeneration;
  const urlQ = mode === "syncUrl" ? searchParams.get("q") ?? "" : "";
  const yearFrom =
    mode === "syncUrl" ? searchParams.get("year_from") ?? "" : localYearFrom;
  const yearTo =
    mode === "syncUrl" ? searchParams.get("year_to") ?? "" : localYearTo;
  const priceMin =
    mode === "syncUrl" ? searchParams.get("price_min") ?? "" : localPriceMin;
  const priceMax =
    mode === "syncUrl" ? searchParams.get("price_max") ?? "" : localPriceMax;
  const energy =
    mode === "syncUrl"
      ? searchParams.get("energy_type") ?? ""
      : localEnergy;

  // Draft for keyword to avoid pushing on every keystroke in syncUrl mode.
  // One-way: initialized from URL at mount; pushed back on blur/submit. URL
  // changes from outside (e.g. removing the q chip) won't reflow this input —
  // same behaviour as the pre-correction Sprint 8H simple search row.
  const [qDraft, setQDraft] = useState<string>(
    mode === "syncUrl" ? urlQ : "",
  );

  const brandOptions = useMemo(
    () =>
      BRANDS.filter((b) => b.status === "active").map((b) => ({
        value: b.brand_id,
        label: b.name,
      })),
    [],
  );
  const modelOptions = useMemo(() => {
    if (!brand) return [];
    return listModelsForBrand(brand).map((n) => ({ value: n, label: n }));
  }, [brand]);
  const generationOptions = useMemo(() => {
    if (!brand || !model) return [];
    return listGenerationsForModel(brand, model).map((g) => ({
      value: g.generation_id,
      label: g.display_name,
    }));
  }, [brand, model]);
  const energyOptions = useMemo(
    () =>
      ENERGY_TYPES.map((e) => ({ value: e, label: ENERGY_LABEL[e] })),
    [],
  );

  function pushSync(updates: Record<string, string | null | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) continue;
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.replace(qs ? `${ROUTES.cars}?${qs}` : ROUTES.cars, {
      scroll: false,
    });
  }

  function setLocal(key: string, value: string) {
    switch (key) {
      case "q":
        setLocalQ(value);
        break;
      case "year_from":
        setLocalYearFrom(value);
        break;
      case "year_to":
        setLocalYearTo(value);
        break;
      case "price_min":
        setLocalPriceMin(value);
        break;
      case "price_max":
        setLocalPriceMax(value);
        break;
      case "energy_type":
        setLocalEnergy(value);
        break;
    }
  }

  function setField(key: string, value: string) {
    if (mode === "syncUrl") pushSync({ [key]: value || null });
    else setLocal(key, value);
  }

  function onBrandChange(v: string) {
    if (mode === "syncUrl") {
      pushSync({
        brand: v || null,
        model: null,
        generation: null,
        trim: null,
      });
    } else {
      setLocalBrand(v);
      setLocalModel("");
      setLocalGeneration("");
    }
  }
  function onModelChange(v: string) {
    if (mode === "syncUrl") {
      pushSync({ model: v || null, generation: null, trim: null });
    } else {
      setLocalModel(v);
      setLocalGeneration("");
    }
  }
  function onGenerationChange(v: string) {
    if (mode === "syncUrl") {
      const currentTrim = searchParams.get("trim");
      let trimUpdate: string | null | undefined = undefined;
      if (currentTrim && v && brand && model) {
        const trims = listTrimsForModel(brand, model, undefined, v);
        if (!trims.some((t) => t.trim_id === currentTrim)) trimUpdate = null;
      }
      pushSync({ generation: v || null, trim: trimUpdate });
    } else {
      setLocalGeneration(v);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === "syncUrl") {
      // Commit the keyword draft on submit (otherwise change is on blur).
      pushSync({ q: qDraft.trim() || null });
      return;
    }
    // navigate mode — build params from local state and push to /cars.
    const params = new URLSearchParams();
    const trimmedQ = localQ.trim();
    if (trimmedQ) params.set("q", trimmedQ);
    if (localBrand) params.set("brand", localBrand);
    if (localModel) params.set("model", localModel);
    if (localGeneration) params.set("generation", localGeneration);
    if (localYearFrom) params.set("year_from", localYearFrom);
    if (localYearTo) params.set("year_to", localYearTo);
    if (localPriceMin) params.set("price_min", localPriceMin);
    if (localPriceMax) params.set("price_max", localPriceMax);
    if (localEnergy) params.set("energy_type", localEnergy);
    const qs = params.toString();
    router.push(qs ? `${ROUTES.cars}?${qs}` : ROUTES.cars);
  }

  const ctaText =
    mode === "syncUrl" && typeof count === "number"
      ? `${count} avtomobili göstər`
      : "Avtomobilləri göstər";

  const keywordValue = mode === "syncUrl" ? qDraft : localQ;

  return (
    <form
      onSubmit={onSubmit}
      aria-label="Sürətli axtarış"
      className="flex flex-col gap-3"
    >
      {/* Identity row: Marka, Model, Nəsil, keyword */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Marka"
          value={brand}
          onChange={(e) => onBrandChange(e.target.value)}
          placeholderOption="Bütün markalar"
          options={brandOptions}
        />
        <Select
          label="Model"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          placeholderOption={brand ? "Bütün modellər" : "Əvvəlcə marka seçin"}
          disabled={!brand}
          options={modelOptions}
        />
        <Select
          label="Nəsil"
          value={generation}
          onChange={(e) => onGenerationChange(e.target.value)}
          placeholderOption={
            model ? "Bütün nəsillər" : "Əvvəlcə model seçin"
          }
          disabled={!model}
          options={generationOptions}
          helpText={
            model && generationOptions.length === 0
              ? "Bu model üçün nəsil qeydi yoxdur"
              : undefined
          }
        />
        <Input
          label="Açar söz"
          type="search"
          value={keywordValue}
          onChange={(e) =>
            mode === "syncUrl"
              ? setQDraft(e.target.value)
              : setField("q", e.target.value)
          }
          onBlur={
            mode === "syncUrl"
              ? () => pushSync({ q: qDraft.trim() || null })
              : undefined
          }
          placeholder="Marka, model, nəsil, komplektasiya və ya açar söz"
        />
      </div>

      {/* Narrows row: year range, price range, energy */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          label="İl, min."
          type="number"
          inputMode="numeric"
          min={1990}
          max={2100}
          value={yearFrom}
          onChange={(e) => setField("year_from", e.target.value)}
          placeholder="—"
          inputClassName="min-w-0"
        />
        <Input
          label="İl, maks."
          type="number"
          inputMode="numeric"
          min={1990}
          max={2100}
          value={yearTo}
          onChange={(e) => setField("year_to", e.target.value)}
          placeholder="—"
          inputClassName="min-w-0"
        />
        <Input
          label="Qiymət, min. (AZN)"
          type="number"
          inputMode="numeric"
          min={0}
          value={priceMin}
          onChange={(e) => setField("price_min", e.target.value)}
          placeholder="0"
          inputClassName="min-w-0"
        />
        <Input
          label="Qiymət, maks. (AZN)"
          type="number"
          inputMode="numeric"
          min={0}
          value={priceMax}
          onChange={(e) => setField("price_max", e.target.value)}
          placeholder="—"
          inputClassName="min-w-0"
        />
        <Select
          label="Enerji növü"
          value={energy}
          onChange={(e) => setField("energy_type", e.target.value)}
          placeholderOption="Hamısı"
          options={energyOptions}
        />
      </div>

      {/* Footer row: advanced toggle + CTA */}
      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        {mode === "syncUrl" ? (
          <button
            type="button"
            aria-expanded={advancedOpen}
            onClick={onToggleAdvanced}
            className="text-sm font-medium text-accent-blue underline-offset-2 hover:underline"
          >
            {advancedOpen ? "Ətraflı filtri gizlət ▲" : "Ətraflı filtr ▾"}
          </button>
        ) : (
          <Link
            href={ROUTES.cars}
            className="text-sm font-medium text-accent-blue underline-offset-2 hover:underline"
          >
            Ətraflı filtr aç →
          </Link>
        )}
        <Button type="submit" variant="dark">
          {ctaText}
        </Button>
      </div>
    </form>
  );
}
