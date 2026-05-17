import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import type { EnergyType } from "@/lib/cars/types";

type Props = {
  src?: string | null;
  alt: string;
  brandName: string;
  energyType: EnergyType;
  aspect?: "16/9" | "4/3" | "21/9";
  showEnergyBadge?: boolean;
  className?: string;
};

const ASPECT: Record<NonNullable<Props["aspect"]>, string> = {
  "16/9": "aspect-[16/9]",
  "4/3": "aspect-[4/3]",
  "21/9": "aspect-[21/9]",
};

export function CarImage({
  src,
  alt,
  brandName,
  energyType,
  aspect = "16/9",
  showEnergyBadge = true,
  className = "",
}: Props) {
  const hasSrc = typeof src === "string" && src.length > 0;

  return (
    <div
      className={`relative ${ASPECT[aspect]} w-full overflow-hidden rounded-[var(--radius)] bg-surface-dark ${className}`}
    >
      {hasSrc ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-dark via-surface-dark-elevated to-surface-dark-muted"
        >
          <span className="text-base font-semibold tracking-wide text-on-dark-muted">
            {brandName}
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 zlq-hero-grid opacity-50"
          />
        </div>
      )}
      {showEnergyBadge ? (
        <span className="absolute left-3 top-3">
          <Badge tone="on-dark" size="sm">
            {energyType}
          </Badge>
        </span>
      ) : null}
    </div>
  );
}
