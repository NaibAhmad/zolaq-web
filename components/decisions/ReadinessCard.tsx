"use client";

import { NextBestActionCard } from "./NextBestActionCard";
import { Card } from "@/components/ui/Card";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import type {
  ReadinessFactorKey,
  ReadinessSummary,
} from "@/lib/decisions/types";

type Props = {
  summary: ReadinessSummary;
};

const FACTOR_KEYS: Record<ReadinessFactorKey, TranslationKey> = {
  profile_completeness: "readinessFactors.profileCompleteness",
  research_activity: "readinessFactors.researchActivity",
  compare_activity: "readinessFactors.compareActivity",
  official_offers: "readinessFactors.officialOffers",
  test_drive_stage: "readinessFactors.testDriveStage",
  budget_match: "readinessFactors.budgetMatch",
};

function scoreKey(score: number): TranslationKey {
  if (score >= 80) return "homeDecisionHelper.scoreReady";
  if (score >= 50) return "homeDecisionHelper.scoreContinue";
  if (score >= 20) return "homeDecisionHelper.scoreEarly";
  return "homeDecisionHelper.scoreStart";
}

export function ReadinessCard({ summary }: Props) {
  const t = useT();
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
            aria-label={t("homeDecisionHelper.ringAria")}
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
              {t("homeDecisionHelper.progressLabel")}
            </p>
            <p className="mt-1 text-base font-medium text-foreground">
              {t(scoreKey(score))}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {summary.score_breakdown.map((entry) => {
            const pct = Math.round(entry.achieved_pct * 100);
            const factorLabel = t(FACTOR_KEYS[entry.key]);
            return (
              <li key={entry.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {factorLabel}
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
                  aria-label={factorLabel}
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
