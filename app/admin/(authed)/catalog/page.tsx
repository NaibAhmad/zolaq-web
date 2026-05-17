import Link from "next/link";
import { Card } from "@/components/ui/Card";

const SECTIONS = [
  { href: "/admin/catalog/brands", title: "Markalar", note: "Brendləri yaradın və statusunu idarə edin." },
  { href: "/admin/catalog/models", title: "Modellər", note: "Marka üzrə modelləri idarə edin." },
  { href: "/admin/catalog/trims", title: "Komplektasiyalar", note: "Trim/specifikasiya səviyyəsində məlumat." },
  { href: "/admin/catalog/prices", title: "Qiymətlər", note: "Kataloq qiymətləri və diler təklifləri." },
];

export default function AdminCatalogIndex() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Kataloq</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="block">
            <Card padding="md" interactive>
              <h2 className="text-base font-semibold">{s.title}</h2>
              <p className="text-sm text-foreground-muted">{s.note}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
