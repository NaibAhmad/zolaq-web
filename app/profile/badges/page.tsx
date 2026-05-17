"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError, apiGet } from "@/lib/api";
import { ROUTES, otpHref } from "@/lib/routes";

type BadgeRow = {
  badge_id: string;
  name: string;
  description: string;
  trigger_hint: string;
  earned: boolean;
  granted_at: number | null;
};

type Response = {
  badges: BadgeRow[];
  points: number;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; data: Response };

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function ProfileBadgesPage() {
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<Response>("/api/profile/badges")
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({ purpose: "profile_access", next: "/profile/badges" }),
          );
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
  }, [reloadKey, router]);

  if (state.status === "loading") {
    return <LoadingState label="Nişanlar yüklənir…" />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title="Nişanlar yüklənmədi"
        message={state.message}
        code={state.code}
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }
  const { data } = state;
  const earned = data.badges.filter((b) => b.earned);
  const locked = data.badges.filter((b) => !b.earned);
  return (
    <>
      <Section tone="muted" padding="sm">
        <Container size="narrow">
          <SectionHeading
            eyebrow="Profil"
            title="Nişanlarım"
            subtitle="Yalnız sənin görə bildiyin nişanlar. Açıq profil və ya reytinq yoxdur."
            action={{ label: "Tarixçə", href: ROUTES.profileHistory }}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge tone="blue" size="md">
              {earned.length} / {data.badges.length} nişan
            </Badge>
            <Badge tone="orange" size="md">
              {data.points} bal
            </Badge>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-8">
          {earned.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
                Qazandın
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {earned.map((b) => (
                  <li key={b.badge_id}>
                    <Card padding="md" tone="raised">
                      <p className="text-sm font-semibold text-foreground">
                        {b.name}
                      </p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {b.description}
                      </p>
                      {b.granted_at ? (
                        <p className="mt-2 text-[11px] text-foreground-muted">
                          {DATE_FMT.format(b.granted_at)}
                        </p>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {locked.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                Hələ açılmayıb
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {locked.map((b) => (
                  <li key={b.badge_id}>
                    <Card padding="md" tone="raised" className="opacity-80">
                      <p className="text-sm font-semibold text-foreground">
                        {b.name}
                      </p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {b.description}
                      </p>
                      <p className="mt-2 text-[11px] text-accent-blue">
                        İpucu: {b.trigger_hint}
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
