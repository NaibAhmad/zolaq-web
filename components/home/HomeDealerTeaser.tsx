import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BRANDS } from "@/lib/cars/seed";
import { DEALERS } from "@/lib/dealers/seed";
import { DEALER_VERIFICATION_LABEL_AZ } from "@/lib/dealers/labels";
import { ROUTES } from "@/lib/routes";

export function HomeDealerTeaser() {
  const brandLookup = new Map<string, string>();
  for (const b of BRANDS) brandLookup.set(b.brand_id, b.name);
  const active = DEALERS.filter((d) => d.status === "active").slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Dilerlər"
        title="Rəsmi və təsdiqlənmiş tərəfdaşlar"
        subtitle="Hər diler üçün təmsil etdiyi brendlər və cavab müddəti açıqdır."
        action={{ label: "Bütün dilerlər", href: ROUTES.dealers }}
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {active.map((d) => (
          <li key={d.dealer_id}>
            <Link href={ROUTES.dealer(d.dealer_id)} className="block h-full">
              <Card
                padding="md"
                tone="raised"
                interactive
                className="flex h-full flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground-muted">
                      {d.city}
                    </p>
                    <h3 className="text-base font-semibold text-foreground">
                      {d.display_name}
                    </h3>
                  </div>
                  <Badge
                    tone={
                      d.verification_status === "official_dealer"
                        ? "success"
                        : d.verification_status === "premium_partner"
                          ? "brand"
                          : "blue"
                    }
                    size="sm"
                  >
                    {DEALER_VERIFICATION_LABEL_AZ[d.verification_status]}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.represented_brands.map((bid) => (
                    <Badge key={bid} tone="muted" size="sm">
                      {brandLookup.get(bid) ?? bid}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-foreground-muted">
                  Cavab müddəti: ~{d.response_sla_hours} saat
                </p>
                <p className="mt-auto pt-2 text-sm font-medium text-accent-blue">
                  Profilə bax →
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
