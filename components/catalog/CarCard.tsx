import Link from "next/link";
import { CarImage } from "@/components/catalog/CarImage";
import { ROUTES } from "@/lib/routes";
import type { Trim } from "@/lib/cars/types";

type Props = {
  trim: Trim;
  brandName: string;
};

function deriveTrimSuffix(displayName: string, brandName: string, modelName: string): string {
  const head = `${brandName} ${modelName}`;
  if (displayName.startsWith(head)) {
    return displayName.slice(head.length).trim();
  }
  if (displayName.startsWith(modelName)) {
    return displayName.slice(modelName.length).trim();
  }
  return displayName;
}

export function CarCard({ trim, brandName }: Props) {
  const trimSuffix = deriveTrimSuffix(trim.display_name, brandName, trim.model_name);
  const detailHref = ROUTES.car(trim.trim_id);

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface-elevated p-4">
      <CarImage
        src={trim.image_url}
        alt={trim.display_name}
        brandName={brandName}
        energyType={trim.energy_type}
      />

      <header className="space-y-1">
        <p className="text-sm font-medium text-foreground-muted">
          {brandName} · {trim.model_name}
        </p>
        {trimSuffix ? (
          <h3 className="text-base font-semibold text-foreground">{trimSuffix}</h3>
        ) : (
          <h3 className="text-base font-semibold text-foreground">{trim.display_name}</h3>
        )}
        <p className="text-xs text-foreground-muted">
          {trim.year} · {trim.energy_type}
        </p>
      </header>

      {(trim.power_hp || trim.range_km) && (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
          {trim.power_hp ? (
            <div className="flex gap-1">
              <dt>Güc:</dt>
              <dd className="font-medium text-foreground">{trim.power_hp} a.g.</dd>
            </div>
          ) : null}
          {trim.range_km ? (
            <div className="flex gap-1">
              <dt>Yürüş:</dt>
              <dd className="font-medium text-foreground">{trim.range_km} km</dd>
            </div>
          ) : null}
        </dl>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Link
          href={detailHref}
          className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
        >
          Ətraflı bax
        </Link>
        <Link
          href={`${detailHref}#sorgu`}
          className="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface"
        >
          Sorğu göndər
        </Link>
      </div>
    </article>
  );
}
