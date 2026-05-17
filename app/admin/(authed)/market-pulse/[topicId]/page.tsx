import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { aggregateTopic, getTopic } from "@/lib/market-pulse/store";
import {
  BAZAR_CADENCE_LABEL_AZ,
  BAZAR_STATUS_LABEL_AZ,
  type BazarTopicStatus,
} from "@/lib/market-pulse/types";

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const NEXT_STATES: Record<BazarTopicStatus, readonly { to: BazarTopicStatus; label: string; needsSummary?: boolean }[]> = {
  draft: [
    { to: "active", label: "Yayımla" },
    { to: "rejected", label: "Rədd et" },
  ],
  sponsored_pending_approval: [
    { to: "active", label: "Təsdiqlə və yayımla" },
    { to: "rejected", label: "Rədd et" },
  ],
  active: [{ to: "closed", label: "Bağla" }],
  closed: [
    { to: "resolved", label: "Yekun qoy", needsSummary: true },
    { to: "archived", label: "Arxivə göndər" },
  ],
  resolved: [{ to: "archived", label: "Arxivə göndər" }],
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
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{topic.question}</h1>
          <p className="mt-0.5 text-xs text-foreground-muted">
            ID: <code className="text-foreground">{topic.topic_id}</code> ·{" "}
            {BAZAR_CADENCE_LABEL_AZ[topic.cadence]} · {topic.start_date} →{" "}
            {topic.end_date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {topic.sponsored ? (
            <Badge tone="orange" size="sm">
              Sponsorlu {topic.sponsor_name ? `· ${topic.sponsor_name}` : ""}
            </Badge>
          ) : null}
          <Badge tone="brand">{BAZAR_STATUS_LABEL_AZ[topic.status]}</Badge>
        </div>
      </header>

      <Card padding="md" tone="raised" className="grid gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
          Variantlar və nəticələr
        </p>
        <ul className="flex flex-col gap-2">
          {topic.options.map((o) => {
            const a = agg?.options.find((x) => x.option_id === o.option_id);
            return (
              <li
                key={o.option_id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium">{o.label}</span>
                <span className="text-foreground-muted">
                  {a?.count ?? 0} səs · {a?.pct ?? 0}%
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-foreground-muted">
          Ümumi iştirakçı: {agg?.total ?? 0}
        </p>
        {topic.market_summary ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              Zolaq market summary
            </p>
            <p className="mt-1 text-sm text-foreground">{topic.market_summary}</p>
          </div>
        ) : null}
        {topic.closed_at ? (
          <p className="text-xs text-foreground-muted">
            Bağlanıb: {DATE_FMT.format(topic.closed_at)}
          </p>
        ) : null}
        {topic.resolved_at ? (
          <p className="text-xs text-foreground-muted">
            Yekun: {DATE_FMT.format(topic.resolved_at)}
          </p>
        ) : null}
      </Card>

      {next.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Lifecycle əməliyyatları
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
                    label="Zolaq market summary"
                    required
                  />
                ) : null}
                {step.to === "rejected" ? (
                  <Input
                    name="rejection_reason"
                    label="Rədd səbəbi"
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
                  {step.label}
                </Button>
              </form>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
