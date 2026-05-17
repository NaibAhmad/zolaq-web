import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { ROUTES } from "@/lib/routes";

const CATALOG_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: ROUTES.cars, label: "Maşınlar" },
  { href: ROUTES.compare, label: "Müqayisə" },
  { href: ROUTES.dealers, label: "Dilerlər" },
];

const CONTENT_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: ROUTES.news, label: "Xəbərlər" },
  { href: ROUTES.encyclopedia, label: "Ensiklopediya" },
  { href: ROUTES.qa, label: "Q&A" },
];

const ACCOUNT_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: ROUTES.profile, label: "Mən" },
  { href: ROUTES.profileSaved, label: "Saxlanılan" },
  { href: ROUTES.profileLeads, label: "Sorğularım" },
];

const linkClass =
  "text-sm text-on-dark-muted transition-colors hover:text-on-dark";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-dark text-on-dark pb-20 md:pb-0">
      <Container>
        <div className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8 md:py-16">
          <div className="flex flex-col gap-3">
            <Logo variant="dark" />
            <p className="max-w-xs text-sm text-on-dark-muted">
              Zolaq — maşın seçimini öyrən, müqayisə et və rəsmi diler təklifi al.
            </p>
          </div>

          <FooterColumn title="Kataloq" links={CATALOG_LINKS} />
          <FooterColumn title="Ensiklopediya" links={CONTENT_LINKS} />
          <FooterColumn title="Hesab" links={ACCOUNT_LINKS} />
        </div>

        <div className="flex flex-col gap-2 border-t border-border-on-dark py-6 text-xs text-on-dark-muted md:flex-row md:items-center md:justify-between">
          <p>© {year} Zolaq. MVP prototip — qiymətlər və mövcudluq dəyişə bilər.</p>
          <p>Bakı, Azərbaycan</p>
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
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-on-dark">
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
