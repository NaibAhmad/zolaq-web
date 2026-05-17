import { CarCard } from "@/components/catalog/CarCard";
import { CompareSelectionBar } from "@/components/compare/CompareSelectionBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BRANDS, TRIMS } from "@/lib/cars/seed";
import { ROUTES } from "@/lib/routes";

export function HomeCatalogTeaser() {
  const brandLookup = new Map<string, string>();
  for (const b of BRANDS) brandLookup.set(b.brand_id, b.name);

  const featured = TRIMS.filter((t) => t.status === "active").slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Kataloq"
        title="Seçilmiş maşınlar"
        subtitle="Rəsmi diler məlumatına əsaslanan ən aktual modellər."
        action={{ label: "Bütün maşınlar", href: ROUTES.cars }}
      />
      <CompareSelectionBar />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((trim) => (
          <li key={trim.trim_id} className="flex">
            <CarCard
              trim={trim}
              brandName={brandLookup.get(trim.brand_id) ?? trim.brand_id}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
