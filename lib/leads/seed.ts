// Mock seed for Sprint 3 Batch 3.1. In-memory only — replace with backend
// API read when the lead service lands. Mirrors lib/cars/seed.ts in shape.
// No raw phone is stored; phone_hash is a placeholder mirroring the format
// produced by the OTP mock for the demo user (see lib/auth/otp-store.ts).

import type { Lead, LeadTimelineEvent } from "./types";

// Demo user identity. `deriveUserId(phoneHash)` produces "user_" + first 16
// chars of phoneHash — keep this seed consistent with that formula so a
// freshly-verified demo session sees these leads.
export const SEED_DEMO_PHONE_HASH = "demo0000000000000000000000000000";
export const SEED_DEMO_USER_ID = "user_demo000000000000";

const DAY = 24 * 60 * 60 * 1000;
const NOW_BASE = 1_715_000_000_000; // fixed epoch base so seed is deterministic.

export const SEED_LEADS: readonly Lead[] = [
  {
    lead_id: "lead_seed_001",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    user_id: SEED_DEMO_USER_ID,
    phone_hash: SEED_DEMO_PHONE_HASH,
    state: "submitted",
    source_surface: "car_detail",
    created_at: NOW_BASE - 1 * DAY,
    updated_at: NOW_BASE - 1 * DAY,
  },
  {
    lead_id: "lead_seed_002",
    trim_id: "trim_kia_ev6_gt_line_awd_2025",
    user_id: SEED_DEMO_USER_ID,
    phone_hash: SEED_DEMO_PHONE_HASH,
    state: "official_offer",
    source_surface: "compare",
    created_at: NOW_BASE - 3 * DAY,
    updated_at: NOW_BASE - 1 * DAY,
  },
  {
    lead_id: "lead_seed_003",
    trim_id: "trim_volvo_xc60_t8_recharge_plus_2025",
    user_id: SEED_DEMO_USER_ID,
    phone_hash: SEED_DEMO_PHONE_HASH,
    state: "closed",
    source_surface: "dealer_profile",
    created_at: NOW_BASE - 7 * DAY,
    updated_at: NOW_BASE - 5 * DAY,
    closed_at: NOW_BASE - 5 * DAY,
  },
];

export const SEED_TIMELINE: readonly LeadTimelineEvent[] = [
  {
    event_id: "evt_seed_001_a",
    lead_id: "lead_seed_001",
    type: "lead_submitted",
    to_state: "submitted",
    actor: "user",
    created_at: NOW_BASE - 1 * DAY,
  },
  {
    event_id: "evt_seed_002_a",
    lead_id: "lead_seed_002",
    type: "lead_submitted",
    to_state: "submitted",
    actor: "user",
    created_at: NOW_BASE - 3 * DAY,
  },
  {
    event_id: "evt_seed_002_b",
    lead_id: "lead_seed_002",
    type: "lead_dealer_opened",
    from_state: "submitted",
    to_state: "dealer_opened",
    actor: "internal_operator",
    created_at: NOW_BASE - 2 * DAY,
  },
  {
    event_id: "evt_seed_002_c",
    lead_id: "lead_seed_002",
    type: "lead_official_offer_received",
    from_state: "dealer_opened",
    to_state: "official_offer",
    actor: "internal_operator",
    created_at: NOW_BASE - 1 * DAY,
  },
  {
    event_id: "evt_seed_003_a",
    lead_id: "lead_seed_003",
    type: "lead_submitted",
    to_state: "submitted",
    actor: "user",
    created_at: NOW_BASE - 7 * DAY,
  },
  {
    event_id: "evt_seed_003_b",
    lead_id: "lead_seed_003",
    type: "lead_closed",
    from_state: "submitted",
    to_state: "closed",
    actor: "user",
    created_at: NOW_BASE - 5 * DAY,
  },
];
