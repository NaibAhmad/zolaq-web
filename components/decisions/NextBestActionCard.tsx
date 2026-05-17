import { ButtonLink } from "@/components/ui/Button";
import type { NextBestAction } from "@/lib/decisions/types";

type Props = {
  action: NextBestAction;
};

export function NextBestActionCard({ action }: Props) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-accent-orange/30 bg-accent-orange-soft p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-orange text-base text-accent-orange-fg"
        >
          →
        </span>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-orange">
            Növbəti addım
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {action.title_az}
          </h3>
          <p className="mt-1 text-sm text-foreground-soft">
            {action.description_az}
          </p>
          {action.href ? (
            <div className="mt-4">
              <ButtonLink href={action.href} variant="primary">
                Davam et
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
