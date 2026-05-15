// Allowed transitions, trigger types, and audit-event names per
// docs/reference/.../LEAD_STATE_MACHINE.json. Source of truth — keep in sync.

import type { LeadActor, LeadState, LeadTimelineEventType } from "./types";

export const LEAD_ALLOWED_TRANSITIONS: Record<LeadState, readonly LeadState[]> = {
  draft: ["submitted", "closed"],
  submitted: ["dealer_opened", "no_response", "whatsapp_handoff", "closed"],
  dealer_opened: ["official_offer", "no_response", "second_offer", "closed"],
  official_offer: [
    "test_drive_requested",
    "accepted",
    "expired",
    "second_offer",
    "whatsapp_handoff",
    "closed",
  ],
  test_drive_requested: ["test_drive_confirmed", "closed"],
  test_drive_confirmed: ["accepted", "second_offer", "closed"],
  whatsapp_handoff: ["official_offer", "closed"],
  expired: ["second_offer", "official_offer", "closed"],
  no_response: ["second_offer", "closed"],
  second_offer: ["submitted", "closed"],
  accepted: ["closed"],
  closed: [],
};

export const LEAD_STATE_TRIGGER: Record<LeadState, LeadActor> = {
  draft: "user",
  submitted: "user",
  dealer_opened: "internal_operator",
  official_offer: "internal_operator",
  test_drive_requested: "user",
  test_drive_confirmed: "internal_operator",
  whatsapp_handoff: "user",
  expired: "system",
  no_response: "system",
  second_offer: "user",
  accepted: "user",
  closed: "user",
};

export const LEAD_AUDIT_EVENT: Record<LeadState, LeadTimelineEventType> = {
  draft: "lead_draft_created",
  submitted: "lead_submitted",
  dealer_opened: "lead_dealer_opened",
  official_offer: "lead_official_offer_received",
  test_drive_requested: "test_drive_requested",
  test_drive_confirmed: "test_drive_confirmed",
  whatsapp_handoff: "whatsapp_handoff_created",
  expired: "offer_expired",
  no_response: "lead_no_response",
  second_offer: "second_offer_requested",
  accepted: "offer_accepted",
  closed: "lead_closed",
};

export function canTransition(from: LeadState, to: LeadState): boolean {
  return LEAD_ALLOWED_TRANSITIONS[from].includes(to);
}
