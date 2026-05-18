"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useT } from "@/lib/i18n/client";
import { ROUTES } from "@/lib/routes";

export function HomeMarketPulseHeading() {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <SectionHeading
        eyebrow={t("bazar.badge")}
        title={t("home.marketPulseTitle")}
        subtitle={t("home.marketPulseSubtitle")}
      />
      <Link
        href={`${ROUTES.qa}?tab=bazar-nebzi`}
        className="inline-flex w-fit items-center text-sm font-medium text-accent-blue hover:underline"
      >
        {t("bazar.viewHistory")}
      </Link>
    </div>
  );
}
