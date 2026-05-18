"use client";

// Sprint 10J: First 100 closed-beta invite card. Renders only when
// NEXT_PUBLIC_FEATURE_BETA_INVITE=true. If NEXT_PUBLIC_BETA_WAITLIST_URL is
// set, the CTA opens it in a new tab. If empty, the CTA falls back to a
// disabled "tezliklə aktiv olacaq" state. No backend, no PII, no new route.

import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BETA_WAITLIST_URL } from "@/lib/env";
import { useT } from "@/lib/i18n/client";

export function HomeBetaInviteCard() {
  const t = useT();
  const waitlistUrl = BETA_WAITLIST_URL.trim();
  const hasWaitlist = waitlistUrl.length > 0;

  return (
    <Card padding="lg" tone="raised">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted" size="sm">
              {t("betaInvite.statusBadge")}
            </Badge>
            <h2 className="text-xl font-semibold text-foreground">
              {t("betaInvite.title")}
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-foreground-muted">
            {t("betaInvite.body")}
          </p>
          <p className="text-xs text-foreground-muted">
            {t("betaInvite.note")}
          </p>
        </div>
        <div className="md:shrink-0">
          {hasWaitlist ? (
            <ButtonLink
              href={waitlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="md"
              variant="primary"
              ariaLabel={t("betaInvite.cta")}
            >
              {t("betaInvite.cta")}
            </ButtonLink>
          ) : (
            <Button
              size="md"
              variant="secondary"
              disabled
              aria-disabled="true"
            >
              {t("betaInvite.comingSoon")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
