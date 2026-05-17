import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  LEAD_STATE_LABELS_AZ,
  leadStateDescriptionAz,
} from "@/lib/leads/labels";
import type { Lead, LeadState } from "@/lib/leads/types";

type Props = {
  lead: Pick<Lead, "state">;
};

export const LEAD_STATE_TONE: Record<LeadState, BadgeTone> = {
  draft: "neutral",
  submitted: "blue",
  dealer_opened: "blue",
  official_offer: "success",
  test_drive_requested: "blue",
  test_drive_confirmed: "success",
  accepted: "success",
  expired: "warning",
  no_response: "warning",
  whatsapp_handoff: "success",
  second_offer: "blue",
  closed: "muted",
};

const STATE_BORDER: Record<LeadState, string> = {
  draft: "border-l-border",
  submitted: "border-l-accent-blue",
  dealer_opened: "border-l-accent-blue",
  official_offer: "border-l-success",
  test_drive_requested: "border-l-accent-blue",
  test_drive_confirmed: "border-l-success",
  accepted: "border-l-success",
  expired: "border-l-warning",
  no_response: "border-l-warning",
  whatsapp_handoff: "border-l-accent-green",
  second_offer: "border-l-accent-blue",
  closed: "border-l-border",
};

export function leadStateTone(state: LeadState): BadgeTone {
  return LEAD_STATE_TONE[state];
}

export function LeadStatusCard({ lead }: Props) {
  const title = LEAD_STATE_LABELS_AZ[lead.state];
  const description = leadStateDescriptionAz(lead.state);
  const tone = LEAD_STATE_TONE[lead.state];
  const accent = STATE_BORDER[lead.state];

  return (
    <Card padding="lg" tone="raised" className={`border-l-4 ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Sorğu vəziyyəti
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <Badge tone={tone} size="md">
          {title}
        </Badge>
      </div>
      {description ? (
        <p className="mt-2 text-sm text-foreground-muted">{description}</p>
      ) : null}
    </Card>
  );
}
