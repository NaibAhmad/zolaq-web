import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";

const SECTIONS: {
  href: string;
  titleKey: TranslationKey;
  noteKey: TranslationKey;
}[] = [
  {
    href: "/admin/catalog/brands",
    titleKey: "adminCatalog.brandsTitle",
    noteKey: "adminCatalog.brandsDescription",
  },
  {
    href: "/admin/catalog/models",
    titleKey: "adminCatalog.modelsTitle",
    noteKey: "adminCatalog.modelsDescription",
  },
  {
    href: "/admin/catalog/trims",
    titleKey: "adminCatalog.trimsTitle",
    noteKey: "adminCatalog.trimsDescription",
  },
  {
    href: "/admin/catalog/prices",
    titleKey: "adminCatalog.pricesTitle",
    noteKey: "adminCatalog.pricesDescription",
  },
];

export default async function AdminCatalogIndex() {
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminCatalog.catalogTitle")}</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="block">
            <Card padding="md" interactive>
              <h2 className="text-base font-semibold">{t(s.titleKey)}</h2>
              <p className="text-sm text-foreground-muted">{t(s.noteKey)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
