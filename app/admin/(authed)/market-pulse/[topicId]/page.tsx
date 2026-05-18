import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatDateTimeAz } from "@/lib/format/date";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";
import { aggregateTopic, getTopic } from "@/lib/market-pulse/store";
import type { BazarCadence, BazarTopicStatus } from "@/lib/market-pulse/types";

const CADENCE_KEY: Record<BazarCadence, TranslationKey> = {
  daily: "adminContent.cadenceDaily",
  weekly: "adminContent.cadenceWeekly",
  monthly: "adminContent.cadenceMonthly",
};

const STATUS_KEY: Record<BazarTopicStatus, TranslationKey> = {
  draft: "adminContent.bazarDraft",
  sponsored_pending_approval: "adminContent.bazarSponsoredPending",
  active: "adminContent.bazarActive",
  closed: "adminContent.bazarClosed",
  resolved: "adminContent.bazarResolved",
  archived: "adminContent.bazarArchived",
  rejected: "adminContent.bazarRejected",
};

type NextStep = { to: BazarTopicStatus; labelKey: TranslationKey; needsSummary?: boolean };

const NEXT_STATES: Record<BazarTopicStatus, readonly NextStep[]> = {
  draft: [
    { to: "active", labelKey: "adminContent.actionPublish" },
    { to: "rejected", labelKey: "adminContent.actionReject" },
  ],
  sponsored_pending_approval: [
    { to: "active", labelKey: "adminContent.actionApprovePublish" },
    { to: "rejected", labelKey: "adminContent.actionReject" },
  ],
  active: [{ to: "closed", labelKey: "adminContent.actionClose" }],
  closed: [
    { to: "resolved", labelKey: "adminContent.actionResolve", needsSummary: true },
    { to: "archived", labelKey: "adminContent.actionArchive" },
  ],
  resolved: [{ to: "archived", labelKey: "adminContent.actionArchive" }],
  archived: [],
  rejected: [],
};

export default async function AdminMarketPulseDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = getTopic(topicId);
  if (!topic) notFound();
  const agg = aggregateTopic(topicId);
  const next = NEXT_STATES[topic.status];
  const locale = await getServerLocale();
  const t = await getServerT();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{getLocalizedText(topic.question, locale)}</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            ID: <code className="text-foreground">{topic.topic_id}</code> ·{" "}
            {t(CADENCE_KEY[topic.cadence])} · {topic.start_date} → {topic.end_date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {topic.sponsored ? (
            <Badge tone="orange" size="sm">
              {t("adminContent.sponsoredBadgeFull", {
                sponsor: topic.sponsor_name ? `· ${topic.sponsor_name}` : "",
              })}
            </Badge>
          ) : null}
          <Badge tone="brand">{t(STATUS_KEY[topic.status])}</Badge>
        </div>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
          {t("adminContent.variantsTitle")}
        </p>
        <ul className="flex flex-col gap-2">
          {topic.options.map((o) => {
            const a = agg?.options.find((x) => x.option_id === o.option_id);
            return (
              <li
                key={o.option_id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium">{getLocalizedText(o.label, locale)}</span>
                <span className="text-foreground-muted">
                  {t("adminContent.voteSummary", { count: a?.count ?? 0, pct: a?.pct ?? 0 })}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-foreground-muted">
          {t("adminContent.totalParticipants", { count: agg?.total ?? 0 })}
        </p>
        {topic.market_summary ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              {t("adminContent.marketSummaryTitle")}
            </p>
            <p className="mt-1 text-sm text-foreground">{getLocalizedText(topic.market_summary, locale)}</p>
          </div>
        ) : null}
        {topic.closed_at ? (
          <p className="text-xs text-foreground-muted">
            {t("adminContent.closedAtLabel", { date: formatDateTimeAz(topic.closed_at) })}
          </p>
        ) : null}
        {topic.resolved_at ? (
          <p className="text-xs text-foreground-muted">
            {t("adminContent.resolvedAtLabel", { date: formatDateTimeAz(topic.resolved_at) })}
          </p>
        ) : null}
      </Card>

      {next.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            {t("adminContent.lifecycleTitle")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {next.map((step) => (
              <form
                key={step.to}
                action={`/api/internal/market-pulse/${topic.topic_id}/transition`}
                method="post"
                className="flex items-end gap-2"
              >
                <input type="hidden" name="to" value={step.to} />
                {step.needsSummary ? (
                  <Input
                    name="market_summary"
                    label={t("adminContent.marketSummaryTitle")}
                    required
                  />
                ) : null}
                {step.to === "rejected" ? (
                  <Input
                    name="rejection_reason"
                    label={t("adminContent.rejectionReasonLabel")}
                    required
                  />
                ) : null}
                <Button
                  type="submit"
                  variant={
                    step.to === "rejected"
                      ? "danger"
                      : step.to === "archived"
                        ? "secondary"
                        : "primary"
                  }
                >
                  {t(step.labelKey)}
                </Button>
              </form>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
