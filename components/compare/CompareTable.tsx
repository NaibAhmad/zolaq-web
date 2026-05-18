"use client";

import { CarImage } from "@/components/catalog/CarImage";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/cars/format";
import { getGenerationById } from "@/lib/cars/generations";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES } from "@/lib/routes";
import type {
  EnergyType,
  PriceRecord,
  PriceStatus,
  Trim,
} from "@/lib/cars/types";

export type CompareEntry = {
  trim: Trim;
  brandName: string;
  bestPrice: PriceRecord | null;
};

type Props = {
  entries: CompareEntry[];
};

const ENERGY_KEY: Record<EnergyType, TranslationKey> = {
  EV: "carDetail.energyEv",
  PHEV: "carDetail.energyPhev",
  EREV: "carDetail.energyErev",
  HEV: "carDetail.energyHev",
  ICE: "carDetail.energyIce",
};

const STATUS_KEY: Record<PriceStatus, TranslationKey> = {
  estimated: "catalogCard.statusEstimated",
  catalog_price: "catalogCard.statusCatalog",
  dealer_quote_pending: "catalogCard.statusPending",
  dealer_official_offer: "catalogCard.statusOfficial",
  expired_offer: "catalogCard.statusExpired",
  conflict: "catalogCard.statusConflict",
  price_unknown: "catalogCard.statusAsk",
  not_available: "catalogCard.statusUnavailable",
};

const STATUS_TONE: Record<PriceStatus, BadgeTone> = {
  estimated: "warning",
  catalog_price: "neutral",
  dealer_quote_pending: "blue",
  dealer_official_offer: "success",
  expired_offer: "muted",
  conflict: "danger",
  price_unknown: "muted",
  not_available: "muted",
};

function deriveTrimSuffix(displayName: string, brandName: string, modelName: string): string {
  const head = `${brandName} ${modelName}`;
  if (displayName.startsWith(head)) return displayName.slice(head.length).trim();
  if (displayName.startsWith(modelName)) return displayName.slice(modelName.length).trim();
  return displayName;
}

export function CompareTable({ entries }: Props) {
  const t = useT();
  const gridClass =
    entries.length === 3
      ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid gap-4 grid-cols-1 sm:grid-cols-2";

  function priceCell(p: PriceRecord | null): { value: string; tone: BadgeTone; label: string } {
    if (!p) {
      return { value: "—", tone: "muted", label: t("compare.noValue") };
    }
    if (p.amount > 0) {
      return {
        value: formatPrice(p.amount, p.currency),
        tone: STATUS_TONE[p.status],
        label: t(STATUS_KEY[p.status]),
      };
    }
    return {
      value: t("catalogCard.askPrice"),
      tone: STATUS_TONE[p.status],
      label: t(STATUS_KEY[p.status]),
    };
  }

  return (
    <div className={gridClass}>
      {entries.map((e) => {
        const suffix = deriveTrimSuffix(
          e.trim.display_name,
          e.brandName,
          e.trim.model_name,
        );
        const generation = getGenerationById(e.trim.generation_id);
        const cell = priceCell(e.bestPrice);
        const href = `${ROUTES.car(e.trim.trim_id)}?source=compare#sorgu`;
        return (
          <Card
            key={e.trim.trim_id}
            padding="none"
            tone="raised"
            className="flex h-full flex-col overflow-hidden"
          >
            <div className="p-3 pb-0">
              <CarImage
                src={e.trim.image_url}
                alt={e.trim.display_name}
                brandName={e.brandName}
                energyType={e.trim.energy_type}
                aspect="4/3"
              />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <header className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {e.brandName} · {e.trim.model_name}
                </p>
                {generation ? (
                  <p className="text-xs font-medium text-accent-blue">
                    {generation.display_name}
                  </p>
                ) : null}
                <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-orange">
                  {t("catalogCard.trim")}
                </p>
                <h3 className="text-base font-semibold text-foreground">
                  {suffix || e.trim.display_name}
                </h3>
                <p className="text-xs text-foreground-muted">
                  {e.trim.year} · {t(ENERGY_KEY[e.trim.energy_type])}
                </p>
              </header>

              <div className="grid grid-cols-2 gap-3 rounded-[var(--radius)] border border-border bg-surface p-3">
                <SpecCell
                  label={t("carDetail.generationLabel")}
                  value={generation?.display_name ?? "—"}
                />
                <SpecCell
                  label={t("catalogCard.trim")}
                  value={suffix || "—"}
                />
                <SpecCell label={t("carDetail.yearLabel")} value={String(e.trim.year)} />
                <SpecCell label={t("carDetail.energyShortLabel")} value={e.trim.energy_type} />
                <SpecCell
                  label={t("carDetail.powerLabel")}
                  value={e.trim.power_hp ? `${e.trim.power_hp} a.g.` : "—"}
                />
                <SpecCell
                  label={t("carDetail.rangeLabel")}
                  value={e.trim.range_km != null ? `${e.trim.range_km} km` : "—"}
                />
              </div>

              <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-surface-muted p-3">
                <p className="text-xs uppercase tracking-wide text-foreground-muted">
                  {t("compare.priceLabel")}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {cell.value}
                </p>
                <Badge tone={cell.tone} size="sm" className="w-fit">
                  {cell.label}
                </Badge>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <ButtonLink href={href} variant="primary" fullWidth>
                  {t("compare.requestOffer")}
                </ButtonLink>
                {e.bestPrice?.source_name ? (
                  <p className="text-[11px] text-foreground-muted">
                    {t("compare.sourcePrefix", { source: e.bestPrice.source_name })}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-foreground-muted">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
