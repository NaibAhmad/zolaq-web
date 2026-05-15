import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ROUTES } from "@/lib/routes";

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: ROUTES.cars, label: "Maşınlar" },
  { href: ROUTES.compare, label: "Müqayisə" },
  { href: ROUTES.dealers, label: "Dilerlər" },
  { href: ROUTES.news, label: "Xəbərlər" },
  { href: ROUTES.encyclopedia, label: "Bələdçi" },
  { href: ROUTES.qa, label: "Q&A" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
        <Logo />

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Əsas naviqasiya"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-foreground transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={ROUTES.profile}
          className="text-sm font-medium text-foreground transition-colors hover:text-brand"
        >
          Mən
        </Link>
      </div>
    </header>
  );
}
