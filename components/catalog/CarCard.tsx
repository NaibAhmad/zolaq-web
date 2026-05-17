import { CarImage } from "@/components/catalog/CarImage";
import { CompareToggleButton } from "@/components/compare/CompareToggleButton";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/lib/cars/format";
import { getGenerationById } from "@/lib/cars/generations";
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

const STATUS_LABEL: Record<PriceStatus, string> = {
  estimated: "Təxmini",
  catalog_price: "Kataloq",
  dealer_quote_pending: "Gözləmədə",
  dealer_official_offer: "Rəsmi təklif",
  expired_offer: "Müddəti bitib",
  conflict: "Ziddiyyət",
  price_unknown: "Soruş",
  not_available: "Mövcud deyil",
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

const SOURCE_LABEL: Record<SourceType, string> = {
  official_dealer: "Rəsmi diler",
  catalog: "Kataloq",
  partner: "Tərəfdaş",
  estimate: "Təxmin",
  zolaq_manual: "Zolaq",
  imported: "İdxal",
};

export function CarCard({ trim, brandName, bestPrice = null }: Props) {
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
            Komplektasiya
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
              Qiymət
            </span>
            <span className="text-base font-semibold text-foreground">
              {hasPriceAmount && bestPrice
                ? formatPrice(bestPrice.amount, bestPrice.currency)
                : bestPrice
                  ? "Qiymət soruş"
                  : "—"}
            </span>
          </div>
          {bestPrice ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={STATUS_TONE[bestPrice.status]} size="sm">
                {STATUS_LABEL[bestPrice.status]}
              </Badge>
              <Badge
                tone={VERIFICATION_TONE[bestPrice.verification_status]}
                size="sm"
              >
                {VERIFICATION_LABEL[bestPrice.verification_status]}
              </Badge>
              <span className="text-[11px] text-foreground-muted">
                {SOURCE_LABEL[bestPrice.source_type]}
                {bestPrice.source_name ? ` · ${bestPrice.source_name}` : ""}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-foreground-muted">
              Hələ qiymət qeyd edilməyib
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <ButtonLink href={detailHref} variant="primary" fullWidth>
            Ətraflı bax
          </ButtonLink>
          <ButtonLink
            href={`${detailHref}?source=catalog#sorgu`}
            variant="ghost"
            size="sm"
            fullWidth
          >
            Sorğu göndər
          </ButtonLink>
          <CompareToggleButton trimId={trim.trim_id} />
        </div>
      </div>
    </Card>
  );
}
