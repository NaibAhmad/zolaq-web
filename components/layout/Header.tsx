"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/brand/Logo";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FEATURE_I18N_BETA } from "@/lib/env";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES } from "@/lib/routes";

type NavItem = {
  href: string;
  label: string;
  translationKey: TranslationKey;
};

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: ROUTES.cars, label: "Maşınlar", translationKey: "nav.cars" },
  { href: ROUTES.compare, label: "Müqayisə", translationKey: "nav.compare" },
  { href: ROUTES.dealers, label: "Dilerlər", translationKey: "nav.dealers" },
  { href: ROUTES.news, label: "Xəbərlər", translationKey: "nav.news" },
  {
    href: ROUTES.encyclopedia,
    label: "Ensiklopediya",
    translationKey: "nav.encyclopedia",
  },
  { href: ROUTES.qa, label: "Q&A", translationKey: "nav.qa" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const profileActive = isActive(pathname, ROUTES.profile);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:gap-4 md:px-6">
        <Logo />

        {FEATURE_I18N_BETA ? (
          <HeaderNavI18n pathname={pathname} />
        ) : (
          <HeaderNavStatic pathname={pathname} />
        )}

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
          <HeaderSearch />
          {FEATURE_I18N_BETA ? <LanguageSelector /> : null}
          <ThemeToggle />
          <Link
            href={ROUTES.profile}
            aria-current={profileActive ? "page" : undefined}
            className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors ${
              profileActive
                ? "border-brand/40 bg-surface-muted text-foreground"
                : "border-border bg-surface text-foreground hover:border-brand/30 hover:bg-surface-muted"
            }`}
          >
            <span
              aria-hidden
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-brand-fg"
            >
              M
            </span>
            <span className="hidden sm:inline">Mən</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeaderNavLinks({
  pathname,
  resolveLabel,
}: {
  pathname: string;
  resolveLabel: (item: NavItem) => string;
}) {
  return (
    <nav
      className="hidden items-center gap-7 lg:flex"
      aria-label="Əsas naviqasiya"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative text-sm font-medium transition-colors ${
              active
                ? "text-foreground"
                : "text-foreground-soft hover:text-foreground"
            }`}
          >
            {resolveLabel(item)}
            {active ? (
              <span
                aria-hidden
                className="absolute -bottom-[22px] left-0 right-0 h-0.5 rounded-full bg-accent-orange"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderNavStatic({ pathname }: { pathname: string }) {
  return (
    <HeaderNavLinks pathname={pathname} resolveLabel={(item) => item.label} />
  );
}

function HeaderNavI18n({ pathname }: { pathname: string }) {
  const t = useT();
  return (
    <HeaderNavLinks
      pathname={pathname}
      resolveLabel={(item) => t(item.translationKey)}
    />
  );
}

function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    const target = trimmed
      ? `${ROUTES.cars}?q=${encodeURIComponent(trimmed)}`
      : ROUTES.cars;
    setMobileOpen(false);
    router.push(target);
  }

  return (
    <>
      <form
        role="search"
        onSubmit={submit}
        className="hidden md:flex md:w-56 lg:w-72"
        aria-label="Maşın axtarışı"
      >
        <label htmlFor="header-search" className="sr-only">
          Maşın axtarışı
        </label>
        <div className="relative w-full">
          <input
            id="header-search"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Marka, model və ya komplektasiya axtar"
            className="h-9 w-full rounded-full border border-border bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
          >
            ⌕
          </span>
        </div>
      </form>

      <button
        type="button"
        aria-label="Axtarışı aç"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-surface-muted md:hidden"
      >
        <span aria-hidden>⌕</span>
      </button>

      {mobileOpen ? (
        <div className="absolute left-0 right-0 top-16 z-30 border-b border-border bg-surface px-4 py-3 shadow-sm md:hidden">
          <form role="search" onSubmit={submit} aria-label="Maşın axtarışı">
            <label htmlFor="header-search-mobile" className="sr-only">
              Maşın axtarışı
            </label>
            <input
              id="header-search-mobile"
              type="search"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Marka, model və ya komplektasiya axtar"
              className="h-11 w-full rounded-[var(--radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20"
            />
          </form>
        </div>
      ) : null}
    </>
  );
}
