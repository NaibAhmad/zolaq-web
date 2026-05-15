// In-memory store for Decisions, history events, saved cars, viewed cars.
// Pinned to globalThis so dev-server HMR keeps the seed data intact. Mirrors
// lib/leads/store.ts. Sprint 5 only — backend will replace this.

import { randomUUID } from "node:crypto";
import {
  SEED_DECISIONS,
  SEED_DECISION_HISTORY,
  SEED_SAVED_CARS,
  SEED_VIEWED_CARS,
} from "./seed";
import type {
  Decision,
  DecisionHistoryEvent,
  DecisionHistoryEventType,
  DecisionStatus,
  SavedCar,
  ViewedCar,
} from "./types";

type Stores = {
  decisionsById: Map<string, Decision>;
  historyById: Map<string, DecisionHistoryEvent>;
  savedById: Map<string, SavedCar>;
  viewedById: Map<string, ViewedCar>;
};

const g = globalThis as unknown as { __zlq_decision_stores?: Stores };
const stores: Stores =
  g.__zlq_decision_stores ??
  (g.__zlq_decision_stores = {
    decisionsById: new Map(
      SEED_DECISIONS.map((d) => [d.decision_id, cloneDecision(d)])
    ),
    historyById: new Map(
      SEED_DECISION_HISTORY.map((e) => [e.event_id, { ...e }])
    ),
    savedById: new Map(SEED_SAVED_CARS.map((s) => [s.saved_id, { ...s }])),
    viewedById: new Map(SEED_VIEWED_CARS.map((v) => [v.viewed_id, { ...v }])),
  });

function cloneDecision(d: Decision): Decision {
  return {
    ...d,
    candidate_trim_ids: [...d.candidate_trim_ids],
    lead_ids: [...d.lead_ids],
  };
}

function now(): number {
  return Date.now();
}

// --- Decisions ---------------------------------------------------------------

export function listDecisionsForUser(user_id: string): Decision[] {
  const out: Decision[] = [];
  for (const d of stores.decisionsById.values()) {
    if (d.user_id === user_id) out.push(cloneDecision(d));
  }
  out.sort((a, b) => b.created_at - a.created_at);
  return out;
}

export function getDecisionForUser(
  decision_id: string,
  user_id: string
): Decision | null {
  const d = stores.decisionsById.get(decision_id);
  if (!d || d.user_id !== user_id) return null;
  return cloneDecision(d);
}

export type CreateDecisionInput = {
  user_id: string;
  primary_trim_id: string;
  candidate_trim_ids?: string[];
  lead_ids?: string[];
  title?: string;
};

export function createDecision(input: CreateDecisionInput): Decision {
  const decision_id = `decision_${randomUUID()}`;
  const t = now();
  const candidates = input.candidate_trim_ids?.length
    ? [...input.candidate_trim_ids]
    : [input.primary_trim_id];
  const decision: Decision = {
    decision_id,
    user_id: input.user_id,
    title: input.title?.trim() || "Yeni qərar",
    primary_trim_id: input.primary_trim_id,
    candidate_trim_ids: candidates,
    lead_ids: input.lead_ids ? [...input.lead_ids] : [],
    status: "active",
    created_at: t,
    updated_at: t,
  };
  stores.decisionsById.set(decision_id, decision);
  appendHistoryEvent({
    user_id: input.user_id,
    decision_id,
    type: "saved_car",
    trim_id: input.primary_trim_id,
    created_at: t,
  });
  return cloneDecision(decision);
}

export type UpdateDecisionPatch = {
  title?: string;
  status?: DecisionStatus;
  candidate_trim_ids?: string[];
  lead_ids?: string[];
  note?: string;
};

export function updateDecision(
  decision_id: string,
  user_id: string,
  patch: UpdateDecisionPatch
): Decision | null {
  const d = stores.decisionsById.get(decision_id);
  if (!d || d.user_id !== user_id) return null;
  const t = now();
  if (patch.title !== undefined) d.title = patch.title.trim() || d.title;
  if (patch.candidate_trim_ids !== undefined)
    d.candidate_trim_ids = [...patch.candidate_trim_ids];
  if (patch.lead_ids !== undefined) d.lead_ids = [...patch.lead_ids];
  if (patch.note !== undefined) d.note = patch.note;
  if (patch.status !== undefined && patch.status !== d.status) {
    d.status = patch.status;
    if (patch.status === "decided") d.decided_at = t;
    if (patch.status === "abandoned") d.abandoned_at = t;
    if (patch.status === "closed") d.closed_at = t;
  }
  d.updated_at = t;
  return cloneDecision(d);
}

export function closeDecision(
  decision_id: string,
  user_id: string
): Decision | null {
  return updateDecision(decision_id, user_id, { status: "closed" });
}

// --- History -----------------------------------------------------------------

export type AppendHistoryInput = Omit<DecisionHistoryEvent, "event_id"> & {
  type: DecisionHistoryEventType;
};

export function appendHistoryEvent(
  input: AppendHistoryInput
): DecisionHistoryEvent {
  const event: DecisionHistoryEvent = {
    event_id: `devt_${randomUUID()}`,
    ...input,
  };
  stores.historyById.set(event.event_id, event);
  return { ...event };
}

export type ListHistoryOptions = {
  limit?: number;
  decisionId?: string;
};

export function listHistoryForUser(
  user_id: string,
  options: ListHistoryOptions = {}
): DecisionHistoryEvent[] {
  const out: DecisionHistoryEvent[] = [];
  for (const e of stores.historyById.values()) {
    if (e.user_id !== user_id) continue;
    if (options.decisionId && e.decision_id !== options.decisionId) continue;
    out.push({ ...e });
  }
  out.sort((a, b) => b.created_at - a.created_at);
  if (options.limit !== undefined && options.limit >= 0) {
    return out.slice(0, options.limit);
  }
  return out;
}

// --- Saved -------------------------------------------------------------------

export function listSavedForUser(user_id: string): SavedCar[] {
  const out: SavedCar[] = [];
  for (const s of stores.savedById.values()) {
    if (s.user_id === user_id) out.push({ ...s });
  }
  out.sort((a, b) => b.created_at - a.created_at);
  return out;
}

// --- Viewed ------------------------------------------------------------------

export function listViewedForUser(user_id: string): ViewedCar[] {
  const out: ViewedCar[] = [];
  for (const v of stores.viewedById.values()) {
    if (v.user_id === user_id) out.push({ ...v });
  }
  out.sort((a, b) => b.viewed_at - a.viewed_at);
  return out;
}
