import { DECISION_STATUS_LABELS_AZ } from "@/lib/decisions/labels";
import type { DecisionStatus } from "@/lib/decisions/types";

type Props = {
  status: DecisionStatus;
};

const TONE: Record<DecisionStatus, string> = {
  active: "border-accent-orange/40 bg-accent-orange/10 text-accent-orange",
  decided: "border-success/40 bg-success/10 text-success",
  abandoned: "border-foreground-muted/40 bg-surface text-foreground-muted",
  closed: "border-border bg-surface text-foreground-muted",
};

export function DecisionStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${TONE[status]}`}
    >
      {DECISION_STATUS_LABELS_AZ[status]}
    </span>
  );
}
