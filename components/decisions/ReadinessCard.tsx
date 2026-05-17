import { NextBestActionCard } from "./NextBestActionCard";
import { Card } from "@/components/ui/Card";
import type { ReadinessSummary } from "@/lib/decisions/types";

type Props = {
  summary: ReadinessSummary;
};

export function ReadinessCard({ summary }: Props) {
  const score = Math.max(0, Math.min(100, summary.readiness_score));
  const ringStyle = {
    background: `conic-gradient(var(--accent-orange) ${score * 3.6}deg, var(--surface-muted) 0deg)`,
  };

  return (
    <Card padding="lg" tone="raised">
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-5">
          <div
            className="relative h-28 w-28 shrink-0 rounded-full"
            style={ringStyle}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Qərar hazırlığı"
          >
            <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-surface">
              <span className="text-3xl font-semibold text-foreground">
                {score}
              </span>
              <span className="text-xs text-foreground-muted">/ 100</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Qərar hazırlığı
            </p>
            <p className="mt-1 text-base font-medium text-foreground">
              {scoreLabel(score)}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {summary.score_breakdown.map((entry) => {
            const pct = Math.round(entry.achieved_pct * 100);
            return (
              <li key={entry.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {entry.label_az}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {entry.contribution} / {entry.weight_pct}
                  </span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={entry.label_az}
                >
                  <div
                    className="h-full rounded-full bg-accent-orange"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6">
        <NextBestActionCard action={summary.next_best_action} />
      </div>
    </Card>
  );
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Demək olar hazırsan";
  if (score >= 50) return "Davam et";
  if (score >= 20) return "Başlanğıc mərhələdə";
  return "Yenicə başlayır";
}
