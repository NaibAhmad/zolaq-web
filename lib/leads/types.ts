// Lead / Sorğu domain types. Source of truth for canonical states is
// docs/reference/.../LEAD_STATE_MACHINE.json — keep in sync.

import type { EnergyType } from "@/lib/cars/types";

export const LEAD_STATES = [
  "draft",
  "submitted",
  "dealer_opened",
  "official_offer",
  "test_drive_requested",
  "test_drive_confirmed",
  "whatsapp_handoff",
  "expired",
  "no_response",
  "second_offer",
  "accepted",
  "closed",
] as const;

export type LeadState = (typeof LEAD_STATES)[number];

export function isLeadState(value: unknown): value is LeadState {
  return (
    typeof value === "string" && (LEAD_STATES as readonly string[]).includes(value)
  );
}

export const LEAD_SOURCE_SURFACES = [
  "car_detail",
  "catalog",
  "compare",
  "dealer_profile",
  "content",
  "decision_center",
] as const;

export type LeadSourceSurface = (typeof LEAD_SOURCE_SURFACES)[number];

export function isLeadSourceSurface(value: unknown): value is LeadSourceSurface {
  return (
    typeof value === "string" &&
    (LEAD_SOURCE_SURFACES as readonly string[]).includes(value)
  );
}

export type LeadActor = "user" | "internal_operator" | "system";

export const PREFERRED_CONTACTS = ["phone", "whatsapp"] as const;

export type PreferredContact = (typeof PREFERRED_CONTACTS)[number];

export function isPreferredContact(value: unknown): value is PreferredContact {
  return (
    typeof value === "string" &&
    (PREFERRED_CONTACTS as readonly string[]).includes(value)
  );
}

export type Lead = {
  lead_id: string;
  trim_id: string;
  user_id: string;
  phone_hash: string;
  state: LeadState;
  source_surface: LeadSourceSurface;
  created_at: number;
  updated_at: number;
  closed_at?: number;
  previous_lead_id?: string;
  name?: string;
  preferred_contact?: PreferredContact;
  note?: string;
};

export type LeadTrimSummary = {
  trim_id: string;
  brand_id: string;
  brand_name: string;
  model_name: string;
  display_name: string;
  year: number;
  energy_type: EnergyType;
  image_url?: string | null;
};

export type LeadWithTrim = Lead & { trim: LeadTrimSummary };

export type LeadTimelineEventType =
  | "lead_draft_created"
  | "lead_submitted"
  | "lead_dealer_opened"
  | "lead_official_offer_received"
  | "test_drive_requested"
  | "test_drive_confirmed"
  | "whatsapp_handoff_created"
  | "offer_expired"
  | "lead_no_response"
  | "second_offer_requested"
  | "offer_accepted"
  | "lead_closed";

export type LeadTimelineEvent = {
  event_id: string;
  lead_id: string;
  type: LeadTimelineEventType;
  from_state?: LeadState;
  to_state?: LeadState;
  actor: LeadActor;
  created_at: number;
  metadata?: Record<string, unknown>;
};
