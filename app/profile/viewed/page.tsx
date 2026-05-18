"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ApiError, apiGet } from "@/lib/api";
import { formatDateAz } from "@/lib/format/date";
import { useT } from "@/lib/i18n/client";
import { ROUTES, otpHref } from "@/lib/routes";
import type { ViewedCarWithTrim } from "@/lib/decisions/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; viewed: ViewedCarWithTrim[] };

export default function ProfileViewedPage() {
  const router = useRouter();
  const t = useT();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ viewed: ViewedCarWithTrim[] }>("/api/profile/viewed")
      .then((data) => {
        if (!cancelled) setState({ status: "ready", viewed: data.viewed });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({ purpose: "profile_access", next: ROUTES.profileViewed }),
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
    return <LoadingState label={t("profileViewed.title")} />;
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
  if (state.viewed.length === 0) {
    return (
      <EmptyState
        title={t("profileViewed.emptyTitle")}
        note={t("profileViewed.emptyNote")}
        action={
          <ButtonLink href={ROUTES.cars} variant="primary">
            {t("nav.cars")}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container size="narrow">
          <SectionHeading
            eyebrow={t("nav.profile")}
            title={t("profileViewed.title")}
            subtitle={t("profileViewed.subtitle")}
          />
          <div className="mt-4">
            <Badge tone="blue" size="md">
              {t("profileViewedExtra.carsBadge", { count: state.viewed.length })}
            </Badge>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="narrow">
          <ul className="space-y-3">
            {state.viewed.map((item) => (
              <li key={item.viewed_id}>
                <Link href={ROUTES.car(item.trim_id)} className="block">
                  <Card
                    padding="md"
                    tone="raised"
                    interactive
                    className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-foreground-muted">
                        {item.trim.brand_name}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.trim.model_name} · {item.trim.year}
                      </p>
                      <p className="truncate text-xs text-foreground-muted">
                        {item.trim.display_name}
                      </p>
                    </div>
                    <time
                      dateTime={new Date(item.viewed_at).toISOString()}
                      className="text-xs text-foreground-muted"
                    >
                      {formatDateAz(item.viewed_at)}
                    </time>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
