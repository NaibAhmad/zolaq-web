"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { ROUTES } from "@/lib/routes";

type FooterLink = { href: string; labelKey: TranslationKey };

const CATALOG_LINKS: ReadonlyArray<FooterLink> = [
  { href: ROUTES.cars, labelKey: "nav.cars" },
  { href: ROUTES.compare, labelKey: "nav.compare" },
  { href: ROUTES.dealers, labelKey: "nav.dealers" },
];

const CONTENT_LINKS: ReadonlyArray<FooterLink> = [
  { href: ROUTES.news, labelKey: "nav.news" },
  { href: ROUTES.encyclopedia, labelKey: "nav.encyclopedia" },
  { href: ROUTES.qa, labelKey: "nav.qa" },
];

const ACCOUNT_LINKS: ReadonlyArray<FooterLink> = [
  { href: ROUTES.profile, labelKey: "nav.profileShort" },
  { href: ROUTES.profileSaved, labelKey: "nav.savedItems" },
  { href: ROUTES.profileLeads, labelKey: "nav.myLeads" },
];

const linkClass =
  "text-sm text-on-dark-muted transition-colors hover:text-on-dark";

export function Footer() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-dark text-on-dark pb-20 md:pb-0">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8 md:py-16">
          <div className="flex flex-col gap-3">
            <Logo variant="dark" />
            <p className="max-w-xs text-sm text-on-dark-muted">
              {t("footer.tagline")}
            </p>
          </div>

          <FooterColumn title={t("footer.catalog")} links={CATALOG_LINKS} />
          <FooterColumn
            title={t("footer.encyclopedia")}
            links={CONTENT_LINKS}
          />
          <FooterColumn title={t("footer.account")} links={ACCOUNT_LINKS} />
        </div>

        <div className="flex flex-col gap-2 border-t border-border-on-dark py-6 text-xs text-on-dark-muted md:flex-row md:items-center md:justify-between">
          <p>{t("footer.copyright", { year })}</p>
          <p>{t("footer.location")}</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<FooterLink>;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-on-dark">
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
