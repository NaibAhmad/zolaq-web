import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DEALER_SERVICE_LABEL_AZ } from "@/lib/dealers/labels";
import type { Dealer } from "@/lib/dealers/types";

type Props = {
  dealer: Dealer;
  brandLookup: Map<string, string>;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return DATE_FORMATTER.format(d);
}

export function DealerTrustSummary({ dealer, brandLookup }: Props) {
  const brandNames = dealer.represented_brands.map(
    (b) => brandLookup.get(b) ?? b,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card padding="lg" tone="raised">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Təmsil olunan markalar
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {brandNames.length === 0 ? (
            <span className="text-sm text-foreground-muted">—</span>
          ) : (
            brandNames.map((name, i) => (
              <Badge key={`${name}-${i}`} tone="brand" size="md">
                {name}
              </Badge>
            ))
          )}
        </div>
      </Card>

      <Card padding="lg" tone="raised">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Ünvan və iş saatları
        </p>
        <p className="mt-3 text-sm font-medium text-foreground">
          {dealer.address}
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {dealer.working_hours.length === 0 ? (
            <li className="text-foreground-muted">—</li>
          ) : (
            dealer.working_hours.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="text-foreground-muted">{h.days}</span>
                <span className="font-medium text-foreground">
                  {h.open}–{h.close}
                </span>
              </li>
            ))
          )}
        </ul>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-foreground-muted">Cavab müddəti</span>
          <span className="font-medium text-foreground">
            ~{dealer.response_sla_hours} saat
          </span>
        </div>
      </Card>

      <Card padding="lg" tone="raised">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Xidmətlər
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dealer.services.length === 0 ? (
            <span className="text-sm text-foreground-muted">—</span>
          ) : (
            dealer.services.map((s) => (
              <Badge key={s} tone="blue" size="md">
                {DEALER_SERVICE_LABEL_AZ[s]}
              </Badge>
            ))
          )}
        </div>
        <p className="mt-4 text-xs text-foreground-muted">
          Mənbə: {dealer.source_name} · Yenilənib: {formatDate(dealer.updated_at)}
        </p>
      </Card>
    </div>
  );
}
