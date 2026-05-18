"use client";

// Sprint 10D: homepage VIN beta card. Renders only when
// NEXT_PUBLIC_FEATURE_VIN_BETA=true. CTA opens an in-place modal — no new
// public route, no provider call, no persistence.

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VinCheckBetaModal } from "@/components/vin/VinCheckBetaModal";
import { useT } from "@/lib/i18n/client";

export function HomeVinBetaCard() {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <>
      <Card padding="lg" tone="raised">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue" size="sm">
                {t("common.beta")}
              </Badge>
              <h2 className="text-xl font-semibold text-foreground">
                {t("vinBeta.cardTitle")}
              </h2>
            </div>
            <p className="max-w-2xl text-sm text-foreground-muted">
              {t("vin.cardBody")}
            </p>
          </div>
          <div className="md:shrink-0">
            <Button onClick={() => setOpen(true)} size="md">
              {t("vinBeta.cardCta")}
            </Button>
          </div>
        </div>
      </Card>
      <VinCheckBetaModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
