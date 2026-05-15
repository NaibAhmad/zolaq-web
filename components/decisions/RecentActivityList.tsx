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
      <p className="text-sm text-foreground-muted">
        {emptyLabel ?? "Fəaliyyət hələ qeydə alınmayıb."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface-elevated">
      {visible.map((event) => (
        <li
          key={event.event_id}
          className="flex items-start justify-between gap-3 px-4 py-3"
        >
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
        </li>
      ))}
    </ul>
  );
}
