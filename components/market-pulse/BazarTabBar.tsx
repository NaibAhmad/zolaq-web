"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { QA_TAB_DEFS, type QaTabKey } from "@/lib/market-pulse/qa-tabs";

export type { QaTabKey } from "@/lib/market-pulse/qa-tabs";
export { QA_TABS, isQaTab } from "@/lib/market-pulse/qa-tabs";

export function BazarTabBar({ activeTab }: { activeTab: QaTabKey }) {
  const t = useT();
  return (
    <nav
      aria-label={t("nav.qaSections")}
      className="-mx-3 mt-4 flex flex-wrap gap-1 overflow-x-auto px-3"
    >
      {QA_TAB_DEFS.map((tab) => {
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
