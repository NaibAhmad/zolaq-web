"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES } from "@/lib/routes";

const TABS: ReadonlyArray<{ href: string; labelKey: TranslationKey; icon: string }> = [
  { href: ROUTES.home, labelKey: "nav.mobileHome", icon: "◉" },
  { href: ROUTES.cars, labelKey: "nav.mobileCar", icon: "▣" },
  { href: ROUTES.compare, labelKey: "nav.compare", icon: "⇄" },
  { href: ROUTES.encyclopedia, labelKey: "nav.mobileGuide", icon: "◈" },
  { href: ROUTES.profile, labelKey: "nav.profileShort", icon: "◐" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface/95 backdrop-blur md:hidden"
      aria-label={t("nav.mobileNavAria")}
    >
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] ${
              active
                ? "font-semibold text-brand"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {tab.icon}
            </span>
            <span>{t(tab.labelKey)}</span>
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent-orange"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
