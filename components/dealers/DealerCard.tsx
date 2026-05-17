import { DealerVerificationBadge } from "@/components/dealers/DealerVerificationBadge";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/routes";
import type { Dealer } from "@/lib/dealers/types";

type Props = {
  dealer: Dealer;
  brandLookup: Map<string, string>;
};

const MAX_BRAND_PILLS = 3;

export function DealerCard({ dealer, brandLookup }: Props) {
  const detailHref = ROUTES.dealer(dealer.dealer_id);
  const brandNames = dealer.represented_brands.map(
    (b) => brandLookup.get(b) ?? b,
  );
  const visibleBrands = brandNames.slice(0, MAX_BRAND_PILLS);
  const overflowBrands = brandNames.length - visibleBrands.length;

  return (
    <Card
      as="article"
      padding="md"
      tone="raised"
      interactive
      className="flex h-full flex-col gap-3"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">
            {dealer.city}
          </p>
          <h3 className="truncate text-base font-semibold text-foreground">
            {dealer.display_name}
          </h3>
        </div>
        <DealerVerificationBadge status={dealer.verification_status} />
      </header>

      {brandNames.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {visibleBrands.map((name, i) => (
            <Badge key={`${name}-${i}`} tone="muted" size="sm">
              {name}
            </Badge>
          ))}
          {overflowBrands > 0 ? (
            <Badge tone="muted" size="sm">
              +{overflowBrands}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
        <span className="uppercase tracking-wide text-foreground-muted">
          Cavab
        </span>
        <span className="font-medium text-foreground">
          ~{dealer.response_sla_hours} saat
        </span>
      </div>

      <ButtonLink href={detailHref} variant="dark" fullWidth>
        Profilə bax
      </ButtonLink>
    </Card>
  );
}
