import { CarImage } from "@/components/catalog/CarImage";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Stat } from "@/components/ui/Stat";
import { formatAzn } from "@/lib/cars/format";
import { getBrand, getPricesForTrim, getTrimById } from "@/lib/cars/lookup";
import { ROUTES } from "@/lib/routes";
import type { PriceRecord, Trim } from "@/lib/cars/types";

const HERO_TRIM_ID = "trim_byd_han_ev_premium_awd_2025";

const STATUS_RANK: Record<PriceRecord["status"], number> = {
  dealer_official_offer: 0,
  dealer_quote_pending: 1,
  catalog_price: 2,
  estimated: 3,
  expired_offer: 4,
  conflict: 5,
  price_unknown: 6,
  not_available: 7,
};

function pickBest(prices: PriceRecord[]): PriceRecord | null {
  if (prices.length === 0) return null;
  return [...prices].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  )[0];
}

export function HomeHero() {
  const trim = getTrimById(HERO_TRIM_ID);
  const brand = trim ? getBrand(trim.brand_id) : null;
  const bestPrice = trim ? pickBest(getPricesForTrim(trim.trim_id)) : null;

  return (
    <section className="relative overflow-hidden zlq-hero-dark text-on-dark">
      <div aria-hidden className="absolute inset-0 zlq-hero-grid opacity-30" />
      <Container className="relative py-12 md:py-20 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <div className="flex flex-col gap-6">
            <Badge tone="on-dark" size="md" className="w-fit">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-orange" />
              Zolaq · 2026
            </Badge>
            <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Maşın almadan əvvəl{" "}
              <span className="text-accent-blue">Zolaq</span>-da yoxla.
            </h1>
            <p className="max-w-xl text-base text-on-dark-muted md:text-lg">
              Azərbaycanın rəsmi diler məlumatına və yoxlanmış qiymət təkliflərinə
              əsaslanan ilk avtomobil seçim platforması. Müqayisə et, sorğu göndər,
              rəsmi təklif al.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
              <ButtonLink href={ROUTES.cars} variant="primary" size="lg">
                Maşın seç
              </ButtonLink>
              <ButtonLink
                href={ROUTES.profileDecisions}
                variant="secondary"
                size="lg"
                className="!border-border-on-dark !bg-white/5 !text-on-dark hover:!bg-white/10"
              >
                Mənə uyğun tap
              </ButtonLink>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border-on-dark pt-6 md:gap-6">
              <Stat
                tone="dark"
                label="Rəsmi diler"
                value="7"
                hint="Brend təsdiqi"
              />
              <Stat
                tone="dark"
                label="Yoxlanmış təklif"
                value="6"
                hint="PDF-li qiymət"
              />
              <Stat tone="dark" label="Müqayisə" value="2-3" hint="Yan-yana" />
            </div>
          </div>

          {trim && brand ? (
            <HeroPreviewCard
              trim={trim}
              brandName={brand.name}
              price={bestPrice}
            />
          ) : null}
        </div>
      </Container>
    </section>
  );
}

type PreviewProps = {
  trim: Trim;
  brandName: string;
  price: PriceRecord | null;
};

function HeroPreviewCard({ trim, brandName, price }: PreviewProps) {
  return (
    <div className="relative">
      <div className="rounded-[var(--radius-xl)] border border-border-on-dark bg-surface-dark-elevated p-4 shadow-[var(--shadow-hero)] md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-on-dark-muted">
              Rəsmi təklif
            </p>
            <p className="mt-1 text-base font-semibold md:text-lg">
              {trim.display_name}
            </p>
          </div>
          <Badge tone="success" size="sm" className="shrink-0">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-green" />
            Rəsmi diler
          </Badge>
        </div>
        <div className="mt-4">
          <CarImage
            src={trim.image_url}
            alt={trim.display_name}
            brandName={brandName}
            energyType={trim.energy_type}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-on-dark-muted">Güc</p>
            <p className="text-sm font-semibold">
              {trim.power_hp ? `${trim.power_hp} a.g.` : "—"}
            </p>
          </div>
          <div>
            <p className="text-on-dark-muted">Yürüş</p>
            <p className="text-sm font-semibold">
              {trim.range_km ? `${trim.range_km} km` : "—"}
            </p>
          </div>
          <div>
            <p className="text-on-dark-muted">İl</p>
            <p className="text-sm font-semibold">{trim.year}</p>
          </div>
        </div>
        {price ? (
          <div className="mt-4 flex items-center justify-between rounded-[var(--radius)] border border-border-on-dark bg-white/5 px-3 py-2 text-xs">
            <span className="truncate text-on-dark-muted">{price.source_name}</span>
            <span className="shrink-0 font-semibold text-accent-orange">
              {formatAzn(price.amount)}
            </span>
          </div>
        ) : null}
      </div>
      <div
        aria-hidden
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent-orange/30 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent-blue/30 blur-3xl"
      />
    </div>
  );
}
