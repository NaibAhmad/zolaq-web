// Sprint 10J: First 100 closed-beta invite card. Renders only when
// NEXT_PUBLIC_FEATURE_BETA_INVITE=true. If NEXT_PUBLIC_BETA_WAITLIST_URL is
// set, the CTA opens it in a new tab. If empty, the CTA falls back to a
// disabled "tezliklə aktiv olacaq" state. No backend, no PII, no new route.

import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BETA_WAITLIST_URL } from "@/lib/env";

export function HomeBetaInviteCard() {
  const waitlistUrl = BETA_WAITLIST_URL.trim();
  const hasWaitlist = waitlistUrl.length > 0;

  return (
    <Card padding="lg" tone="raised">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted" size="sm">
              Beta · Qapalı
            </Badge>
            <h2 className="text-xl font-semibold text-foreground">
              Zolaq Beta — ilk 100 istifadəçidən biri olun
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-foreground-muted">
            Avtomobil seçimi, müqayisə, VIN beta yoxlaması və diler təkliflərini
            ilk test edənlərdən olun.
          </p>
          <p className="text-xs text-foreground-muted">
            Qapalı beta · Məhdud yerlər · Geribildirim tələb olunur
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
              ariaLabel="Beta üçün qeydiyyat formasını yeni tabda açın"
            >
              Beta üçün qeydiyyat
            </ButtonLink>
          ) : (
            <Button
              size="md"
              variant="secondary"
              disabled
              aria-disabled="true"
            >
              Qeydiyyat linki tezliklə aktiv olacaq
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
