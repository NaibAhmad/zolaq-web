// Seed data for Sprint 5. Anchored on the same NOW_BASE as lib/leads/seed.ts
// so timelines stay coherent. User is the same demo user produced by the OTP
// mock provider (lib/auth/otp-store.ts → deriveUserId).

import { SEED_DEMO_USER_ID } from "@/lib/leads/seed";
import type {
  Decision,
  DecisionHistoryEvent,
  SavedCar,
  ViewedCar,
} from "./types";

export { SEED_DEMO_USER_ID } from "@/lib/leads/seed";

const DAY = 24 * 60 * 60 * 1000;
const NOW_BASE = 1_715_000_000_000; // same anchor as leads seed.

export const SEED_DECISIONS: readonly Decision[] = [
  {
    decision_id: "decision_seed_001",
    user_id: SEED_DEMO_USER_ID,
    title: "Yeni EV seçimi",
    primary_trim_id: "trim_byd_han_ev_premium_awd_2025",
    candidate_trim_ids: [
      "trim_byd_han_ev_premium_awd_2025",
      "trim_kia_ev6_gt_line_awd_2025",
    ],
    lead_ids: ["lead_seed_001", "lead_seed_002"],
    status: "active",
    created_at: NOW_BASE - 4 * DAY,
    updated_at: NOW_BASE - 1 * DAY,
  },
  {
    decision_id: "decision_seed_002",
    user_id: SEED_DEMO_USER_ID,
    title: "Ailə üçün PHEV",
    primary_trim_id: "trim_volvo_xc60_t8_recharge_plus_2025",
    candidate_trim_ids: ["trim_volvo_xc60_t8_recharge_plus_2025"],
    lead_ids: ["lead_seed_003"],
    status: "decided",
    created_at: NOW_BASE - 9 * DAY,
    updated_at: NOW_BASE - 5 * DAY,
    decided_at: NOW_BASE - 5 * DAY,
  },
];

export const SEED_DECISION_HISTORY: readonly DecisionHistoryEvent[] = [
  // decision_seed_001 timeline
  {
    event_id: "devt_seed_001",
    user_id: SEED_DEMO_USER_ID,
    type: "search",
    created_at: NOW_BASE - 5 * DAY,
    metadata: { query: "elektrik sedan" },
  },
  {
    event_id: "devt_seed_002",
    user_id: SEED_DEMO_USER_ID,
    type: "viewed_model",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    created_at: NOW_BASE - 5 * DAY + 2 * 60 * 60 * 1000,
  },
  {
    event_id: "devt_seed_003",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_001",
    type: "saved_car",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    created_at: NOW_BASE - 4 * DAY,
  },
  {
    event_id: "devt_seed_004",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_001",
    type: "comparison_created",
    created_at: NOW_BASE - 4 * DAY + 30 * 60 * 1000,
    metadata: { candidate_count: 2 },
  },
  {
    event_id: "devt_seed_005",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_001",
    type: "lead_submitted",
    lead_id: "lead_seed_001",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    created_at: NOW_BASE - 1 * DAY,
  },
  {
    event_id: "devt_seed_006",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_001",
    type: "lead_submitted",
    lead_id: "lead_seed_002",
    trim_id: "trim_kia_ev6_gt_line_awd_2025",
    created_at: NOW_BASE - 3 * DAY,
  },
  {
    event_id: "devt_seed_007",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_001",
    type: "dealer_replied",
    lead_id: "lead_seed_002",
    dealer_id: "dealer_caspian_auto_group",
    created_at: NOW_BASE - 2 * DAY,
  },
  {
    event_id: "devt_seed_008",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_001",
    type: "official_offer_received",
    lead_id: "lead_seed_002",
    dealer_id: "dealer_caspian_auto_group",
    offer_id: "offer_006",
    trim_id: "trim_kia_ev6_gt_line_awd_2025",
    created_at: NOW_BASE - 1 * DAY,
  },

  // decision_seed_002 timeline
  {
    event_id: "devt_seed_009",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_002",
    type: "saved_car",
    trim_id: "trim_volvo_xc60_t8_recharge_plus_2025",
    created_at: NOW_BASE - 9 * DAY,
  },
  {
    event_id: "devt_seed_010",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_002",
    type: "lead_submitted",
    lead_id: "lead_seed_003",
    trim_id: "trim_volvo_xc60_t8_recharge_plus_2025",
    created_at: NOW_BASE - 7 * DAY,
  },
  {
    event_id: "devt_seed_011",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_002",
    type: "official_offer_received",
    lead_id: "lead_seed_003",
    dealer_id: "dealer_nordic_motors_azerbaijan",
    offer_id: "offer_002",
    trim_id: "trim_volvo_xc60_t8_recharge_plus_2025",
    created_at: NOW_BASE - 6 * DAY,
  },
  {
    event_id: "devt_seed_012",
    user_id: SEED_DEMO_USER_ID,
    decision_id: "decision_seed_002",
    type: "whatsapp_clicked",
    dealer_id: "dealer_nordic_motors_azerbaijan",
    created_at: NOW_BASE - 6 * DAY + 30 * 60 * 1000,
  },
  {
    event_id: "devt_seed_013",
    user_id: SEED_DEMO_USER_ID,
    type: "price_changed",
    offer_id: "offer_002",
    trim_id: "trim_volvo_xc60_t8_recharge_plus_2025",
    created_at: NOW_BASE - 6 * DAY + 6 * 60 * 60 * 1000,
    metadata: { old_amount: 103500, new_amount: 101200, currency: "AZN" },
  },
  {
    event_id: "devt_seed_014",
    user_id: SEED_DEMO_USER_ID,
    type: "offer_expired",
    offer_id: "offer_001",
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    created_at: NOW_BASE - 2 * DAY,
  },
  {
    event_id: "devt_seed_015",
    user_id: SEED_DEMO_USER_ID,
    type: "conflict_detected",
    created_at: NOW_BASE - 1 * DAY - 6 * 60 * 60 * 1000,
    metadata: {
      reason: "iki rəsmi təklif eyni vaxtda aktiv",
      offer_ids: ["offer_002", "offer_006"],
    },
  },
];

export const SEED_SAVED_CARS: readonly SavedCar[] = [
  {
    saved_id: "saved_seed_001",
    user_id: SEED_DEMO_USER_ID,
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    created_at: NOW_BASE - 4 * DAY,
  },
  {
    saved_id: "saved_seed_002",
    user_id: SEED_DEMO_USER_ID,
    trim_id: "trim_kia_ev6_gt_line_awd_2025",
    created_at: NOW_BASE - 4 * DAY + 60 * 60 * 1000,
  },
  {
    saved_id: "saved_seed_003",
    user_id: SEED_DEMO_USER_ID,
    trim_id: "trim_volvo_xc60_t8_recharge_plus_2025",
    created_at: NOW_BASE - 9 * DAY,
  },
];

export const SEED_VIEWED_CARS: readonly ViewedCar[] = [
  {
    viewed_id: "viewed_seed_001",
    user_id: SEED_DEMO_USER_ID,
    trim_id: "trim_byd_han_ev_premium_awd_2025",
    viewed_at: NOW_BASE - 1 * DAY,
  },
  {
    viewed_id: "viewed_seed_002",
    user_id: SEED_DEMO_USER_ID,
    trim_id: "trim_kia_ev6_gt_line_awd_2025",
    viewed_at: NOW_BASE - 1 * DAY - 2 * 60 * 60 * 1000,
  },
  {
    viewed_id: "viewed_seed_003",
    user_id: SEED_DEMO_USER_ID,
    trim_id: "trim_volvo_xc60_t8_recharge_plus_2025",
    viewed_at: NOW_BASE - 6 * DAY,
  },
  {
    viewed_id: "viewed_seed_004",
    user_id: SEED_DEMO_USER_ID,
    trim_id: "trim_toyota_camry_25_hybrid_prestige_2025",
    viewed_at: NOW_BASE - 3 * DAY,
  },
  {
    viewed_id: "viewed_seed_005",
    user_id: SEED_DEMO_USER_ID,
    trim_id: "trim_hongqi_ehs9_ev_6year_2025",
    viewed_at: NOW_BASE - 8 * DAY,
  },
];
