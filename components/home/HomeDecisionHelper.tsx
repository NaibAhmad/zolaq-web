import { NextBestActionCard } from "@/components/decisions/NextBestActionCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { computeReadinessForUser } from "@/lib/decisions/readiness";
import { SEED_DEMO_USER_ID } from "@/lib/decisions/seed";
import { ROUTES } from "@/lib/routes";

export function HomeDecisionHelper() {
  const summary = computeReadinessForUser(SEED_DEMO_USER_ID);
  const score = Math.max(0, Math.min(100, summary.readiness_score));
  const topBreakdown = summary.score_breakdown.slice(0, 3);
  const ringStyle = {
    background: `conic-gradient(var(--accent-orange) ${score * 3.6}deg, rgba(247, 248, 250, 0.12) 0deg)`,
  };

  return (
    <Card padding="lg" tone="raised" className="overflow-hidden">
      <div className="grid items-stretch gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Badge tone="orange" size="md" className="w-fit">
            Qərar Mərkəzi
          </Badge>
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            Hansı maşın sənə uyğundur?
          </h2>
          <p className="max-w-lg text-sm text-foreground-muted md:text-base">
            Büdcəni, enerji növünü və istifadə tərzini qeyd et — Zolaq sənə uyğun
            2–3 modeli müqayisə üçün hazırlasın. Hazırlıq qiymətin real vaxtda
            yenilənir.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <ButtonLink href={ROUTES.profileDecisions} variant="primary">
              Yeni qərar başlat
            </ButtonLink>
            <ButtonLink href={ROUTES.profile} variant="secondary">
              Qərar mərkəzinə keç
            </ButtonLink>
          </div>
        </div>

        <div className="zlq-hero-dark relative overflow-hidden rounded-[var(--radius-lg)] p-5 text-on-dark">
          <div
            aria-hidden
            className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-orange/25 blur-3xl"
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-on-dark-muted">
            Hazırlıq qiyməti
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div
              className="relative h-20 w-20 shrink-0 rounded-full"
              style={ringStyle}
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Qərar hazırlığı"
            >
              <div className="absolute inset-1.5 flex flex-col items-center justify-center rounded-full bg-surface-dark">
                <span className="text-2xl font-semibold text-on-dark leading-none">
                  {score}
                </span>
                <span className="mt-0.5 text-[10px] text-on-dark-muted">
                  / 100
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-on-dark">
                {scoreLabel(score)}
              </p>
              <p className="mt-1 text-xs text-on-dark-muted">
                Real mock məlumatına əsaslanır
              </p>
            </div>
          </div>

          <ul className="mt-5 flex flex-col gap-3">
            {topBreakdown.map((entry) => {
              const pct = Math.round(entry.achieved_pct * 100);
              return (
                <li key={entry.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-on-dark">
                      {entry.label_az}
                    </span>
                    <span className="text-on-dark-muted">
                      {entry.contribution} / {entry.weight_pct}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
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
