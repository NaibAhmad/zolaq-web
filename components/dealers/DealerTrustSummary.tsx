import { DealerVerificationBadge } from "@/components/dealers/DealerVerificationBadge";
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

function formatHours(
  ranges: Dealer["working_hours"]
): { days: string; hours: string }[] {
  return ranges.map((r) => ({
    days: r.days,
    hours: `${r.open}–${r.close}`,
  }));
}

export function DealerTrustSummary({ dealer, brandLookup }: Props) {
  const brandNames = dealer.represented_brands.map(
    (b) => brandLookup.get(b) ?? b
  );
  const hours = formatHours(dealer.working_hours);

  return (
    <section
      aria-label="Diler məlumatları"
      className="rounded-lg border border-border bg-surface-elevated p-4"
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {dealer.display_name}
          </h2>
          <p className="text-xs text-foreground-muted">{dealer.legal_name}</p>
        </div>
        <DealerVerificationBadge status={dealer.verification_status} />
      </header>

      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-foreground-muted">Təmsil olunan markalar</dt>
          <dd className="font-medium text-foreground">
            {brandNames.length > 0 ? brandNames.join(", ") : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Salon</dt>
          <dd className="font-medium text-foreground">{dealer.address}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">İş saatları</dt>
          <dd className="font-medium text-foreground">
            {hours.length === 0 ? (
              "—"
            ) : (
              <ul className="space-y-0.5">
                {hours.map((h, i) => (
                  <li key={i}>
                    <span className="text-foreground-muted">{h.days}: </span>
                    {h.hours}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Cavab vaxtı</dt>
          <dd className="font-medium text-foreground">
            ~{dealer.response_sla_hours} saat
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-foreground-muted">Xidmətlər</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {dealer.services.length === 0 ? (
              <span className="text-foreground">—</span>
            ) : (
              dealer.services.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-foreground"
                >
                  {DEALER_SERVICE_LABEL_AZ[s]}
                </span>
              ))
            )}
          </dd>
        </div>
      </dl>

      <footer className="mt-4 border-t border-border pt-3 text-xs text-foreground-muted">
        Mənbə: {dealer.source_name} · Yenilənib:{" "}
        {formatDate(dealer.updated_at)}
      </footer>
    </section>
  );
}
