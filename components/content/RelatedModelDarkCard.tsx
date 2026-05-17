"use client";

import Link from "next/link";
import { CarImage } from "@/components/catalog/CarImage";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import { trackEvent } from "@/lib/tracking/track";
import type { LeadTrimSummary } from "@/lib/leads/types";

type Props = {
  contentId: string;
  trim: LeadTrimSummary;
  reason: string;
  surface: "encyclopedia" | "content";
};

export function RelatedModelDarkCard({
  contentId,
  trim,
  reason,
  surface,
}: Props) {
  const carHref = `/cars/${encodeURIComponent(trim.trim_id)}?source=${
    surface === "encyclopedia" ? "encyclopedia" : "content"
  }`;
  const compareHref = ROUTES.compareWith([trim.trim_id]);

  function track(destination: string) {
    trackEvent("related_model_clicked", {
      content_id: contentId,
      trim_id: trim.trim_id,
    });
    trackEvent("cta_clicked", {
      cta_id: "related_model",
      surface,
      destination,
    });
  }

  return (
    <Card tone="dark" padding="lg" className="flex flex-col gap-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-on-dark-muted">
        Bağlı model
      </p>
      <h3 className="text-lg font-semibold text-on-dark">{trim.display_name}</h3>
      <CarImage
        src={trim.image_url}
        alt={`${trim.display_name} — Zolaq`}
        brandName={trim.brand_name}
        energyType={trim.energy_type}
        aspect="16/9"
        showEnergyBadge={false}
      />
      <p className="text-sm leading-6 text-on-dark-muted">{reason}</p>
      <div className="mt-1 flex flex-col gap-2">
        <Link
          href={carHref}
          onClick={() => track(carHref)}
          className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius)] bg-accent-orange px-4 text-sm font-semibold text-accent-orange-fg shadow-sm transition-all hover:brightness-110 active:brightness-95"
        >
          Modelə keç
        </Link>
        <Link
          href={compareHref}
          onClick={() => track(compareHref)}
          className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius)] border border-border-on-dark bg-white/5 px-4 text-sm font-medium text-on-dark transition-colors hover:bg-white/10"
        >
          Müqayisə et
        </Link>
      </div>
    </Card>
  );
}
