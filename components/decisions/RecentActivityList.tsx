import { DECISION_HISTORY_EVENT_LABELS_AZ } from "@/lib/decisions/labels";
import type { DecisionHistoryEvent } from "@/lib/decisions/types";

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type Props = {
  events: DecisionHistoryEvent[];
  limit?: number;
  emptyLabel?: string;
};

export function RecentActivityList({ events, limit, emptyLabel }: Props) {
  const visible = limit !== undefined ? events.slice(0, limit) : events;

  if (visible.length === 0) {
    return (
      <p className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-6 text-center text-sm text-foreground-muted">
        {emptyLabel ?? "Fəaliyyət hələ qeydə alınmayıb."}
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-6">
      {visible.map((event) => (
        <li key={event.event_id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[1.85rem] top-1.5 inline-flex h-3 w-3 items-center justify-center rounded-full border-2 border-accent-blue bg-surface"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {DECISION_HISTORY_EVENT_LABELS_AZ[event.type]}
              </p>
              {event.trim_id ? (
                <p className="truncate text-xs text-foreground-muted">
                  {event.trim_id}
                </p>
              ) : null}
            </div>
            <time
              dateTime={new Date(event.created_at).toISOString()}
              className="shrink-0 text-xs text-foreground-muted"
            >
              {DATE_FMT.format(event.created_at)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
