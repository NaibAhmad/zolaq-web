"use client";

import { useCurrentLocale, useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n/types";
import { formatDateTimeAz } from "@/lib/format/date";
import { leadStateLabel } from "@/lib/leads/labels";
import type {
  LeadState,
  LeadTimelineEvent,
  LeadTimelineEventType,
} from "@/lib/leads/types";

type Props = {
  state: LeadState;
  events: LeadTimelineEvent[];
  showEventLog?: boolean;
};

type StageKey =
  | "submitted"
  | "dealer_opened"
  | "official_offer"
  | "test_drive"
  | "closed";

type StageStatus = "complete" | "current" | "upcoming";

type Stage = {
  key: StageKey;
  labelKey: TranslationKey;
};

const STAGES: readonly Stage[] = [
  { key: "submitted", labelKey: "leadsTimeline.sent" },
  { key: "dealer_opened", labelKey: "leadsTimeline.dealerOpened" },
  { key: "official_offer", labelKey: "leadsTimeline.quoteReceived" },
  { key: "test_drive", labelKey: "leadsTimeline.testDrive" },
  { key: "closed", labelKey: "leadsTimeline.closed" },
];

const STATE_TO_STAGE_INDEX: Record<LeadState, number> = {
  draft: -1,
  submitted: 0,
  dealer_opened: 1,
  whatsapp_handoff: 1,
  no_response: 1,
  official_offer: 2,
  expired: 2,
  second_offer: 2,
  test_drive_requested: 3,
  test_drive_confirmed: 3,
  accepted: 4,
  closed: 4,
};

// Stages that have been confirmed by an actual API event (not just derived
// from the lead's current state). Used so we can show e.g. "submitted →
// dealer_opened" as both complete when the dealer_opened event is in the log,
// even if the current state has since regressed.
const EVENT_TO_STAGE: Partial<Record<LeadTimelineEventType, StageKey>> = {
  lead_submitted: "submitted",
  lead_dealer_opened: "dealer_opened",
  lead_official_offer_received: "official_offer",
  second_offer_requested: "official_offer",
  test_drive_requested: "test_drive",
  test_drive_confirmed: "test_drive",
  offer_accepted: "closed",
  lead_closed: "closed",
  offer_expired: "official_offer",
  lead_no_response: "dealer_opened",
};

function computeStageStatuses(
  state: LeadState,
  events: LeadTimelineEvent[],
): StageStatus[] {
  const currentIdx = STATE_TO_STAGE_INDEX[state];
  const reachedFromEvents = new Set<number>();
  for (const ev of events) {
    const stage = EVENT_TO_STAGE[ev.type];
    if (!stage) continue;
    const idx = STAGES.findIndex((s) => s.key === stage);
    if (idx >= 0) reachedFromEvents.add(idx);
  }

  return STAGES.map((_, i) => {
    if (i === currentIdx) return "current";
    if (i < currentIdx) return "complete";
    if (reachedFromEvents.has(i)) return "complete";
    return "upcoming";
  });
}

export function LeadTimeline({
  state,
  events,
  showEventLog = true,
}: Props) {
  const t = useT();
  const locale = useCurrentLocale();
  const stageStatuses = computeStageStatuses(state, events);
  const sortedEvents = [...events].sort((a, b) => a.created_at - b.created_at);

  return (
    <div className="space-y-6">
      <ol
        aria-label={t("leadsTimeline.stagesAria")}
        className="grid gap-3 md:grid-cols-5"
      >
        {STAGES.map((stage, i) => {
          const status = stageStatuses[i];
          return (
            <li
              key={stage.key}
              aria-current={status === "current" ? "step" : undefined}
              className="flex items-center gap-3 md:flex-col md:items-start md:gap-2"
            >
              <StageDot status={status} index={i} />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    status === "upcoming"
                      ? "text-foreground-muted"
                      : "text-foreground"
                  }`}
                >
                  {t(stage.labelKey)}
                </p>
                <p className="text-xs text-foreground-muted">
                  {statusLabel(status, t)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {showEventLog ? (
        sortedEvents.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-6 text-center text-sm text-foreground-muted">
            {t("leadsTimeline.emptyLog")}
          </p>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-border pl-6">
            {sortedEvents.map((event) => {
              const label = event.to_state
                ? leadStateLabel(event.to_state, locale)
                : event.type;
              return (
                <li key={event.event_id} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[1.85rem] top-1.5 inline-flex h-3 w-3 items-center justify-center rounded-full border-2 border-accent-blue bg-surface"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {label}
                      </span>
                      <span className="ml-2 text-xs text-foreground-muted">
                        {actorLabel(event.actor, t)}
                      </span>
                    </div>
                    <time
                      dateTime={new Date(event.created_at).toISOString()}
                      className="text-xs text-foreground-muted"
                    >
                      {formatDateTimeAz(event.created_at)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )
      ) : null}
    </div>
  );
}

function StageDot({
  status,
  index,
}: {
  status: StageStatus;
  index: number;
}) {
  if (status === "complete") {
    return (
      <span
        aria-hidden
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/15 text-sm font-semibold text-success"
      >
        ✓
      </span>
    );
  }
  if (status === "current") {
    return (
      <span
        aria-hidden
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-orange text-sm font-semibold text-accent-orange-fg shadow-sm"
      >
        {index + 1}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-medium text-foreground-muted"
    >
      {index + 1}
    </span>
  );
}

function statusLabel(status: StageStatus, t: ReturnType<typeof useT>): string {
  if (status === "complete") return t("leadsTimeline.statusComplete");
  if (status === "current") return t("leadsTimeline.statusCurrent");
  return t("leadsTimeline.statusUpcoming");
}

function actorLabel(
  actor: LeadTimelineEvent["actor"],
  t: ReturnType<typeof useT>,
): string {
  if (actor === "user") return t("leadsTimeline.actorUser");
  if (actor === "internal_operator") return t("leadsTimeline.actorDealer");
  return t("leadsTimeline.actorSystem");
}
