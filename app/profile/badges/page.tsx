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
import { formatDateAz } from "@/lib/format/date";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES, otpHref } from "@/lib/routes";

type BadgeRow = {
  badge_id: string;
  name: string;
  description: string;
  trigger_hint: string;
  name_key?: TranslationKey;
  description_key?: TranslationKey;
  hint_key?: TranslationKey;
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

export default function ProfileBadgesPage() {
  const router = useRouter();
  const t = useT();
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
        const message = err instanceof Error ? err.message : t("errors.networkError");
        setState({ status: "error", message, code: "NETWORK" });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, router, t]);

  if (state.status === "loading") {
    return <LoadingState label={t("profileBadges.title")} />;
  }
  if (state.status === "error") {
    return (
      <ErrorState
        title={t("errors.loadFailed")}
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
            eyebrow={t("nav.profile")}
            title={t("profileBadges.title")}
            subtitle={t("profileBadges.subtitle")}
            action={{
              label: t("profileBadgesExtra.historyLink"),
              href: ROUTES.profileHistory,
            }}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge tone="blue" size="md">
              {t("profileBadgesExtra.ratioBadge", {
                earned: earned.length,
                total: data.badges.length,
              })}
            </Badge>
            <Badge tone="orange" size="md">
              {t("profileBadgesExtra.pointsBadge", { points: data.points })}
            </Badge>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="narrow" className="space-y-8">
          {earned.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-orange">
                {t("profileBadgesExtra.earnedHeading")}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {earned.map((b) => (
                  <li key={b.badge_id}>
                    <Card padding="md" tone="raised">
                      <p className="text-sm font-semibold text-foreground">
                        {b.name_key ? t(b.name_key) : b.name}
                      </p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {b.description_key
                          ? t(b.description_key)
                          : b.description}
                      </p>
                      {b.granted_at ? (
                        <p className="mt-2 text-[11px] text-foreground-muted">
                          {formatDateAz(b.granted_at)}
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
                {t("profileBadgesExtra.lockedHeading")}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {locked.map((b) => (
                  <li key={b.badge_id}>
                    <Card padding="md" tone="raised" className="opacity-80">
                      <p className="text-sm font-semibold text-foreground">
                        {b.name_key ? t(b.name_key) : b.name}
                      </p>
                      <p className="mt-1 text-xs text-foreground-muted">
                        {b.description_key
                          ? t(b.description_key)
                          : b.description}
                      </p>
                      <p className="mt-2 text-[11px] text-accent-blue">
                        {t("profileBadgesExtra.tipPrefix")}:{" "}
                        {b.hint_key ? t(b.hint_key) : b.trigger_hint}
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
