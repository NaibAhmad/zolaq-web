"use client";

import { Suspense } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { QuickSearch } from "@/components/catalog/QuickSearch";
import { FEATURE_I18N_BETA } from "@/lib/env";
import { useT } from "@/lib/i18n/client";

const STATIC_EYEBROW = "Sürətli axtarış";
const STATIC_TITLE = "Maşın seç və müqayisə et";

export function HomeSearchBlock() {
  return (
    <Card padding="lg" tone="raised" className="-mt-12 lg:-mt-16">
      <div className="flex flex-col gap-4">
        {FEATURE_I18N_BETA ? <HeadingI18n /> : <HeadingStatic />}
        <Suspense fallback={null}>
          <QuickSearch mode="navigate" />
        </Suspense>
      </div>
    </Card>
  );
}

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="orange" size="sm">
        {eyebrow}
      </Badge>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function HeadingStatic() {
  return <Heading eyebrow={STATIC_EYEBROW} title={STATIC_TITLE} />;
}

function HeadingI18n() {
  const t = useT();
  return (
    <Heading
      eyebrow={t("home.quickSearchEyebrow")}
      title={t("home.quickSearchTitle")}
    />
  );
}
