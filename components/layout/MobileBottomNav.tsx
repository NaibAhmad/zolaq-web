"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";

const TABS: ReadonlyArray<{ href: string; label: string }> = [
  { href: ROUTES.home, label: "Ana" },
  { href: ROUTES.cars, label: "Maşın" },
  { href: ROUTES.compare, label: "Müqayisə" },
  { href: ROUTES.encyclopedia, label: "Bələdçi" },
  { href: ROUTES.profile, label: "Mən" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background md:hidden"
      aria-label="Mobil naviqasiya"
    >
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-16 flex-col items-center justify-center text-xs ${
              active
                ? "font-medium text-brand"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
