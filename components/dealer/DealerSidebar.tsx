// Static sidebar for /dealer/* pages. All routes are scoped to the logged-in
// dealer; the server-side guards (lib/auth/dealer-session.ts) filter data by
// session.dealerId.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";

const ITEMS: { href: string; labelKey: TranslationKey }[] = [
  { href: "/dealer/dashboard", labelKey: "dealerNav.dashboard" },
  { href: "/dealer/profile", labelKey: "dealerNav.profile" },
  { href: "/dealer/offers", labelKey: "dealerNav.offers" },
  { href: "/dealer/media", labelKey: "dealerNav.media" },
  { href: "/dealer/submissions", labelKey: "dealerNav.submissions" },
  { href: "/dealer/leads", labelKey: "dealerNav.leads" },
  { href: "/dealer/test-drives", labelKey: "dealerNav.testDrives" },
  { href: "/dealer/ad-requests", labelKey: "dealerNav.adRequests" },
  { href: "/dealer/invoices", labelKey: "dealerNav.invoices" },
  { href: "/dealer/payment-proof", labelKey: "dealerNav.paymentProof" },
  { href: "/dealer/settings", labelKey: "dealerNav.settings" },
];

export function DealerSidebar() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav
      aria-label={t("dealerNav.ariaLabel")}
      className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-surface-muted/40 p-4"
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {t("dealerNav.brandTitle")}
      </div>
      {ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-[var(--radius)] px-2 py-1.5 text-sm transition-colors ${
              active
                ? "bg-surface font-medium text-foreground shadow-sm"
                : "text-foreground-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
