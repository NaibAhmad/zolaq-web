"use client";

// Sprint 10H-UX: labeled sponsored placement card. Reads active rows from
// /api/ads/active?area=... and renders the first one with a visible label.
// If no active rows exist, renders a clearly-labeled "Demo reklam yeri"
// placeholder so the founder can see where ads land. Never imitates an
// official price, dealer verification, or CTA.

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { apiGet } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import type { AdPlacementArea } from "@/lib/ads/types";

type Placement = {
  ad_request_id: string;
  label: "Sponsorlu" | "Reklam" | "Premium" | null;
  package_type: string;
  campaign_note: string | null;
};

type Props = {
  area: AdPlacementArea;
  variant?: "card" | "strip";
};

type FetchState =
  | { status: "loading" }
  | { status: "ready"; placement: Placement | null }
  | { status: "error" };

export function SponsoredSlot({ area, variant = "card" }: Props) {
  const t = useT();
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    apiGet<{ placements: Placement[] }>(
      `/api/ads/active?area=${encodeURIComponent(area)}`,
    )
      .then((res) => {
        if (cancelled) return;
        const first = res.placements.find((p) => p.label !== null) ?? null;
        setState({ status: "ready", placement: first });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [area]);

  if (state.status === "loading" || state.status === "error") {
    return null;
  }

  const { placement } = state;
  const label = placement?.label ?? t("ads.demoSlot");
  const tone = placement ? "orange" : "muted";
  const note = placement?.campaign_note ?? t("ads.slotPlaceholderBody");

  const padding = variant === "strip" ? "md" : "lg";

  return (
    <Card
      padding={padding}
      tone="raised"
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge tone={tone} size="sm">
            {label}
          </Badge>
          <span className="text-[11px] uppercase tracking-wide text-foreground-muted">
            {t("ads.sponsoredPlacement")}
          </span>
        </div>
        <p className="text-sm text-foreground">{note}</p>
      </div>
      <span className="text-[11px] text-foreground-muted">
        {t("ads.notOfficialQuote")}
      </span>
    </Card>
  );
}
