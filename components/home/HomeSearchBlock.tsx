"use client";

import { Suspense } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { QuickSearch } from "@/components/catalog/QuickSearch";
import { useT } from "@/lib/i18n/client";

export function HomeSearchBlock() {
  const t = useT();
  return (
    <Card padding="lg" tone="raised" className="-mt-12 lg:-mt-16">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="orange" size="sm">
            {t("home.quickSearchEyebrow")}
          </Badge>
          <h2 className="text-xl font-semibold text-foreground">
            {t("home.quickSearchTitle")}
          </h2>
        </div>
        <Suspense fallback={null}>
          <QuickSearch mode="navigate" />
        </Suspense>
      </div>
    </Card>
  );
}
