"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import type { CompareEntry } from "./CompareTable";

type Props = {
  entries: CompareEntry[];
};

type Highlight = {
  trim_id: string;
  labelKey: TranslationKey;
  reasonKey: TranslationKey;
  reasonParams?: Record<string, string | number>;
};

function pickHighlights(entries: CompareEntry[]): Highlight[] {
  if (entries.length === 0) return [];

  const out: Highlight[] = [];

  let topPower = entries[0];
  for (const e of entries) {
    if ((e.trim.power_hp ?? 0) > (topPower.trim.power_hp ?? 0)) topPower = e;
  }
  if ((topPower.trim.power_hp ?? 0) > 0) {
    out.push({
      trim_id: topPower.trim.trim_id,
      labelKey: "compare.recMorePower",
      reasonKey: "compare.recMorePowerReason",
      reasonParams: { hp: topPower.trim.power_hp ?? 0 },
    });
  }

  let topRange = entries[0];
  for (const e of entries) {
    if ((e.trim.range_km ?? 0) > (topRange.trim.range_km ?? 0)) topRange = e;
  }
  if ((topRange.trim.range_km ?? 0) > 0) {
    out.push({
      trim_id: topRange.trim.trim_id,
      labelKey: "compare.recLongerRange",
      reasonKey: "compare.recLongerRangeReason",
      reasonParams: { km: topRange.trim.range_km ?? 0 },
    });
  }

  const cheapest = entries
    .filter((e) => e.bestPrice && e.bestPrice.amount > 0)
    .sort((a, b) => (a.bestPrice!.amount - b.bestPrice!.amount))[0];
  if (cheapest && !out.some((h) => h.trim_id === cheapest.trim.trim_id)) {
    out.push({
      trim_id: cheapest.trim.trim_id,
      labelKey: "compare.recCheapest",
      reasonKey: "compare.recCheapestReason",
    });
  }

  return out;
}

export function CompareRecommendation({ entries }: Props) {
  const t = useT();
  const highlights = pickHighlights(entries);
  if (highlights.length === 0) return null;

  const byId = new Map(entries.map((e) => [e.trim.trim_id, e]));

  return (
    <Card padding="lg" tone="raised" className="border-accent-orange/30">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge tone="orange" size="md">
            {t("compare.recBadge")}
          </Badge>
          <span className="text-sm text-foreground-muted">
            {t("compare.recSubtitle")}
          </span>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          {highlights.map((h) => {
            const entry = byId.get(h.trim_id);
            if (!entry) return null;
            return (
              <li
                key={`${h.trim_id}-${h.labelKey}`}
                className="rounded-[var(--radius)] border border-border bg-surface-muted p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-orange">
                  {t(h.labelKey)}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {entry.brandName} {entry.trim.model_name}
                </p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {t(h.reasonKey, h.reasonParams)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
