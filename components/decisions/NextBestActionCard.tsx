import Link from "next/link";
import type { NextBestAction } from "@/lib/decisions/types";

type Props = {
  action: NextBestAction;
};

export function NextBestActionCard({ action }: Props) {
  return (
    <div className="rounded-lg border border-accent-orange/40 bg-accent-orange/5 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-accent-orange">
        Növbəti addım
      </p>
      <h3 className="mt-1 text-base font-semibold text-foreground">
        {action.title_az}
      </h3>
      <p className="mt-1 text-sm text-foreground-muted">
        {action.description_az}
      </p>
      {action.href ? (
        <Link
          href={action.href}
          className="mt-3 inline-flex items-center justify-center rounded-md bg-accent-orange px-4 py-2 text-sm font-medium text-accent-orange-fg hover:opacity-90"
        >
          Davam et
        </Link>
      ) : null}
    </div>
  );
}
