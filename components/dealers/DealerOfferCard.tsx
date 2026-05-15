import Link from "next/link";
import { PriceCard } from "@/components/catalog/PriceCard";
import { ROUTES } from "@/lib/routes";
import type { PriceRecord } from "@/lib/cars/types";

type Props = {
  offer: PriceRecord;
  trimName?: string;
};

export function DealerOfferCard({ offer, trimName }: Props) {
  return (
    <article className="space-y-2">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {trimName ?? offer.trim_id}
        </h3>
        <Link
          href={ROUTES.car(offer.trim_id)}
          className="text-xs text-accent-blue underline-offset-2 hover:underline"
        >
          Maşına bax
        </Link>
      </header>
      <PriceCard price={offer} />
    </article>
  );
}
