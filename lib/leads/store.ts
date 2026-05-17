// In-memory lead + timeline store. Module-scoped + pinned to globalThis so
// the data survives Next.js dev-server HMR (same pattern as
// lib/auth/otp-store.ts). Sprint 3.1 only — backend will replace this.
//
// No raw phone is accepted by any function in this module. Callers must pass
// the `phone_hash` already derived in the session layer.

import { randomUUID } from "node:crypto";
import { onOfficialOfferReceived } from "@/lib/gamification/hooks";
import {
  LEAD_ALLOWED_TRANSITIONS,
  LEAD_AUDIT_EVENT,
  canTransition,
} from "./state-machine";
import { SEED_LEADS, SEED_TIMELINE } from "./seed";
import type {
  Lead,
  LeadActor,
  LeadSourceSurface,
  LeadState,
  LeadTimelineEvent,
  PreferredContact,
} from "./types";

type Stores = {
  leadsById: Map<string, Lead>;
  timelineByLead: Map<string, LeadTimelineEvent[]>;
};

const g = globalThis as unknown as { __zlq_lead_stores?: Stores };
const stores: Stores =
  g.__zlq_lead_stores ??
  (g.__zlq_lead_stores = {
    leadsById: new Map(SEED_LEADS.map((l) => [l.lead_id, { ...l }])),
    timelineByLead: groupTimeline(SEED_TIMELINE),
  });

function groupTimeline(
  events: readonly LeadTimelineEvent[]
): Map<string, LeadTimelineEvent[]> {
  const m = new Map<string, LeadTimelineEvent[]>();
  for (const e of events) {
    const arr = m.get(e.lead_id) ?? [];
    arr.push({ ...e });
    m.set(e.lead_id, arr);
  }
  return m;
}

function now(): number {
  return Date.now();
}

export type CreateLeadInput = {
  trim_id: string;
  user_id: string;
  phone_hash: string;
  source_surface: LeadSourceSurface;
  name?: string;
  preferred_contact?: PreferredContact;
  note?: string;
};

export function createLead(input: CreateLeadInput): Lead {
  const lead_id = `lead_${randomUUID()}`;
  const t = now();
  const lead: Lead = {
    lead_id,
    trim_id: input.trim_id,
    user_id: input.user_id,
    phone_hash: input.phone_hash,
    state: "submitted",
    source_surface: input.source_surface,
    created_at: t,
    updated_at: t,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.preferred_contact !== undefined && {
      preferred_contact: input.preferred_contact,
    }),
    ...(input.note !== undefined && { note: input.note }),
  };
  stores.leadsById.set(lead_id, lead);
  appendTimelineEvent({
    lead_id,
    type: LEAD_AUDIT_EVENT.submitted,
    to_state: "submitted",
    actor: "user",
    created_at: t,
  });
  return lead;
}

export function listLeadsForUser(user_id: string): Lead[] {
  const out: Lead[] = [];
  for (const lead of stores.leadsById.values()) {
    if (lead.user_id === user_id) out.push({ ...lead });
  }
  out.sort((a, b) => b.created_at - a.created_at);
  return out;
}

// Sprint 8B admin/dealer panels. Admins see all, dealers will filter by
// trim_ids they own via getOffersByDealerId — see lib/dealer/leads.ts.
export function listAllLeads(): Lead[] {
  return Array.from(stores.leadsById.values())
    .map((l) => ({ ...l }))
    .sort((a, b) => b.created_at - a.created_at);
}

export function listLeadsForTrims(trim_ids: readonly string[]): Lead[] {
  const set = new Set(trim_ids);
  return listAllLeads().filter((l) => set.has(l.trim_id));
}

export function getLeadById(lead_id: string): Lead | null {
  const lead = stores.leadsById.get(lead_id);
  return lead ? { ...lead } : null;
}

export function getLeadForUser(lead_id: string, user_id: string): Lead | null {
  const lead = stores.leadsById.get(lead_id);
  if (!lead || lead.user_id !== user_id) return null;
  return { ...lead };
}

export function getTimelineForLead(lead_id: string): LeadTimelineEvent[] {
  const arr = stores.timelineByLead.get(lead_id) ?? [];
  return arr.map((e) => ({ ...e })).sort((a, b) => a.created_at - b.created_at);
}

export type TransitionError =
  | { kind: "not_found" }
  | {
      kind: "invalid_transition";
      from: LeadState;
      to: LeadState;
      allowed: readonly LeadState[];
    };

export type TransitionResult =
  | { ok: true; lead: Lead; event: LeadTimelineEvent }
  | { ok: false; error: TransitionError };

export function transitionLead(args: {
  lead_id: string;
  to_state: LeadState;
  actor: LeadActor;
  metadata?: Record<string, unknown>;
}): TransitionResult {
  const lead = stores.leadsById.get(args.lead_id);
  if (!lead) return { ok: false, error: { kind: "not_found" } };
  if (!canTransition(lead.state, args.to_state)) {
    return {
      ok: false,
      error: {
        kind: "invalid_transition",
        from: lead.state,
        to: args.to_state,
        allowed: LEAD_ALLOWED_TRANSITIONS[lead.state],
      },
    };
  }
  const t = now();
  const from = lead.state;
  lead.state = args.to_state;
  lead.updated_at = t;
  if (args.to_state === "closed") lead.closed_at = t;

  const event = appendTimelineEvent({
    lead_id: lead.lead_id,
    type: LEAD_AUDIT_EVENT[args.to_state],
    from_state: from,
    to_state: args.to_state,
    actor: args.actor,
    created_at: t,
    metadata: args.metadata,
  });

  // Sprint 8F P0-lite: award the customer the official_offer_received badge
  // when their lead enters the official_offer state. Pure side-effect; does
  // not touch lead state, timeline, or actor semantics.
  if (args.to_state === "official_offer") {
    onOfficialOfferReceived(lead.user_id);
  }

  return { ok: true, lead: { ...lead }, event };
}

function appendTimelineEvent(
  input: Omit<LeadTimelineEvent, "event_id">
): LeadTimelineEvent {
  const event: LeadTimelineEvent = {
    event_id: `evt_${randomUUID()}`,
    ...input,
  };
  const arr = stores.timelineByLead.get(input.lead_id) ?? [];
  arr.push(event);
  stores.timelineByLead.set(input.lead_id, arr);
  return { ...event };
}
