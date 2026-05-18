"use client";

import { CarImage } from "@/components/catalog/CarImage";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/cars/format";
import { getTrimById } from "@/lib/cars/lookup";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES } from "@/lib/routes";
import type { PriceRecord, PriceStatus } from "@/lib/cars/types";

type Props = {
  offer: PriceRecord;
  trimName?: string;
  brandName?: string;
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

export function DealerOfferCard({ offer, trimName, brandName }: Props) {
  const t = useT();
  const trim = getTrimById(offer.trim_id);
  const detailHref = `${ROUTES.car(offer.trim_id)}?source=dealer_profile`;
  const leadHref = `${detailHref}#sorgu`;
  const showAmount =
    offer.amount > 0 &&
    offer.status !== "price_unknown" &&
    offer.status !== "not_available";

  return (
    <Card
      as="article"
      padding="none"
      tone="raised"
      interactive
      className="flex h-full flex-col overflow-hidden"
    >
      {trim ? (
        <div className="p-3 pb-0">
          <CarImage
            src={trim.image_url}
            alt={trim.display_name}
            brandName={brandName ?? trim.brand_id}
            energyType={trim.energy_type}
            aspect="4/3"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            {brandName ?? trim?.brand_id ?? t("dealerCard.fallbackBrand")}
          </p>
          <h3 className="text-base font-semibold text-foreground">
            {trimName ?? trim?.display_name ?? offer.trim_id}
          </h3>
        </header>

        <div className="flex items-center justify-between gap-3">
          <Badge tone={STATUS_TONE[offer.status]} size="md">
            {t(STATUS_KEY[offer.status])}
          </Badge>
          {showAmount ? (
            <span className="text-lg font-semibold text-foreground">
              {formatPrice(offer.amount, offer.currency)}
            </span>
          ) : (
            <span className="text-sm text-foreground-muted">
              {offer.status === "not_available" ? "—" : t("catalogCard.statusAsk")}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <ButtonLink href={detailHref} variant="dark" fullWidth>
            {t("catalogCard.viewDetails")}
          </ButtonLink>
          <ButtonLink href={leadHref} variant="primary" fullWidth>
            {t("catalogCard.submitLead")}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
