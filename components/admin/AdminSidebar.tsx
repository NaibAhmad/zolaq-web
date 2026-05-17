// Static sidebar for /admin/* pages. Sections are filtered by permission
// (sourced from lib/auth/permissions.ts) so a content_manager only sees
// content links etc. Active state derives from the current pathname read via
// usePathname.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminRole } from "@/lib/auth/constants";
import { adminCan, type Permission } from "@/lib/auth/permissions";

type Item = {
  href: string;
  label: string;
  // If omitted, item is visible to every admin role. Otherwise the item is
  // shown only when adminCan(role, permission) returns true.
  permission?: Permission;
};

type Section = { label: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    label: "Ümumi",
    items: [
      { href: "/admin/dashboard", label: "Panel" },
      { href: "/admin/audit-log", label: "Audit jurnalı", permission: "audit.read" },
    ],
  },
  {
    label: "Kataloq",
    items: [
      { href: "/admin/catalog/brands", label: "Markalar", permission: "catalog.write" },
      { href: "/admin/catalog/models", label: "Modellər", permission: "catalog.write" },
      { href: "/admin/catalog/generations", label: "Nəsillər", permission: "catalog.write" },
      { href: "/admin/catalog/trims", label: "Komplektasiyalar", permission: "catalog.write" },
      { href: "/admin/catalog/prices", label: "Qiymətlər", permission: "catalog.write" },
    ],
  },
  {
    label: "Dilerlər",
    items: [
      { href: "/admin/dealers", label: "Dilerlər", permission: "dealers.manage" },
      { href: "/admin/offers", label: "Təkliflər", permission: "offers.review" },
      { href: "/admin/media", label: "Media", permission: "media.review" },
    ],
  },
  {
    label: "Müraciətlər",
    items: [
      { href: "/admin/leads", label: "Sorğular", permission: "leads.read" },
    ],
  },
  {
    label: "Məzmun",
    items: [
      { href: "/admin/content/news", label: "Xəbərlər", permission: "content.write" },
      { href: "/admin/content/encyclopedia", label: "Ensiklopediya", permission: "content.write" },
      { href: "/admin/content/qa", label: "Sual-cavab", permission: "qa.moderate" },
      { href: "/admin/market-pulse", label: "Bazar Nəbzi", permission: "market_pulse.write" },
    ],
  },
  {
    label: "Reklam",
    items: [
      { href: "/admin/ads", label: "Reklam tələbləri", permission: "ads.manage" },
      { href: "/admin/invoices", label: "Fakturalar", permission: "invoices.manage" },
      { href: "/admin/payments", label: "Ödəniş təsdiqi", permission: "payments.manage" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/users", label: "İstifadəçilər", permission: "users.manage" },
      { href: "/admin/roles", label: "Rollar", permission: "roles.read" },
    ],
  },
];

export function AdminSidebar({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin naviqasiya"
      className="flex w-60 shrink-0 flex-col gap-4 border-r border-border bg-surface-muted/40 p-4"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Zolaq Admin
      </div>
      {SECTIONS.map((section) => {
        const items = section.items.filter(
          (i) => !i.permission || adminCan(role, i.permission),
        );
        if (items.length === 0) return null;
        return (
          <div key={section.label} className="flex flex-col gap-1">
            <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              {section.label}
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
                      {item.label}
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
