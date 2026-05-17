import Link from "next/link";

export const QA_TABS = [
  { key: "suallar", label: "Suallar" },
  { key: "bazar-nebzi", label: "Bazar Nəbzi" },
  { key: "gunluk", label: "Günlük" },
  { key: "heftelik", label: "Həftəlik" },
  { key: "ayliq", label: "Aylıq" },
  { key: "tarixce", label: "Tarixçə" },
] as const;

export type QaTabKey = (typeof QA_TABS)[number]["key"];

export function isQaTab(value: string | null | undefined): value is QaTabKey {
  return !!value && QA_TABS.some((t) => t.key === value);
}

export function BazarTabBar({ activeTab }: { activeTab: QaTabKey }) {
  return (
    <nav
      aria-label="Sual-cavab bölmələri"
      className="-mx-3 mt-4 flex flex-wrap gap-1 overflow-x-auto px-3"
    >
      {QA_TABS.map((tab) => {
        const active = tab.key === activeTab;
        const href = tab.key === "suallar" ? "/qa" : `/qa?tab=${tab.key}`;
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
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
