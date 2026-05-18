"use client";

import { useSyncExternalStore } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  buildCompareHref,
  clearCompare,
  getCompareIds,
  subscribe,
} from "@/lib/compare/client-store";
import { useT } from "@/lib/i18n/client";

function getSnapshot(): string {
  return getCompareIds().join(",");
}

function getServerSnapshot(): string {
  return "";
}

export function CompareSelectionBar() {
  const t = useT();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = snapshot ? snapshot.split(",") : [];
  if (ids.length === 0) return null;

  const hint =
    ids.length < 2
      ? t("compare.minHint")
      : t("compare.readyHint", { count: ids.length });

  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-accent-blue/25 bg-accent-blue-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-accent-blue">
          {t("compare.selectedCount", { count: ids.length })}
        </span>
        <span className="text-xs text-foreground-muted">{hint}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => clearCompare()}>
          {t("compare.clear")}
        </Button>
        <ButtonLink href={buildCompareHref(ids)} variant="primary" size="sm">
          {t("compare.compareCta")}
        </ButtonLink>
      </div>
    </div>
  );
}
