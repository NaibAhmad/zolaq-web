"use client";

import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";

type Item = {
  labelKey: TranslationKey;
  valueKey: TranslationKey;
  hintKey: TranslationKey;
  glyph: string;
};

const ITEMS: ReadonlyArray<Item> = [
  {
    labelKey: "home.trustOfficialDealer",
    valueKey: "home.trustOfficialDealerValue",
    hintKey: "home.trustOfficialDealerNote",
    glyph: "◇",
  },
  {
    labelKey: "home.trustPdfTitle",
    valueKey: "home.trustPdfValue",
    hintKey: "home.trustPdfNote",
    glyph: "✓",
  },
  {
    labelKey: "home.trustDailyTitle",
    valueKey: "home.trustDailyValue",
    hintKey: "home.trustDailyNote",
    glyph: "⟳",
  },
  {
    labelKey: "home.trustCompareTitle",
    valueKey: "home.trustCompareValue",
    hintKey: "home.trustCompareNote",
    glyph: "⇄",
  },
];

export function HomeTrustStrip() {
  const t = useT();
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((it) => (
        <li key={it.labelKey}>
          <Card
            padding="md"
            tone="raised"
            interactive
            className="h-full"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent-blue-soft text-lg text-accent-blue"
              >
                {it.glyph}
              </span>
              <div className="flex flex-col">
                <p className="text-xs uppercase tracking-wide text-foreground-muted">
                  {t(it.labelKey)}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">
                  {t(it.valueKey)}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">{t(it.hintKey)}</p>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
