"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadStatusHero } from "@/components/leads/LeadStatusHero";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { NotFoundState } from "@/components/state/NotFoundState";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError, apiGet } from "@/lib/api";
import { BRANDS } from "@/lib/cars/seed";
import type { Trim } from "@/lib/cars/types";
import type {
  Lead,
  LeadTimelineEvent,
} from "@/lib/leads/types";
import { ROUTES, otpHref } from "@/lib/routes";

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

export function TestDriveStatusView({ leadId }: Props) {
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
              next: ROUTES.profileLeadTestDrive(leadId),
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
  }, [load]);

  if (state.status === "loading") return <LoadingState label="Status yüklənir…" />;
  if (state.status === "not_found")
    return (
      <NotFoundState
        title="Sorğu tapılmadı"
        note="Bu sorğu mövcud deyil və ya silinib."
      />
    );
  if (state.status === "error")
    return (
      <ErrorState
        title="Status yüklənmədi"
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

  return (
    <>
      <LeadStatusHero
        lead={lead}
        backHref={ROUTES.profileLead(lead.lead_id)}
        backLabel="Sorğuya qayıt"
        brandName={brandName}
        modelName={modelName}
        trimTitle={trim ? trimSuffix || trim.display_name : lead.trim_id}
        meta={trim ? `${trim.year} · ${trim.energy_type}` : undefined}
      />

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-6">
          <TestDriveBody lead={lead} />
        </Container>
      </Section>

      <Section tone="muted" padding="md">
        <Container size="narrow" className="space-y-6">
          <SectionHeading
            eyebrow="Tarixçə"
            title="Sorğu mərhələləri"
          />
          <LeadTimeline state={lead.state} events={timeline} />
        </Container>
      </Section>
    </>
  );
}

function TestDriveBody({ lead }: { lead: Lead }) {
  if (lead.state === "test_drive_requested") {
    return (
      <Card padding="lg" tone="raised" className="border-l-4 border-l-accent-blue">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-blue">
          Test-sürüş sorğusu
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Diler təsdiqini gözləyirik
        </h2>
        <p className="mt-2 text-sm text-foreground-soft">
          Test-sürüş istəyin dilerə göndərildi. Diler 1 iş günü ərzində səninlə
          əlaqə saxlayacaq və vaxt təklif edəcək. Test-sürüş yalnız diler
          təsdiqindən sonra rəsmiləşir.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-foreground-soft">
          <li className="flex items-start gap-2">
            <span aria-hidden className="text-accent-blue">•</span>
            <span>Diler vaxtı və yeri WhatsApp və ya zəng ilə təklif edir.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="text-accent-blue">•</span>
            <span>Vaxtla razıyam dedikdən sonra status “Təsdiq olundu” olur.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="text-accent-blue">•</span>
            <span>Bu addım pulsuzdur və heç bir öhdəlik yaratmır.</span>
          </li>
        </ul>
        <div className="mt-5">
          <ButtonLink
            href={ROUTES.profileLead(lead.lead_id)}
            variant="secondary"
            size="sm"
          >
            Sorğu detalı →
          </ButtonLink>
        </div>
      </Card>
    );
  }

  if (lead.state === "test_drive_confirmed") {
    return (
      <Card padding="lg" tone="raised" className="border-l-4 border-l-success">
        <p className="text-xs font-semibold uppercase tracking-wide text-success">
          Test-sürüş
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Təsdiqləndi
        </h2>
        <p className="mt-2 text-sm text-foreground-soft">
          Diler test-sürüş üçün vaxt və yer təsdiq etdi. Növbəti addım: razılaşdırılmış
          vaxtda diler ilə görüş.
        </p>
        <div className="mt-5">
          <ButtonLink
            href={ROUTES.profileLead(lead.lead_id)}
            variant="secondary"
            size="sm"
          >
            Sorğu detalı →
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" tone="muted">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Test-sürüş
      </p>
      <h2 className="mt-2 text-xl font-semibold text-foreground">
        Bu sorğu test-sürüş mərhələsində deyil
      </h2>
      <p className="mt-2 text-sm text-foreground-soft">
        Test-sürüş yalnız rəsmi təklif gəldikdən sonra mümkündür. Sorğunun cari
        vəziyyətini görmək üçün sorğu detalına qayıt.
      </p>
      <div className="mt-5">
        <ButtonLink
          href={ROUTES.profileLead(lead.lead_id)}
          variant="primary"
          size="sm"
        >
          Sorğu detalı →
        </ButtonLink>
      </div>
    </Card>
  );
}
