import { formatPrice } from "@/lib/cars/format";
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

const STATUS_TONE: Record<PriceStatus, string> = {
  estimated: "border-warning/40 bg-warning/10 text-warning",
  catalog_price: "border-border bg-surface text-foreground",
  dealer_quote_pending: "border-accent-blue/40 bg-accent-blue/10 text-accent-blue",
  dealer_official_offer: "border-success/40 bg-success/10 text-success",
  expired_offer: "border-foreground-muted/40 bg-surface text-foreground-muted",
  conflict: "border-danger/40 bg-danger/10 text-danger",
  price_unknown: "border-border bg-surface text-foreground-muted",
  not_available: "border-border bg-surface text-foreground-muted",
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
  const showAmount = hasRenderableAmount(price.status) && price.amount > 0;
  const showValidUntil =
    hasDealerValidity(price.status) && price.valid_until != null;

  return (
    <article
      className={`rounded-lg border p-4 ${STATUS_TONE[price.status]}`}
      aria-label={STATUS_LABEL[price.status]}
    >
      <header className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide">
          {STATUS_LABEL[price.status]}
        </span>
        {showAmount ? (
          <span className="text-lg font-semibold text-foreground">
            {formatPrice(price.amount, price.currency)}
          </span>
        ) : (
          <span className="text-sm font-medium text-foreground-muted">
            {price.status === "not_available" ? "—" : "Məlum deyil"}
          </span>
        )}
      </header>

      <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm text-foreground sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-foreground-muted">Mənbə:</dt>
          <dd className="font-medium">
            {price.source_name}{" "}
            <span className="text-xs text-foreground-muted">
              ({SOURCE_LABEL[price.source_type]})
            </span>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-foreground-muted">Yoxlama:</dt>
          <dd className="font-medium">
            {VERIFICATION_LABEL[price.verification_status]}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-foreground-muted">Yenilənib:</dt>
          <dd className="font-medium">{formatDate(price.last_updated)}</dd>
        </div>
        {showValidUntil && price.valid_until ? (
          <div className="flex gap-2">
            <dt className="text-foreground-muted">Etibarlıdır:</dt>
            <dd className="font-medium">{formatDate(price.valid_until)}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
