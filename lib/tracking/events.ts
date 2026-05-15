// Tracking event allowlist. Mirrors docs/reference Step 6 v2 TRACKING_EVENTS.json
// exactly. Adding a new event requires updating the spec first.
//
// PII rule (also enforced server-side in app/api/events/route.ts): payloads
// must not contain raw phone, email, or full names. `phone_hash` is allowed.

export const EVENT_NAMES = [
  "search_started",
  "search_completed",
  "catalog_filter_applied",
  "car_card_viewed",
  "car_detail_viewed",
  "price_card_viewed",
  "compare_added",
  "compare_opened",
  "lead_form_opened",
  "lead_form_submitted",
  "otp_requested",
  "otp_verified",
  "whatsapp_clicked",
  "whatsapp_external_opened",
  "dealer_profile_viewed",
  "offer_received",
  "offer_expired",
  "test_drive_requested",
  "test_drive_confirmed",
  "decision_center_opened",
  "decision_created",
  "decision_readiness_updated",
  "next_best_action_clicked",
  "decision_closed",
  "content_viewed",
  "related_model_clicked",
  "cta_clicked",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export function isEventName(value: unknown): value is EventName {
  return (
    typeof value === "string" &&
    (EVENT_NAMES as readonly string[]).includes(value)
  );
}

// Keys that must never appear in event payloads. Server rejects with 422.
export const BANNED_PII_KEYS: readonly string[] = [
  "phone",
  "raw_phone",
  "phone_number",
  "email",
  "full_name",
  "name",
  "first_name",
  "last_name",
];

export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export type EventEnvelope = {
  event_name: EventName;
  session_id: string;
  device_type: DeviceType;
  language: string;
  source_url: string;
  created_at: number;
  payload: Record<string, unknown>;
};
