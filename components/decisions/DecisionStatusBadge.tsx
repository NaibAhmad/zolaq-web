import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { DECISION_STATUS_LABELS_AZ } from "@/lib/decisions/labels";
import type { DecisionStatus } from "@/lib/decisions/types";

type Props = {
  status: DecisionStatus;
  size?: "sm" | "md";
};

const TONE: Record<DecisionStatus, BadgeTone> = {
  active: "orange",
  decided: "success",
  abandoned: "muted",
  closed: "neutral",
};

export function DecisionStatusBadge({ status, size = "sm" }: Props) {
  return (
    <Badge tone={TONE[status]} size={size}>
      {DECISION_STATUS_LABELS_AZ[status]}
    </Badge>
  );
}
