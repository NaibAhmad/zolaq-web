// Static sidebar for /dealer/* pages. All routes are scoped to the logged-in
// dealer; the server-side guards (lib/auth/dealer-session.ts) filter data by
// session.dealerId.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { href: string; label: string }[] = [
  { href: "/dealer/dashboard", label: "Panel" },
  { href: "/dealer/profile", label: "Profil" },
  { href: "/dealer/offers", label: "Təkliflər" },
  { href: "/dealer/media", label: "Media" },
  { href: "/dealer/submissions", label: "Müraciətlər" },
  { href: "/dealer/leads", label: "Sorğular" },
  { href: "/dealer/test-drives", label: "Test-sürüş" },
  { href: "/dealer/ad-requests", label: "Reklam tələblərim" },
  { href: "/dealer/invoices", label: "Hesab-fakturalar" },
  { href: "/dealer/payment-proof", label: "Ödəniş təsdiqi" },
  { href: "/dealer/settings", label: "Tənzimləmələr" },
];

export function DealerSidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Diler naviqasiya"
      className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-surface-muted/40 p-4"
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Zolaq Diler
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
