// Decision domain types. Sprint 5. Pure types + runtime guards; no I/O.
// The Decision entity bundles a buying decision: one primary trim + candidate
// trims (from saved cars) + linked leads. Status enum is its own — separate
// from LeadState (lib/leads/types.ts) on purpose.

import type { LeadTrimSummary, LeadWithTrim } from "@/lib/leads/types";
import type { PriceRecord } from "@/lib/cars/types";

export const DECISION_STATUSES = [
  "active",
  "decided",
  "abandoned",
  "closed",
] as const;

export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export function isDecisionStatus(value: unknown): value is DecisionStatus {
  return (
    typeof value === "string" &&
    (DECISION_STATUSES as readonly string[]).includes(value)
  );
}

export const DECISION_HISTORY_EVENT_TYPES = [
  "search",
  "viewed_model",
  "saved_car",
  "comparison_created",
  "lead_submitted",
  "dealer_replied",
  "official_offer_received",
  "whatsapp_clicked",
  "test_drive_requested",
  "price_changed",
  "conflict_detected",
  "offer_expired",
] as const;

export type DecisionHistoryEventType =
  (typeof DECISION_HISTORY_EVENT_TYPES)[number];

export function isDecisionHistoryEventType(
  value: unknown
): value is DecisionHistoryEventType {
  return (
    typeof value === "string" &&
    (DECISION_HISTORY_EVENT_TYPES as readonly string[]).includes(value)
  );
}

export type Decision = {
  decision_id: string;
  user_id: string;
  title: string;
  primary_trim_id: string;
  candidate_trim_ids: string[];
  lead_ids: string[];
  status: DecisionStatus;
  created_at: number;
  updated_at: number;
  decided_at?: number;
  closed_at?: number;
  abandoned_at?: number;
  note?: string;
};

export type DecisionHistoryEvent = {
  event_id: string;
  user_id: string;
  decision_id?: string;
  type: DecisionHistoryEventType;
  trim_id?: string;
  lead_id?: string;
  dealer_id?: string;
  offer_id?: string;
  created_at: number;
  metadata?: Record<string, unknown>;
};

export type SavedCar = {
  saved_id: string;
  user_id: string;
  trim_id: string;
  created_at: number;
};

export type ViewedCar = {
  viewed_id: string;
  user_id: string;
  trim_id: string;
  viewed_at: number;
};

export type SavedCarWithTrim = SavedCar & { trim: LeadTrimSummary };
export type ViewedCarWithTrim = ViewedCar & { trim: LeadTrimSummary };

export type ReadinessFactorKey =
  | "profile_completeness"
  | "research_activity"
  | "compare_activity"
  | "official_offers"
  | "test_drive_stage"
  | "budget_match";

export type ScoreBreakdownEntry = {
  key: ReadinessFactorKey;
  weight_pct: number;
  achieved_pct: number; // 0..1
  contribution: number; // 0..weight_pct, rounded
  label_az: string;
};

export type NextBestActionCode =
  | "complete_profile"
  | "view_cars"
  | "create_comparison"
  | "request_offer"
  | "request_test_drive"
  | "review_offer"
  | "all_set";

export type NextBestAction = {
  code: NextBestActionCode;
  title_az: string;
  description_az: string;
  href?: string;
};

export type ReadinessSummary = {
  readiness_score: number; // 0..100, integer
  score_breakdown: ScoreBreakdownEntry[];
  next_best_action: NextBestAction;
};

export type DecisionCenterSummary = {
  readiness: ReadinessSummary;
  active_leads_count: number;
  saved_cars_count: number;
  comparisons_count: number;
  dealer_offers_count: number;
  recent_activity: DecisionHistoryEvent[];
};

export type DecisionWorkspaceResponse = {
  decision: Decision;
  leads: LeadWithTrim[];
  saved: SavedCarWithTrim[];
  offers: PriceRecord[];
  history: DecisionHistoryEvent[];
};
