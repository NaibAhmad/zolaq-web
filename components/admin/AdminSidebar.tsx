// Static sidebar for /admin/* pages. Sections are filtered by permission
// (sourced from lib/auth/permissions.ts) so a content_manager only sees
// content links etc. Active state derives from the current pathname read via
// usePathname.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/auth/constants";
import { adminCan, type Permission } from "@/lib/auth/permissions";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";

type Item = {
  href: string;
  labelKey: TranslationKey;
  // If omitted, item is visible to every admin role. Otherwise the item is
  // shown only when adminCan(role, permission) returns true.
  permission?: Permission;
};

type Section = { labelKey: TranslationKey; items: Item[] };

const SECTIONS: Section[] = [
  {
    labelKey: "adminNav.sectionGeneral",
    items: [
      { href: "/admin/dashboard", labelKey: "adminNav.dashboard" },
      { href: "/admin/audit-log", labelKey: "adminNav.auditLog", permission: "audit.read" },
    ],
  },
  {
    labelKey: "adminNav.sectionCatalog",
    items: [
      { href: "/admin/catalog/brands", labelKey: "adminNav.brands", permission: "catalog.write" },
      { href: "/admin/catalog/models", labelKey: "adminNav.models", permission: "catalog.write" },
      { href: "/admin/catalog/generations", labelKey: "adminNav.generations", permission: "catalog.write" },
      { href: "/admin/catalog/trims", labelKey: "adminNav.trims", permission: "catalog.write" },
      { href: "/admin/catalog/prices", labelKey: "adminNav.prices", permission: "catalog.write" },
    ],
  },
  {
    labelKey: "adminNav.dealers",
    items: [
      { href: "/admin/dealers", labelKey: "adminNav.dealers", permission: "dealers.manage" },
      { href: "/admin/offers", labelKey: "dealerNav.offers", permission: "offers.review" },
      { href: "/admin/media", labelKey: "dealerNav.media", permission: "media.review" },
    ],
  },
  {
    labelKey: "adminNav.submissions",
    items: [
      { href: "/admin/leads", labelKey: "adminNav.leads", permission: "leads.read" },
    ],
  },
  {
    labelKey: "adminNav.sectionContent",
    items: [
      { href: "/admin/content/news", labelKey: "adminNav.news", permission: "content.write" },
      { href: "/admin/content/encyclopedia", labelKey: "adminNav.encyclopedia", permission: "content.write" },
      { href: "/admin/content/qa", labelKey: "adminNav.qa", permission: "qa.moderate" },
      { href: "/admin/market-pulse", labelKey: "adminNav.marketPulse", permission: "market_pulse.write" },
    ],
  },
  {
    labelKey: "adminNav.sectionAds",
    items: [
      { href: "/admin/ads", labelKey: "adminNav.adRequests", permission: "ads.manage" },
      { href: "/admin/invoices", labelKey: "adminNav.invoices", permission: "invoices.manage" },
      { href: "/admin/payments", labelKey: "adminNav.paymentProof", permission: "payments.manage" },
    ],
  },
  {
    labelKey: "adminNav.sectionSystem",
    items: [
      { href: "/admin/users", labelKey: "adminNav.users", permission: "users.manage" },
      { href: "/admin/roles", labelKey: "adminNav.roles", permission: "roles.read" },
    ],
  },
];

export function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav
      aria-label={t("adminNav.ariaLabel")}
      className="flex w-60 shrink-0 flex-col gap-4 border-r border-border bg-surface-muted/40 p-4"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {t("adminNav.brandTitle")}
      </div>
      {SECTIONS.map((section) => {
        const items = section.items.filter(
          (i) => !i.permission || adminCan(role, i.permission),
        );
        if (items.length === 0) return null;
        return (
          <div key={section.labelKey} className="flex flex-col gap-1">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              {t(section.labelKey)}
            </div>
            <ul className="flex flex-col">
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-[var(--radius)] px-2 py-1.5 text-sm transition-colors ${
                        active
                          ? "bg-surface font-medium text-foreground shadow-sm"
                          : "text-foreground-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
