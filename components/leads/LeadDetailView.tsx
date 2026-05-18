"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LeadNextActionCard } from "@/components/leads/LeadNextActionCard";
import { LeadStatusHero } from "@/components/leads/LeadStatusHero";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { NotFoundState } from "@/components/state/NotFoundState";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import { formatPrice } from "@/lib/cars/format";
import { formatDateAz, formatDateTimeAz } from "@/lib/format/date";
import { BRANDS } from "@/lib/cars/seed";
import type { PriceRecord, Trim } from "@/lib/cars/types";
import {
  DEALER_VERIFICATION_LABEL_AZ,
  DEALER_VERIFICATION_TONE,
} from "@/lib/dealers/labels";
import type { Dealer } from "@/lib/dealers/types";
import {
  LEAD_ACTION_TO_STATE,
  SECONDARY_ACTION_LABELS,
  getLeadPrimaryCta,
  type LeadCtaActionKey,
} from "@/lib/leads/cta";
import { canTransition } from "@/lib/leads/state-machine";
import type {
  Lead,
  LeadState,
  LeadTimelineEvent,
} from "@/lib/leads/types";
import { ROUTES, otpHref } from "@/lib/routes";
import { trackEvent } from "@/lib/tracking/track";

type Props = { leadId: string };

type FetchState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string; code: string }
  | {
      status: "ready";
      lead: Lead;
      timeline: LeadTimelineEvent[];
      trim: Trim | null;
      bestOffer: PriceRecord | null;
      dealer: Dealer | null;
    };

const CONTACT_LABEL: Record<"phone" | "whatsapp", string> = {
  phone: "Zəng",
  whatsapp: "WhatsApp",
};

const SECONDARY_ELIGIBLE: readonly Exclude<
  LeadCtaActionKey,
  "open-whatsapp"
>[] = [
  "request-test-drive",
  "request-second-offer",
  "whatsapp-handoff",
  "close",
];

function deriveTrimSuffix(
  displayName: string,
  brandName: string,
  modelName: string,
): string {
  const head = `${brandName} ${modelName}`;
  if (displayName.startsWith(head)) return displayName.slice(head.length).trim();
  if (displayName.startsWith(modelName))
    return displayName.slice(modelName.length).trim();
  return displayName;
}

function pickBestOffer(prices: PriceRecord[]): PriceRecord | null {
  const officialOffers = prices.filter(
    (p) => p.status === "dealer_official_offer",
  );
  if (officialOffers.length > 0) {
    return officialOffers
      .slice()
      .sort((a, b) => a.amount - b.amount)[0];
  }
  const pending = prices.filter((p) => p.status === "dealer_quote_pending");
  if (pending.length > 0) return pending[0];
  const expired = prices.filter((p) => p.status === "expired_offer");
  if (expired.length > 0) return expired[0];
  return null;
}

export function LeadDetailView({ leadId }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [actionInFlight, setActionInFlight] =
    useState<LeadCtaActionKey | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const brandLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of BRANDS) map.set(b.brand_id, b.name);
    return map;
  }, []);

  const load = useCallback(
    async (signal: { cancelled: boolean }) => {
      try {
        const data = await apiGet<{
          lead: Lead;
          timeline: LeadTimelineEvent[];
        }>(`/api/profile/leads/${encodeURIComponent(leadId)}`);

        let trim: Trim | null = null;
        let bestOffer: PriceRecord | null = null;
        let dealer: Dealer | null = null;

        try {
          const trimRes = await apiGet<{ trim: Trim }>(
            `/api/cars/${encodeURIComponent(data.lead.trim_id)}`,
          );
          trim = trimRes.trim;
        } catch {
          trim = null;
        }

        try {
          const pricesRes = await apiGet<{ prices: PriceRecord[] }>(
            `/api/cars/${encodeURIComponent(data.lead.trim_id)}/prices`,
          );
          bestOffer = pickBestOffer(pricesRes.prices);
        } catch {
          bestOffer = null;
        }

        if (bestOffer?.dealer_id) {
          try {
            const dealerRes = await apiGet<{ dealer: Dealer }>(
              `/api/dealers/${encodeURIComponent(bestOffer.dealer_id)}`,
            );
            dealer = dealerRes.dealer;
          } catch {
            dealer = null;
          }
        }

        if (signal.cancelled) return;
        setState({
          status: "ready",
          lead: data.lead,
          timeline: data.timeline,
          trim,
          bestOffer,
          dealer,
        });
      } catch (err) {
        if (signal.cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({
              purpose: "profile_access",
              next: ROUTES.profileLead(leadId),
            }),
          );
          return;
        }
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
      }
    },
    [leadId, router],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void (async () => {
      await load(signal);
    })();
    return () => {
      signal.cancelled = true;
    };
  }, [load, reloadKey]);

  function reload() {
    setState({ status: "loading" });
    setActionError(null);
    setReloadKey((k) => k + 1);
  }

  const runAction = useCallback(
    async (action: LeadCtaActionKey) => {
      if (action === "open-whatsapp") {
        trackEvent("whatsapp_clicked", {
          surface: "lead_detail",
          lead_id: leadId,
        });
        // External handoff page hosts the actual wa.me redirect.
        router.push(ROUTES.profileLeadWhatsapp(leadId));
        return;
      }
      setActionInFlight(action);
      setActionError(null);
      if (action === "whatsapp-handoff") {
        trackEvent("whatsapp_clicked", {
          surface: "lead_detail",
          lead_id: leadId,
        });
      }
      try {
        await apiPost(
          `/api/profile/leads/${encodeURIComponent(leadId)}/${action}`,
        );
        reload();
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Əməliyyat alınmadı.";
        setActionError(message);
      } finally {
        setActionInFlight(null);
      }
    },
    [leadId, router],
  );

  if (state.status === "loading") {
    return <LoadingState label="Sorğu yüklənir…" />;
  }
  if (state.status === "not_found") {
    return (
      <NotFoundState
        title="Sorğu tapılmadı"
        note="Bu sorğu mövcud deyil və ya silinib."
      />
    );
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Sorğu yüklənmədi"
        message={state.message}
        code={state.code}
        onRetry={reload}
      />
    );
  }

  const { lead, timeline, trim, bestOffer, dealer } = state;
  const brandName = trim
    ? (brandLookup.get(trim.brand_id) ?? trim.brand_id)
    : "—";
  const modelName = trim?.model_name ?? "—";
  const trimSuffix = trim
    ? deriveTrimSuffix(trim.display_name, brandName, trim.model_name)
    : "";

  const cta = getLeadPrimaryCta(lead.state, {
    preferredContact: lead.preferred_contact,
  });

  const secondaryActions: Exclude<LeadCtaActionKey, "open-whatsapp">[] =
    SECONDARY_ELIGIBLE.filter((action) => {
      if (cta?.action === action) return false;
      return canTransition(lead.state, LEAD_ACTION_TO_STATE[action]);
    });

  return (
    <>
      <LeadStatusHero
        lead={lead}
        backHref={ROUTES.profileLeads}
        backLabel="Sorğulara qayıt"
        brandName={brandName}
        modelName={modelName}
        trimTitle={trim ? trimSuffix || trim.display_name : lead.trim_id}
        meta={trim ? `${trim.year} · ${trim.energy_type}` : undefined}
        hint={
          lead.state === "submitted"
            ? "Diler adətən 1–2 saata cavab verir."
            : undefined
        }
      />

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-6">
          {cta ? (
            <LeadNextActionCard
              cta={cta}
              pending={actionInFlight === cta.action}
              onAction={() => {
                if (cta.action) void runAction(cta.action);
              }}
            />
          ) : (
            <ClosedNotice state={lead.state} />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <DealerSummaryCard dealer={dealer} leadState={lead.state} />
            <OfferSummaryCard offer={bestOffer} leadState={lead.state} />
          </div>

          {(lead.name || lead.preferred_contact || lead.note) && (
            <Card padding="lg" tone="raised">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Sorğu məlumatları
              </p>
              <dl className="mt-3 grid gap-y-3 text-sm">
                {lead.name ? (
                  <div className="flex flex-wrap items-center gap-x-3">
                    <dt className="text-foreground-muted">Ad:</dt>
                    <dd className="font-medium text-foreground">{lead.name}</dd>
                  </div>
                ) : null}
                {lead.preferred_contact ? (
                  <div className="flex flex-wrap items-center gap-x-3">
                    <dt className="text-foreground-muted">Əlaqə üsulu:</dt>
                    <dd>
                      <Badge
                        tone={
                          lead.preferred_contact === "whatsapp"
                            ? "success"
                            : "blue"
                        }
                      >
                        {CONTACT_LABEL[lead.preferred_contact]}
                      </Badge>
                    </dd>
                  </div>
                ) : null}
                {lead.note ? (
                  <div className="flex flex-wrap gap-x-3">
                    <dt className="text-foreground-muted">Qeyd:</dt>
                    <dd className="text-foreground">{lead.note}</dd>
                  </div>
                ) : null}
              </dl>
            </Card>
          )}

          <SubPageLinks lead={lead} />

          {secondaryActions.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {secondaryActions.map((action) => (
                <Button
                  key={action}
                  variant={
                    action === "whatsapp-handoff"
                      ? "whatsapp"
                      : action === "close"
                        ? "secondary"
                        : "ghost"
                  }
                  size="sm"
                  disabled={actionInFlight !== null}
                  onClick={() => void runAction(action)}
                >
                  {actionInFlight === action
                    ? "Göndərilir…"
                    : SECONDARY_ACTION_LABELS[action]}
                </Button>
              ))}
            </div>
          ) : null}

          {actionError ? (
            <p
              role="alert"
              className="rounded-[var(--radius)] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
            >
              {actionError}
            </p>
          ) : null}
        </Container>
      </Section>

      <Section tone="muted" padding="md">
        <Container size="narrow" className="space-y-6">
          <SectionHeading
            eyebrow="Tarixçə"
            title="Sorğu mərhələləri"
            subtitle="Sorğunun hansı mərhələdə olduğunu və əvvəlki addımları gör."
          />
          <LeadTimeline state={lead.state} events={timeline} />
          <p className="text-xs text-foreground-muted">
            Yaradılıb: {formatDateTimeAz(lead.created_at)} · Son yenilənmə:{" "}
            {formatDateAz(lead.updated_at)}
          </p>
        </Container>
      </Section>
    </>
  );
}

function ClosedNotice({ state }: { state: LeadState }) {
  const message =
    state === "accepted"
      ? "Sorğu qəbul edilib. Sənədlər diler tərəfindən hazırlanır."
      : "Bu sorğu bağlanıb. Yeni təklif üçün maşına qayıd və yenidən sorğu göndər.";
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface-muted p-5 text-sm text-foreground-soft">
      {message}
    </div>
  );
}

function DealerSummaryCard({
  dealer,
  leadState,
}: {
  dealer: Dealer | null;
  leadState: LeadState;
}) {
  if (!dealer) {
    const note =
      leadState === "submitted" || leadState === "draft"
        ? "Diler hələ təyin olunmayıb."
        : "Diler məlumatı mövcud deyil.";
    return (
      <Card padding="md" tone="muted">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Diler
        </p>
        <p className="mt-2 text-sm text-foreground-soft">{note}</p>
      </Card>
    );
  }
  return (
    <Card as="article" padding="md" tone="light">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Diler
      </p>
      <div className="mt-2 flex flex-col gap-2">
        <Link
          href={ROUTES.dealer(dealer.dealer_id)}
          className="text-sm font-semibold text-accent-blue underline-offset-2 hover:underline"
        >
          {dealer.display_name}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              DEALER_VERIFICATION_TONE[dealer.verification_status]
            }`}
          >
            {DEALER_VERIFICATION_LABEL_AZ[dealer.verification_status]}
          </span>
          <span className="text-xs text-foreground-muted">{dealer.city}</span>
        </div>
        <p className="text-xs text-foreground-muted">
          Cavab müddəti: ≤ {dealer.response_sla_hours} saat
        </p>
      </div>
    </Card>
  );
}

function OfferSummaryCard({
  offer,
  leadState,
}: {
  offer: PriceRecord | null;
  leadState: LeadState;
}) {
  if (!offer || leadState === "submitted" || leadState === "draft") {
    const note =
      leadState === "expired"
        ? "Bu təklifin müddəti bitib. Yenilənmə istə."
        : leadState === "no_response"
          ? "Diler vaxtında cavab vermədi."
          : "Rəsmi təklif gözlənilir.";
    return (
      <Card padding="md" tone="muted">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Təklif
        </p>
        <p className="mt-2 text-sm text-foreground-soft">{note}</p>
      </Card>
    );
  }

  const expired = offer.status === "expired_offer";

  return (
    <Card as="article" padding="md" tone="light">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Təklif
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span
          className={`text-2xl font-semibold leading-tight ${
            expired ? "text-foreground-muted line-through" : "text-foreground"
          }`}
        >
          {formatPrice(offer.amount, offer.currency)}
        </span>
        <Badge tone={expired ? "warning" : "success"} size="sm">
          {expired ? "Müddət bitib" : "Rəsmi"}
        </Badge>
      </div>
      <dl className="mt-3 grid gap-y-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-foreground-muted">Mənbə</dt>
          <dd className="font-medium text-foreground">{offer.source_name}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-foreground-muted">Yenilənib</dt>
          <dd className="text-foreground">
            {formatDateIso(offer.last_updated)}
          </dd>
        </div>
        {offer.valid_until ? (
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Etibarlıdır</dt>
            <dd className="text-foreground">
              {formatDateIso(offer.valid_until)}
            </dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
}

function SubPageLinks({ lead }: { lead: Lead }) {
  const showTestDrive =
    lead.state === "test_drive_requested" ||
    lead.state === "test_drive_confirmed";
  const showWhatsapp = lead.state === "whatsapp_handoff";
  if (!showTestDrive && !showWhatsapp) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {showTestDrive ? (
        <ButtonLink
          href={ROUTES.profileLeadTestDrive(lead.lead_id)}
          variant="secondary"
          size="sm"
        >
          Test-sürüş statusu →
        </ButtonLink>
      ) : null}
      {showWhatsapp ? (
        <ButtonLink
          href={ROUTES.profileLeadWhatsapp(lead.lead_id)}
          variant="whatsapp"
          size="sm"
        >
          WhatsApp keçidi →
        </ButtonLink>
      ) : null}
    </div>
  );
}

function formatDateIso(iso: string): string {
  return formatDateAz(iso);
}
