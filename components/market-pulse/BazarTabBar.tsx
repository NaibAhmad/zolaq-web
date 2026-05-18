"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";

type TabDef = { key: QaTabKey; labelKey: TranslationKey; fallback: string };

const TABS: ReadonlyArray<TabDef> = [
  { key: "suallar", labelKey: "nav.qa", fallback: "Sorğu" },
  { key: "bazar-nebzi", labelKey: "bazar.badge", fallback: "Bazar Nəbzi" },
  { key: "gunluk", labelKey: "bazar.daily", fallback: "Gündəlik" },
  { key: "heftelik", labelKey: "bazar.weekly", fallback: "Həftəlik" },
  { key: "ayliq", labelKey: "bazar.monthly", fallback: "Aylıq" },
  { key: "tarixce", labelKey: "bazar.tabHistory", fallback: "Tarixçə" },
];

export const QA_TABS = TABS.map((t) => ({ key: t.key, label: t.fallback })) as ReadonlyArray<{
  key: QaTabKey;
  label: string;
}>;

export type QaTabKey =
  | "suallar"
  | "bazar-nebzi"
  | "gunluk"
  | "heftelik"
  | "ayliq"
  | "tarixce";

export function isQaTab(value: string | null | undefined): value is QaTabKey {
  return !!value && TABS.some((t) => t.key === value);
}

export function BazarTabBar({ activeTab }: { activeTab: QaTabKey }) {
  const t = useT();
  return (
    <nav
      aria-label={t("nav.qaSections")}
      className="-mx-3 mt-4 flex flex-wrap gap-1 overflow-x-auto px-3"
    >
      {TABS.map((tab) => {
        const active = tab.key === activeTab;
        const href = tab.key === "suallar" ? "/qa" : `/qa?tab=${tab.key}`;
        const label = t(tab.labelKey);
        return (
          <Link
            key={tab.key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-accent-blue text-white shadow-sm"
                : "bg-surface text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
