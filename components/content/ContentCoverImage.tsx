import Image from "next/image";

type Aspect = "16/9" | "21/9";

type Props = {
  src?: string | null;
  alt: string;
  aspect?: Aspect;
  className?: string;
  categoryLabel?: string;
  moduleLabel?: string;
  priority?: boolean;
};

const ASPECT: Record<Aspect, string> = {
  "16/9": "aspect-[16/9]",
  "21/9": "aspect-[21/9]",
};

export function ContentCoverImage({
  src,
  alt,
  aspect = "16/9",
  className = "",
  categoryLabel,
  moduleLabel,
  priority = false,
}: Props) {
  const hasSrc = typeof src === "string" && src.length > 0;
  const caption = moduleLabel ? `Zolaq · ${moduleLabel}` : "Zolaq";

  return (
    <div
      className={`relative ${ASPECT[aspect]} w-full overflow-hidden rounded-[var(--radius-lg)] bg-surface-dark ${className}`}
    >
      {hasSrc ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          unoptimized
          priority={priority}
        />
      ) : (
        <>
          <span className="sr-only">{alt}</span>
          <div
            aria-hidden="true"
            className="relative flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-surface-dark via-surface-dark-elevated to-surface-dark-muted"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 zlq-hero-grid opacity-50"
            />
            {categoryLabel ? (
              <span className="relative z-10 text-base font-semibold tracking-wide text-on-dark">
                {categoryLabel}
              </span>
            ) : null}
            <span className="relative z-10 text-[11px] uppercase tracking-[0.18em] text-on-dark-muted">
              {caption}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
