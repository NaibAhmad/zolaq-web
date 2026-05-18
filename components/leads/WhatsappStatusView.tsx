"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadStatusHero } from "@/components/leads/LeadStatusHero";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { NotFoundState } from "@/components/state/NotFoundState";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import type { Trim } from "@/lib/cars/types";
import { useT } from "@/lib/i18n/client";
import type {
  Lead,
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
    };

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

export function WhatsappStatusView({ leadId }: Props) {
  const t = useT();
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ status: "loading" });

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
        try {
          const trimRes = await apiGet<{ trim: Trim }>(
            `/api/cars/${encodeURIComponent(data.lead.trim_id)}`,
          );
          trim = trimRes.trim;
        } catch {
          trim = null;
        }
        if (signal.cancelled) return;
        setState({ status: "ready", lead: data.lead, timeline: data.timeline, trim });
      } catch (err) {
        if (signal.cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({
              purpose: "profile_access",
              next: ROUTES.profileLeadWhatsapp(leadId),
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
        const message = err instanceof Error ? err.message : t("errors.networkError");
        setState({ status: "error", message, code: "NETWORK" });
      }
    },
    [leadId, router, t],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void (async () => {
      await load(signal);
    })();
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  function openWhatsapp() {
    trackEvent("whatsapp_external_opened", {
      surface: "whatsapp_status",
      lead_id: leadId,
    });
    if (typeof window !== "undefined") {
      window.open("https://wa.me/", "_blank", "noopener,noreferrer");
    }
  }

  if (state.status === "loading") return <LoadingState label={t("leads.statusLoading")} />;
  if (state.status === "not_found")
    return (
      <NotFoundState
        title={t("leads.notFoundTitle")}
        note={t("leads.notFoundNote")}
      />
    );
  if (state.status === "error")
    return (
      <ErrorState
        title={t("leads.statusLoadFailed")}
        message={state.message}
        code={state.code}
      />
    );

  const { lead, timeline, trim } = state;
  const brandName = trim
    ? (brandLookup.get(trim.brand_id) ?? trim.brand_id)
    : "—";
  const modelName = trim?.model_name ?? "—";
  const trimSuffix = trim
    ? deriveTrimSuffix(trim.display_name, brandName, trim.model_name)
    : "";

  const isHandoff = lead.state === "whatsapp_handoff";

  return (
    <>
      <LeadStatusHero
        lead={lead}
        backHref={ROUTES.profileLead(lead.lead_id)}
        backLabel={t("leads.backToLead")}
        brandName={brandName}
        modelName={modelName}
        trimTitle={trim ? trimSuffix || trim.display_name : lead.trim_id}
        meta={trim ? `${trim.year} · ${trim.energy_type}` : undefined}
        hint={isHandoff ? t("leads.whatsappOutsideZolaq") : undefined}
      />

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-6">
          <Card padding="lg" tone="raised" className="border-l-4 border-l-accent-green">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-green text-accent-green-fg text-base"
              >
                ▶
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-success">
                  {t("leads.whatsappOutsideTransfer")}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">
                  {t("leads.whatsappOutsideTitle")}
                </h2>
                <p className="mt-2 text-sm text-foreground-soft">
                  {t("leads.whatsappOutsideBody")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="whatsapp" size="md" onClick={openWhatsapp}>
                    {t("leads.actionOpenWhatsapp")}
                  </Button>
                  <ButtonLink
                    href={ROUTES.profileLead(lead.lead_id)}
                    variant="secondary"
                    size="md"
                  >
                    {t("leads.viewRequestDetails")}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </Card>

          {!isHandoff ? (
            <Card padding="md" tone="muted">
              <p className="text-sm text-foreground-soft">
                {t("leads.notHandoffNote")}
              </p>
            </Card>
          ) : null}
        </Container>
      </Section>

      <Section tone="muted" padding="md">
        <Container size="narrow" className="space-y-6">
          <SectionHeading
            eyebrow={t("leadsTimeline.timelineTitle")}
            title={t("leadsTimeline.stagesAria")}
          />
          <LeadTimeline state={lead.state} events={timeline} showEventLog />
        </Container>
      </Section>
    </>
  );
}
