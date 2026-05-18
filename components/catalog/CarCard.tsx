"use client";

import { CarImage } from "@/components/catalog/CarImage";
import { CompareToggleButton } from "@/components/compare/CompareToggleButton";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/cars/format";
import { getGenerationById } from "@/lib/cars/generations";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES } from "@/lib/routes";
import type {
  PriceRecord,
  PriceStatus,
  SourceType,
  Trim,
  VerificationStatus,
} from "@/lib/cars/types";

type Props = {
  trim: Trim;
  brandName: string;
  bestPrice?: PriceRecord | null;
};

function deriveTrimSuffix(displayName: string, brandName: string, modelName: string): string {
  const head = `${brandName} ${modelName}`;
  if (displayName.startsWith(head)) {
    return displayName.slice(head.length).trim();
  }
  if (displayName.startsWith(modelName)) {
    return displayName.slice(modelName.length).trim();
  }
  return displayName;
}

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

const VERIFICATION_KEY: Record<VerificationStatus, TranslationKey> = {
  unverified: "catalogCard.verifyUnverified",
  verified: "catalogCard.verifyVerified",
  pending: "catalogCard.verifyPending",
  conflict: "catalogCard.verifyConflict",
  outdated: "catalogCard.verifyOutdated",
};

const VERIFICATION_TONE: Record<VerificationStatus, BadgeTone> = {
  unverified: "muted",
  verified: "success",
  pending: "warning",
  conflict: "danger",
  outdated: "muted",
};

const SOURCE_KEY: Record<SourceType, TranslationKey> = {
  official_dealer: "catalogCard.sourceDealer",
  catalog: "catalogCard.sourceCatalog",
  partner: "catalogCard.sourcePartner",
  estimate: "catalogCard.sourceEstimate",
  zolaq_manual: "catalogCard.sourceZolaq",
  imported: "catalogCard.sourceImport",
};

export function CarCard({ trim, brandName, bestPrice = null }: Props) {
  const t = useT();
  const trimSuffix = deriveTrimSuffix(trim.display_name, brandName, trim.model_name);
  const generation = getGenerationById(trim.generation_id);
  const detailHref = ROUTES.car(trim.trim_id);
  const hasPriceAmount = bestPrice && bestPrice.amount > 0;

  return (
    <Card
      as="article"
      padding="none"
      tone="raised"
      interactive
      className="group flex h-full w-full flex-col overflow-hidden"
    >
      <CarImage
        src={trim.image_url}
        alt={trim.display_name}
        brandName={brandName}
        energyType={trim.energy_type}
        className="!rounded-none"
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {brandName} · {trim.model_name}
          </p>
          {generation ? (
            <p className="text-xs font-medium text-accent-blue">
              {generation.display_name}
            </p>
          ) : null}
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {trimSuffix || trim.display_name}
          </h3>
          <p className="text-[11px] uppercase tracking-wide text-foreground-muted">
            {t("catalogCard.trim")}
          </p>
        </header>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone="muted" size="sm">
            {trim.year}
          </Badge>
          <Badge tone="muted" size="sm">
            {trim.energy_type}
          </Badge>
          {trim.power_hp ? (
            <Badge tone="muted" size="sm">
              {trim.power_hp} a.g.
            </Badge>
          ) : null}
          {trim.range_km ? (
            <Badge tone="muted" size="sm">
              {trim.range_km} km
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5 rounded-[var(--radius)] border border-border bg-surface-muted px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs uppercase tracking-wide text-foreground-muted">
              {t("catalogCard.price")}
            </span>
            <span className="text-base font-semibold text-foreground">
              {hasPriceAmount && bestPrice
                ? formatPrice(bestPrice.amount, bestPrice.currency)
                : bestPrice
                  ? t("catalogCard.askPrice")
                  : "—"}
            </span>
          </div>
          {bestPrice ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={STATUS_TONE[bestPrice.status]} size="sm">
                {t(STATUS_KEY[bestPrice.status])}
              </Badge>
              <Badge
                tone={VERIFICATION_TONE[bestPrice.verification_status]}
                size="sm"
              >
                {t(VERIFICATION_KEY[bestPrice.verification_status])}
              </Badge>
              <span className="text-[11px] text-foreground-muted">
                {t(SOURCE_KEY[bestPrice.source_type])}
                {bestPrice.source_name ? ` · ${bestPrice.source_name}` : ""}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-foreground-muted">
              {t("catalogCard.noPriceYet")}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <ButtonLink href={detailHref} variant="primary" fullWidth>
            {t("catalogCard.viewDetails")}
          </ButtonLink>
          <ButtonLink
            href={`${detailHref}?source=catalog#sorgu`}
            variant="ghost"
            size="sm"
            fullWidth
          >
            {t("catalogCard.submitLead")}
          </ButtonLink>
          <CompareToggleButton trimId={trim.trim_id} />
        </div>
      </div>
    </Card>
  );
}
