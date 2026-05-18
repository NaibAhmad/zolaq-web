"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/cars/format";
import { formatDateAz } from "@/lib/format/date";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES } from "@/lib/routes";
import { trackEvent } from "@/lib/tracking/track";
import type {
  PriceRecord,
  PriceStatus,
  SourceType,
  VerificationStatus,
} from "@/lib/cars/types";

type Props = {
  price: PriceRecord;
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

const SOURCE_KEY: Record<SourceType, TranslationKey> = {
  official_dealer: "catalogCard.sourceDealer",
  catalog: "catalogCard.sourceCatalog",
  partner: "catalogCard.sourcePartner",
  estimate: "catalogCard.sourceEstimate",
  zolaq_manual: "catalogCard.sourceZolaq",
  imported: "catalogCard.sourceImport",
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

function hasDealerValidity(status: PriceStatus): boolean {
  return (
    status === "dealer_official_offer" ||
    status === "dealer_quote_pending" ||
    status === "expired_offer"
  );
}

function hasRenderableAmount(status: PriceStatus): boolean {
  return status !== "price_unknown" && status !== "not_available";
}

export function PriceCard({ price }: Props) {
  const t = useT();
  useEffect(() => {
    trackEvent("price_card_viewed", {
      trim_id: price.trim_id,
      price_status: price.status,
      source_type: price.source_type,
    });
  }, [price.trim_id, price.status, price.source_type]);

  const showAmount = hasRenderableAmount(price.status) && price.amount > 0;
  const showValidUntil =
    hasDealerValidity(price.status) && price.valid_until != null;
  const hasPdf =
    typeof price.signed_pdf_url === "string" && price.signed_pdf_url.length > 0;

  return (
    <Card
      as="article"
      padding="md"
      tone="light"
      className="flex h-full flex-col gap-3"
    >
      <header className="flex items-start justify-between gap-3">
        <Badge tone={STATUS_TONE[price.status]} size="md">
          {t(STATUS_KEY[price.status])}
        </Badge>
        {showAmount ? (
          <span className="text-2xl font-semibold leading-tight text-foreground">
            {formatPrice(price.amount, price.currency)}
          </span>
        ) : (
          <span className="text-sm font-medium text-foreground-muted">
            {price.status === "not_available"
              ? "—"
              : t("carDetail.missingData")}
          </span>
        )}
      </header>

      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            {t("carDetail.source")}
          </dt>
          <dd className="font-medium text-foreground">
            {price.dealer_id ? (
              <Link
                href={ROUTES.dealer(price.dealer_id)}
                className="text-accent-blue underline-offset-2 hover:underline"
              >
                {price.source_name}
              </Link>
            ) : (
              price.source_name
            )}
            <span className="ml-1 text-xs text-foreground-muted">
              ({t(SOURCE_KEY[price.source_type])})
            </span>
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            {t("dealerTrust.source")}
          </dt>
          <dd>
            <Badge tone={VERIFICATION_TONE[price.verification_status]} size="sm">
              {t(VERIFICATION_KEY[price.verification_status])}
            </Badge>
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            {t("carDetail.updatedOn")}
          </dt>
          <dd className="font-medium text-foreground">
            {formatDateAz(price.last_updated)}
          </dd>
        </div>
        {showValidUntil && price.valid_until ? (
          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">
              {t("carDetail.validUntil")}
            </dt>
            <dd className="font-medium text-foreground">
              {formatDateAz(price.valid_until)}
            </dd>
          </div>
        ) : null}
      </dl>

      {hasPdf ? (
        <a
          href={price.signed_pdf_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-[var(--radius)] border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        >
          <span aria-hidden>↧</span>
          {t("homeHero.verifiedOfferLabel")}
        </a>
      ) : null}
    </Card>
  );
}
