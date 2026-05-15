import {
  LEAD_STATE_LABELS_AZ,
  leadStateDescriptionAz,
} from "@/lib/leads/labels";
import type { Lead, LeadState } from "@/lib/leads/types";

type Props = {
  lead: Pick<Lead, "state">;
};

const ACCENT_CLASS: Partial<Record<LeadState, string>> = {
  submitted: "border-l-accent-blue",
  dealer_opened: "border-l-accent-blue",
  official_offer: "border-l-success",
  test_drive_requested: "border-l-accent-blue",
  test_drive_confirmed: "border-l-success",
  accepted: "border-l-success",
  expired: "border-l-warning",
  no_response: "border-l-warning",
  whatsapp_handoff: "border-l-accent-blue",
  second_offer: "border-l-accent-blue",
};

export function LeadStatusCard({ lead }: Props) {
  const title = LEAD_STATE_LABELS_AZ[lead.state];
  const description = leadStateDescriptionAz(lead.state);
  const accent = ACCENT_CLASS[lead.state] ?? "border-l-border";

  return (
    <div
      className={`rounded-lg border border-border border-l-4 ${accent} bg-surface-elevated p-4`}
    >
      <p className="text-sm font-medium uppercase tracking-wide text-foreground-muted">
        Sorğu vəziyyəti
      </p>
      <h2 className="mt-1 text-lg font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-foreground-muted">{description}</p>
      ) : null}
    </div>
  );
}
