"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/cars/format";
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

const STATUS_LABEL: Record<PriceStatus, string> = {
  estimated: "Təxmini qiymət",
  catalog_price: "Kataloq qiyməti",
  dealer_quote_pending: "Təklif gözlənilir",
  dealer_official_offer: "Rəsmi diler təklifi",
  expired_offer: "Təklif müddəti bitib",
  conflict: "Qiymət mənbələrində fərq var",
  price_unknown: "Qiymət soruş",
  not_available: "Hazırda mövcud deyil",
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

const SOURCE_LABEL: Record<SourceType, string> = {
  official_dealer: "Rəsmi diler",
  catalog: "Kataloq",
  partner: "Tərəfdaş",
  estimate: "Təxmin",
  zolaq_manual: "Zolaq",
  imported: "İdxal",
};

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unverified: "Yoxlanılmayıb",
  verified: "Təsdiqlənib",
  pending: "Yoxlanılır",
  conflict: "Ziddiyyət",
  outdated: "Köhnəlib",
};

const VERIFICATION_TONE: Record<VerificationStatus, BadgeTone> = {
  unverified: "muted",
  verified: "success",
  pending: "warning",
  conflict: "danger",
  outdated: "muted",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return DATE_FORMATTER.format(d);
}

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
          {STATUS_LABEL[price.status]}
        </Badge>
        {showAmount ? (
          <span className="text-2xl font-semibold leading-tight text-foreground">
            {formatPrice(price.amount, price.currency)}
          </span>
        ) : (
          <span className="text-sm font-medium text-foreground-muted">
            {price.status === "not_available" ? "—" : "Məlum deyil"}
          </span>
        )}
      </header>

      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            Mənbə
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
              ({SOURCE_LABEL[price.source_type]})
            </span>
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            Yoxlama
          </dt>
          <dd>
            <Badge tone={VERIFICATION_TONE[price.verification_status]} size="sm">
              {VERIFICATION_LABEL[price.verification_status]}
            </Badge>
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            Yenilənib
          </dt>
          <dd className="font-medium text-foreground">
            {formatDate(price.last_updated)}
          </dd>
        </div>
        {showValidUntil && price.valid_until ? (
          <div className="flex flex-col">
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">
              Etibarlıdır
            </dt>
            <dd className="font-medium text-foreground">
              {formatDate(price.valid_until)}
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
          PDF təklif
        </a>
      ) : null}
    </Card>
  );
}
