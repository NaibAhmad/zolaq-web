"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CarImage } from "@/components/catalog/CarImage";
import { PriceCard } from "@/components/catalog/PriceCard";
import { CompareToggleButton } from "@/components/compare/CompareToggleButton";
import { LeadFormLauncher } from "@/components/leads/LeadFormLauncher";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { NotFoundState } from "@/components/state/NotFoundState";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stat } from "@/components/ui/Stat";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import { formatPrice } from "@/lib/cars/format";
import { getGenerationById } from "@/lib/cars/generations";
import { ROUTES } from "@/lib/routes";
import {
  isLeadSourceSurface,
  type LeadSourceSurface,
} from "@/lib/leads/types";
import { trackEvent } from "@/lib/tracking/track";
import type {
  EnergyType,
  PriceRecord,
  PriceStatus,
  SourceType,
  Trim,
  VerificationStatus,
} from "@/lib/cars/types";

type Props = {
  carId: string;
};

type FetchState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; trim: Trim; prices: PriceRecord[] };

const ENERGY_LABEL: Record<EnergyType, string> = {
  EV: "Tam elektrik",
  PHEV: "Plug-in hibrid",
  EREV: "Diapazon genişləndirici elektrik",
  HEV: "Hibrid",
  ICE: "Daxili yanma mühərriki",
};

const PRICE_STATUS_RANK: Record<PriceStatus, number> = {
  dealer_official_offer: 0,
  dealer_quote_pending: 1,
  catalog_price: 2,
  estimated: 3,
  expired_offer: 4,
  conflict: 5,
  price_unknown: 6,
  not_available: 7,
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

function pickBestPrice(prices: PriceRecord[]): PriceRecord | null {
  if (prices.length === 0) return null;
  const sorted = [...prices].sort(
    (a, b) => PRICE_STATUS_RANK[a.status] - PRICE_STATUS_RANK[b.status],
  );
  return sorted[0];
}

function deriveTrimSuffix(displayName: string, brandName: string, modelName: string): string {
  const head = `${brandName} ${modelName}`;
  if (displayName.startsWith(head)) return displayName.slice(head.length).trim();
  if (displayName.startsWith(modelName)) return displayName.slice(modelName.length).trim();
  return displayName;
}

export function CarDetail({ carId }: Props) {
  return (
    <Suspense fallback={<LoadingState label="Maşın yüklənir…" />}>
      <CarDetailInner carId={carId} />
    </Suspense>
  );
}

function CarDetailInner({ carId }: Props) {
  const searchParams = useSearchParams();
  const sourceParam = searchParams.get("source");
  const sourceSurface: LeadSourceSurface = isLeadSourceSurface(sourceParam)
    ? sourceParam
    : "car_detail";

  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const brandLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS) map.set(b.brand_id, b.name);
    return map;
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet<{ trim: Trim }>(`/api/cars/${encodeURIComponent(carId)}`),
      apiGet<{ prices: PriceRecord[] }>(
        `/api/cars/${encodeURIComponent(carId)}/prices`
      ),
    ])
      .then(([trimRes, pricesRes]) => {
        if (cancelled) return;
        setState({
          status: "ready",
          trim: trimRes.trim,
          prices: pricesRes.prices,
        });
        trackEvent("car_detail_viewed", {
          trim_id: trimRes.trim.trim_id,
          source: sourceSurface,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({ status: "not_found" });
          return;
        }
        if (err instanceof ApiError) {
          setState({ status: "error", message: err.message, code: err.code });
          return;
        }
        const message = err instanceof Error ? err.message : "Şəbəkə xətası";
        setState({ status: "error", message, code: "NETWORK" });
      });
    return () => {
      cancelled = true;
    };
  }, [carId, reloadKey, sourceSurface]);

  function retry() {
    setState({ status: "loading" });
    setReloadKey((k) => k + 1);
  }

  if (state.status === "loading") {
    return <LoadingState label="Maşın yüklənir…" />;
  }

  if (state.status === "not_found") {
    return (
      <NotFoundState
        title="Maşın tapılmadı"
        note="Bu trim mövcud deyil və ya silinib."
      />
    );
  }

  if (state.status === "error") {
    return (
      <ErrorState
        title="Xəta baş verdi"
        message={state.message}
        code={state.code}
        onRetry={retry}
      />
    );
  }

  const { trim, prices } = state;
  const brandName = brandLookup.get(trim.brand_id) ?? trim.brand_id;
  const trimSuffix = deriveTrimSuffix(trim.display_name, brandName, trim.model_name);
  const generation = getGenerationById(trim.generation_id);
  const bestPrice = pickBestPrice(prices);
  const otherPrices = bestPrice
    ? prices.filter((p) => p !== bestPrice)
    : prices;

  return (
    <>
      <Section tone="dark" padding="md">
        <Container>
          <nav className="mb-6 text-sm">
            <Link
              href={ROUTES.cars}
              className="text-on-dark-muted underline-offset-2 hover:text-on-dark hover:underline"
            >
              ← Kataloqa qayıt
            </Link>
          </nav>

          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="on-dark" size="md">
                  {trim.energy_type} · {ENERGY_LABEL[trim.energy_type]}
                </Badge>
                <Badge tone="on-dark" size="md">
                  {trim.year}
                </Badge>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-on-dark-muted">
                {brandName} · {trim.model_name}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-orange">
                Komplektasiya
              </p>
              <h1 className="text-3xl font-semibold leading-tight text-on-dark md:text-4xl">
                {trimSuffix || trim.display_name}
              </h1>
              <p className="max-w-xl text-sm text-on-dark-muted md:text-base">
                Zolaq yalnız rəsmi diler məlumatına və yoxlanmış qiymət
                təkliflərinə istinad edir. Aşağıdakı düyməni basaraq rəsmi
                qiymət təklifi alın.
              </p>

              <div
                id="sorgu-hero"
                className="mt-1 flex flex-wrap items-center gap-2"
              >
                <LeadFormLauncher
                  trimId={trim.trim_id}
                  sourceSurface={sourceSurface}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-xl)] bg-surface-dark-elevated p-3 shadow-[var(--shadow-hero)]">
              <CarImage
                src={trim.image_url}
                alt={trim.display_name}
                brandName={brandName}
                energyType={trim.energy_type}
                aspect="16/9"
                showEnergyBadge={false}
              />
            </div>
          </div>

          {(trim.power_hp || trim.range_km) && (
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border-on-dark pt-6 sm:grid-cols-3 lg:grid-cols-4">
              <Stat
                tone="dark"
                label="Enerji"
                value={trim.energy_type}
                hint={ENERGY_LABEL[trim.energy_type]}
              />
              {trim.power_hp ? (
                <Stat
                  tone="dark"
                  label="Güc"
                  value={`${trim.power_hp}`}
                  hint="at gücü"
                />
              ) : null}
              {trim.range_km ? (
                <Stat
                  tone="dark"
                  label="Yürüş"
                  value={`${trim.range_km}`}
                  hint="km diapazon"
                />
              ) : null}
              <Stat tone="dark" label="İl" value={String(trim.year)} />
            </div>
          )}
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <div className="flex flex-col gap-8">
            <Card padding="md" tone="raised" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
                  Tez əməliyyatlar
                </span>
                <p className="text-sm text-foreground-muted">
                  Bu maşını saxla və ya digər maşınlarla müqayisə et.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <div className="flex flex-col items-start gap-0.5">
                  <Button variant="secondary" size="md" disabled>
                    Saxla
                  </Button>
                  <span className="text-[10px] uppercase tracking-wide text-foreground-muted">
                    Tezliklə
                  </span>
                </div>
                <div className="min-w-[12rem]">
                  <CompareToggleButton trimId={trim.trim_id} />
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              <SectionHeading
                eyebrow="Texniki məlumat"
                title="Texniki göstəricilər"
                subtitle="Trimə aid əsas xüsusiyyətlər."
              />
              <Card padding="lg" tone="raised">
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <SpecStat label="Marka" value={brandName} />
                  <SpecStat label="Model" value={trim.model_name} />
                  <SpecStat
                    label="Nəsil"
                    value={generation?.display_name ?? "—"}
                    hint={generation?.name}
                  />
                  <SpecStat label="Komplektasiya" value={trimSuffix || "—"} />
                  <SpecStat label="İl" value={String(trim.year)} />
                  <SpecStat
                    label="Enerji növü"
                    value={trim.energy_type}
                    hint={ENERGY_LABEL[trim.energy_type]}
                  />
                  <SpecStat
                    label="Güc"
                    value={trim.power_hp ? `${trim.power_hp}` : "—"}
                    hint={trim.power_hp ? "at gücü" : undefined}
                  />
                  {trim.range_km != null ? (
                    <SpecStat
                      label="Yürüş məsafəsi"
                      value={`${trim.range_km}`}
                      hint="km"
                    />
                  ) : null}
                </dl>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted" padding="md">
        <Container>
          <div className="flex flex-col gap-6" id="sorgu">
            <SectionHeading
              eyebrow="Qiymət"
              title="Ən yaxşı təklif"
              subtitle="Hər təklif üçün mənbə və yoxlama statusu göstərilir."
            />

            {bestPrice ? (
              <BestPriceHero
                price={bestPrice}
                trimId={trim.trim_id}
                sourceSurface={sourceSurface}
              />
            ) : (
              <EmptyState
                title="Qiymət məlumatı yoxdur"
                note="Bu trim üçün hələ ki, qiymət qeydi mövcud deyil."
              />
            )}

            {otherPrices.length > 0 ? (
              <div className="flex flex-col gap-4">
                <SectionHeading
                  eyebrow="Digər mənbələr"
                  title="Bütün qiymət qeydləri"
                />
                <ul className="grid gap-4 md:grid-cols-2">
                  {otherPrices.map((p, i) => (
                    <li key={`${p.trim_id}-${p.offer_id ?? p.status}-${i}`}>
                      <PriceCard price={p} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Container>
      </Section>
    </>
  );
}

function SpecStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wide text-foreground-muted">
        {label}
      </dt>
      <dd className="text-base font-semibold leading-tight text-foreground">
        {value}
      </dd>
      {hint ? (
        <dd className="text-xs text-foreground-muted">{hint}</dd>
      ) : null}
    </div>
  );
}

function BestPriceHero({
  price,
  trimId,
  sourceSurface,
}: {
  price: PriceRecord;
  trimId: string;
  sourceSurface: LeadSourceSurface;
}) {
  const showAmount = hasRenderableAmount(price.status) && price.amount > 0;
  const showValidUntil =
    hasDealerValidity(price.status) && price.valid_until != null;
  const hasPdf =
    typeof price.signed_pdf_url === "string" && price.signed_pdf_url.length > 0;

  return (
    <Card padding="lg" tone="raised" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[price.status]} size="md">
              {STATUS_LABEL[price.status]}
            </Badge>
            <Badge tone={VERIFICATION_TONE[price.verification_status]} size="md">
              {VERIFICATION_LABEL[price.verification_status]}
            </Badge>
          </div>
          {showAmount ? (
            <p className="text-3xl font-semibold text-foreground md:text-4xl">
              {formatPrice(price.amount, price.currency)}
            </p>
          ) : (
            <p className="text-2xl font-semibold text-foreground-muted">
              {price.status === "not_available" ? "—" : "Qiymət soruş"}
            </p>
          )}
          <p className="text-sm text-foreground-muted">
            {price.dealer_id ? (
              <Link
                href={ROUTES.dealer(price.dealer_id)}
                className="font-medium text-accent-blue underline-offset-2 hover:underline"
              >
                {price.source_name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {price.source_name}
              </span>
            )}
            <span className="ml-1 text-foreground-muted">
              ({SOURCE_LABEL[price.source_type]})
            </span>
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:max-w-sm">
          <LeadFormLauncher trimId={trimId} sourceSurface={sourceSurface} />
          {hasPdf ? (
            <ButtonLink
              href={price.signed_pdf_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="md"
              fullWidth
            >
              <span aria-hidden>↧</span>
              PDF təklif
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            Mənbə
          </dt>
          <dd className="text-sm font-medium text-foreground">
            {SOURCE_LABEL[price.source_type]}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            Yenilənib
          </dt>
          <dd className="text-sm font-medium text-foreground">
            {formatDate(price.last_updated)}
          </dd>
        </div>
        {showValidUntil && price.valid_until ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-foreground-muted">
              Etibarlıdır
            </dt>
            <dd className="text-sm font-medium text-foreground">
              {formatDate(price.valid_until)}
            </dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}
