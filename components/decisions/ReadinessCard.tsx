// Pure display component. Receives a ReadinessSummary from the API and
// renders the score + breakdown bars + next-best-action card. MUST NOT
// recompute any factor or score (Sprint 5 rule).

import { NextBestActionCard } from "./NextBestActionCard";
import type { ReadinessSummary } from "@/lib/decisions/types";

type Props = {
  summary: ReadinessSummary;
};

export function ReadinessCard({ summary }: Props) {
  return (
    <section className="rounded-lg border border-border bg-surface-elevated p-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Qərar hazırlığı
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {summary.readiness_score}
            <span className="ml-1 text-base font-medium text-foreground-muted">
              / 100
            </span>
          </p>
        </div>
      </header>

      <ul className="mt-4 space-y-2">
        {summary.score_breakdown.map((entry) => {
          const pct = Math.round(entry.achieved_pct * 100);
          return (
            <li key={entry.key}>
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span className="text-foreground">{entry.label_az}</span>
                <span>
                  {entry.contribution} / {entry.weight_pct}
                </span>
              </div>
              <div
                className="mt-1 h-1.5 w-full overflow-hidden rounded bg-surface"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={entry.label_az}
              >
                <div
                  className="h-full bg-accent-orange"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-5">
        <NextBestActionCard action={summary.next_best_action} />
      </div>
    </section>
  );
}
