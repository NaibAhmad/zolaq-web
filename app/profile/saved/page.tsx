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
import type { SavedCarWithTrim } from "@/lib/decisions/types";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string; code: string }
  | { status: "ready"; saved: SavedCarWithTrim[] };

export default function ProfileSavedPage() {
  const router = useRouter();
  const t = useT();
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ saved: SavedCarWithTrim[] }>("/api/profile/saved")
      .then((data) => {
        if (!cancelled) setState({ status: "ready", saved: data.saved });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          router.replace(
            otpHref({ purpose: "profile_access", next: ROUTES.profileSaved }),
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
    return <LoadingState label={t("profileSaved.title")} />;
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
  if (state.saved.length === 0) {
    return (
      <EmptyState
        title={t("profileSaved.emptyTitle")}
        note={t("profileSaved.emptyNote")}
        action={
          <ButtonLink href={ROUTES.cars} variant="primary">
            {t("nav.cars")}
          </ButtonLink>
        }
      />
    );
  }

  const compareIds = state.saved.slice(0, 3).map((s) => s.trim_id).join(",");
  const canCompare = state.saved.length >= 2;
  const compareHref = canCompare ? `${ROUTES.compare}?ids=${compareIds}` : ROUTES.compare;

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container size="narrow">
          <SectionHeading
            eyebrow={t("nav.profile")}
            title={t("profileSaved.title")}
            subtitle={t("profileSaved.subtitle")}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge tone="blue" size="md">
              {t("profileSavedExtra.carsBadge", { count: state.saved.length })}
            </Badge>
            <ButtonLink
              href={compareHref}
              variant={canCompare ? "primary" : "secondary"}
              size="sm"
            >
              {t("profileSavedExtra.compareCta")}
            </ButtonLink>
          </div>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container size="narrow">
          <ul className="space-y-3">
            {state.saved.map((item) => (
              <li key={item.saved_id}>
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
                      dateTime={new Date(item.created_at).toISOString()}
                      className="text-xs text-foreground-muted"
                    >
                      {formatDateAz(item.created_at)}
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
