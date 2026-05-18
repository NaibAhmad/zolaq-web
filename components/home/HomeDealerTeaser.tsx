import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BRANDS } from "@/lib/cars/seed";
import { DEALERS } from "@/lib/dealers/seed";
import { dealerVerificationLabel } from "@/lib/dealers/labels";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { ROUTES } from "@/lib/routes";

export async function HomeDealerTeaser() {
  const t = await getServerT();
  const locale = await getServerLocale();
  const brandLookup = new Map<string, string>();
  for (const b of BRANDS) brandLookup.set(b.brand_id, b.name);
  const active = DEALERS.filter((d) => d.status === "active").slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={t("homeDealerTeaser.eyebrow")}
        title={t("homeDealerTeaser.title")}
        subtitle={t("homeDealerTeaser.subtitle")}
        action={{ label: t("homeDealerTeaser.viewAll"), href: ROUTES.dealers }}
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
                    {dealerVerificationLabel(d.verification_status, locale)}
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
                  {t("homeDealerTeaser.responseLabel")}:{" "}
                  {t("homeDealerTeaser.responseValue", {
                    hours: d.response_sla_hours,
                  })}
                </p>
                <p className="mt-auto pt-2 text-sm font-medium text-accent-blue">
                  {t("homeDealerTeaser.viewProfile")}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
