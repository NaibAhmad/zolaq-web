import Image from "next/image";
import type { EnergyType } from "@/lib/cars/types";

type Props = {
  src?: string | null;
  alt: string;
  brandName: string;
  energyType: EnergyType;
};

export function CarImage({ src, alt, brandName, energyType }: Props) {
  const hasSrc = typeof src === "string" && src.length > 0;

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-surface">
      {hasSrc ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-surface-elevated"
        >
          <span className="text-base font-medium tracking-wide text-foreground-muted">
            {brandName}
          </span>
        </div>
      )}
      <span className="absolute right-2 top-2 rounded-md border border-border bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground">
        {energyType}
      </span>
    </div>
  );
}
