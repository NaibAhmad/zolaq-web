"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { DealerOfferCard } from "@/components/dealers/DealerOfferCard";
import { DealerTrustSummary } from "@/components/dealers/DealerTrustSummary";
import { DealerVerificationBadge } from "@/components/dealers/DealerVerificationBadge";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { NotFoundState } from "@/components/state/NotFoundState";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Stat } from "@/components/ui/Stat";
import { DEALER_VERIFICATION_LABEL_AZ } from "@/lib/dealers/labels";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS, TRIMS } from "@/lib/cars/seed";
import { ROUTES } from "@/lib/routes";
import type { PriceRecord } from "@/lib/cars/types";
import type { Dealer } from "@/lib/dealers/types";

type Props = {
  dealerId: string;
};

type FetchState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; dealer: Dealer; offers: PriceRecord[] };

export function DealerProfile({ dealerId }: Props) {
  return (
    <Suspense fallback={<LoadingState label="Diler yüklənir…" />}>
      <DealerProfileInner dealerId={dealerId} />
    </Suspense>
  );
}

function DealerProfileInner({ dealerId }: Props) {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const brandLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS) map.set(b.brand_id, b.name);
    return map;
  }, []);

  const trimLookup = useMemo(() => {
    const map = new Map<string, { name: string; brand: string }>();
    for (const t of TRIMS)
      map.set(t.trim_id, { name: t.display_name, brand: t.brand_id });
    return map;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = encodeURIComponent(dealerId);
    Promise.all([
      apiGet<{ dealer: Dealer }>(`/api/dealers/${id}`),
      apiGet<{ offers: PriceRecord[] }>(`/api/dealers/${id}/offers`),
    ])
      .then(([dealerRes, offersRes]) => {
        if (cancelled) return;
        setState({
          status: "ready",
          dealer: dealerRes.dealer,
          offers: offersRes.offers,
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
  }, [dealerId, reloadKey]);

  function retry() {
    setState({ status: "loading" });
    setReloadKey((k) => k + 1);
  }

  if (state.status === "loading") {
    return <LoadingState label="Diler yüklənir…" />;
  }

  if (state.status === "not_found") {
    return (
      <NotFoundState
        title="Diler tapılmadı"
        note="Bu diler mövcud deyil və ya silinib."
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

  const { dealer, offers } = state;

  return (
    <>
      <Section tone="dark" padding="md">
        <Container>
          <nav className="mb-6 text-sm">
            <Link
              href={ROUTES.dealers}
              className="text-on-dark-muted underline-offset-2 hover:text-on-dark hover:underline"
            >
              ← Dilerlərə qayıt
            </Link>
          </nav>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <DealerVerificationBadge
                status={dealer.verification_status}
                variant="on-dark"
                size="md"
              />
              <Badge tone="on-dark" size="md">
                {dealer.city}
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold text-on-dark md:text-4xl">
              {dealer.display_name}
            </h1>
            <p className="max-w-2xl text-on-dark-muted">
              {dealer.legal_name}
            </p>

            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat
                tone="dark"
                label="Status"
                value={DEALER_VERIFICATION_LABEL_AZ[dealer.verification_status]}
              />
              <Stat
                tone="dark"
                label="Cavab müddəti"
                value={`~${dealer.response_sla_hours} saat`}
              />
              <Stat
                tone="dark"
                label="Xidmət"
                value={dealer.services.length}
                hint={dealer.services.length === 0 ? "—" : undefined}
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <DealerTrustSummary dealer={dealer} brandLookup={brandLookup} />
        </Container>
      </Section>

      <Section tone="muted" padding="md">
        <Container>
          <SectionHeading
            eyebrow="Təkliflər"
            title="Diler təklifləri"
            subtitle="Bu dilerin aktiv qiymət təklifləri."
          />
          <div className="mt-6">
            {offers.length === 0 ? (
              <EmptyState
                title="Təklif yoxdur"
                note="Bu diler üçün hələ ki aktiv təklif mövcud deyil."
                action={
                  <ButtonLink href={ROUTES.cars} variant="primary">
                    Bütün maşınlara bax
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {offers.map((o, i) => {
                  const trim = trimLookup.get(o.trim_id);
                  const brandName = trim
                    ? brandLookup.get(trim.brand) ?? trim.brand
                    : undefined;
                  return (
                    <li
                      key={o.offer_id ?? `${o.trim_id}-${i}`}
                      className="flex"
                    >
                      <DealerOfferCard
                        offer={o}
                        trimName={trim?.name}
                        brandName={brandName}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
