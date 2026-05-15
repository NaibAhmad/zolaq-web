import Link from "next/link";
import { DealerVerificationBadge } from "@/components/dealers/DealerVerificationBadge";
import { ROUTES } from "@/lib/routes";
import type { Dealer } from "@/lib/dealers/types";

type Props = {
  dealer: Dealer;
  brandLookup: Map<string, string>;
};

export function DealerCard({ dealer, brandLookup }: Props) {
  const detailHref = ROUTES.dealer(dealer.dealer_id);
  const brandNames = dealer.represented_brands.map(
    (b) => brandLookup.get(b) ?? b
  );

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface-elevated p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">
            {dealer.display_name}
          </h3>
          <p className="text-xs text-foreground-muted">{dealer.city}</p>
        </div>
        <DealerVerificationBadge status={dealer.verification_status} />
      </header>

      {brandNames.length > 0 ? (
        <p className="text-sm text-foreground">
          <span className="text-foreground-muted">Markalar: </span>
          {brandNames.join(", ")}
        </p>
      ) : null}

      <p className="text-xs text-foreground-muted">
        Cavab vaxtı: ~{dealer.response_sla_hours} saat
      </p>

      <div className="mt-auto pt-2">
        <Link
          href={detailHref}
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
        >
          Profilə bax
        </Link>
      </div>
    </article>
  );
}
