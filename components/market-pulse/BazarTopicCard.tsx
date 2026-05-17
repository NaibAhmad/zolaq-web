"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError, apiPost } from "@/lib/api";
import { otpHref, ROUTES } from "@/lib/routes";
import {
  BAZAR_CADENCE_LABEL_AZ,
  BAZAR_STATUS_LABEL_AZ,
  type BazarAggregate,
  type BazarTopic,
} from "@/lib/market-pulse/types";

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

type Props = {
  topic: BazarTopic;
  aggregate: BazarAggregate | null;
  userVoteOptionId: string | null;
  isAuthenticated: boolean;
  variant?: "compact" | "full";
};

export function BazarTopicCard({
  topic,
  aggregate,
  userVoteOptionId,
  isAuthenticated,
  variant = "full",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticOption, setOptimisticOption] = useState<string | null>(null);
  const showResults = userVoteOptionId !== null || optimisticOption !== null;
  const isClosed = topic.status !== "active";
  const closingLabel = DATE_FMT.format(Date.parse(topic.end_date));

  function vote(optionId: string) {
    setError(null);
    if (!isAuthenticated) {
      router.push(otpHref({ purpose: "profile_access", next: `${ROUTES.qa}?tab=bazar-nebzi` }));
      return;
    }
    setOptimisticOption(optionId);
    startTransition(async () => {
      try {
        await apiPost(`/api/market-pulse/topics/${topic.topic_id}/vote`, {
          option_id: optionId,
        });
        router.refresh();
      } catch (e) {
        setOptimisticOption(null);
        if (e instanceof ApiError) {
          setError(e.message);
        } else {
          setError("Şəbəkə xətası");
        }
      }
    });
  }

  const participantCount = aggregate?.total ?? 0;

  return (
    <Card padding="md" tone="raised" className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="blue" size="sm">
          Bazar Nəbzi
        </Badge>
        <Badge tone="muted" size="sm">
          {BAZAR_CADENCE_LABEL_AZ[topic.cadence]}
        </Badge>
        {topic.sponsored ? (
          <Badge tone="orange" size="sm">
            Sponsorlu{topic.sponsor_name ? ` · ${topic.sponsor_name}` : ""}
          </Badge>
        ) : null}
        {isClosed ? (
          <Badge tone="muted" size="sm">
            {BAZAR_STATUS_LABEL_AZ[topic.status]}
          </Badge>
        ) : null}
      </div>

      <h3 className="text-base font-semibold leading-snug text-foreground">
        {topic.question}
      </h3>

      <ul className="flex flex-col gap-2">
        {topic.options.map((o) => {
          const a = aggregate?.options.find((x) => x.option_id === o.option_id);
          const pct = a?.pct ?? 0;
          const selected =
            userVoteOptionId === o.option_id || optimisticOption === o.option_id;
          return (
            <li key={o.option_id}>
              <button
                type="button"
                onClick={() => !isClosed && !showResults && vote(o.option_id)}
                disabled={pending || isClosed || showResults}
                className={`flex w-full items-center justify-between gap-3 rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors ${
                  selected
                    ? "border-accent-blue bg-accent-blue-soft text-foreground"
                    : "border-border bg-surface text-foreground hover:bg-surface-muted disabled:hover:bg-surface"
                } disabled:cursor-default`}
              >
                <span className="font-medium">{o.label}</span>
                {showResults || isClosed ? (
                  <span className="text-xs text-foreground-muted">
                    {a?.count ?? 0} · {pct}%
                  </span>
                ) : (
                  <span className="text-xs text-accent-blue">Sən də seç</span>
                )}
              </button>
              {(showResults || isClosed) && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-accent-blue"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-foreground-muted">
        <span>{participantCount} iştirakçı</span>
        <span>Bağlanır: {closingLabel}</span>
      </div>

      {variant === "compact" ? (
        <div className="flex flex-wrap gap-2">
          {!showResults && !isClosed ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => vote(topic.options[0]!.option_id)}
              disabled={pending}
            >
              Sən də seç
            </Button>
          ) : null}
          <Link
            href={`${ROUTES.qa}?tab=bazar-nebzi`}
            className="inline-flex items-center text-xs font-medium text-accent-blue hover:underline"
          >
            Tarixçəyə bax →
          </Link>
        </div>
      ) : null}

      {topic.market_summary ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface-muted/40 px-3 py-2 text-xs text-foreground-muted">
          <strong className="text-foreground">Zolaq market summary: </strong>
          {topic.market_summary}
        </div>
      ) : null}
    </Card>
  );
}
