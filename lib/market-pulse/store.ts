// Bazar Nəbzi store. globalThis-pinned Maps for topics + votes. Voting
// requires an OTP session (enforced at the API route); one vote per user per
// topic; topic must be `active`.

import { randomUUID } from "node:crypto";
import { writeAudit } from "@/lib/admin/audit";
import { BAZAR_TOPIC_SEED, BAZAR_VOTE_SEED } from "./seed";
import type {
  BazarAggregate,
  BazarCadence,
  BazarOption,
  BazarTopic,
  BazarTopicStatus,
  BazarVote,
} from "./types";

type Store = {
  topics: Map<string, BazarTopic>;
  votes: Map<string, BazarVote>;
};

const g = globalThis as unknown as { __zlq_bazar_store?: Store };
const store: Store =
  g.__zlq_bazar_store ??
  (g.__zlq_bazar_store = {
    topics: new Map(BAZAR_TOPIC_SEED.map((t) => [t.topic_id, { ...t }])),
    votes: new Map(BAZAR_VOTE_SEED.map((v) => [v.vote_id, { ...v }])),
  });

export type CreateTopicInput = {
  question: string;
  cadence: BazarCadence;
  options: ReadonlyArray<{ label: string; option_id?: string }>;
  start_date: string;
  end_date: string;
  sponsored?: boolean;
  sponsor_ad_request_id?: string;
  sponsor_name?: string;
  created_by: string;
};

export function createTopic(input: CreateTopicInput, actor: {
  actor_type: "admin";
  actor_id: string;
  role: string;
}): BazarTopic {
  const topic_id = `bz_${randomUUID()}`;
  const t = Date.now();
  const options: BazarOption[] = input.options.map((o, i) => ({
    option_id: o.option_id ?? `opt_${i + 1}_${randomUUID().slice(0, 6)}`,
    label: o.label,
  }));
  const row: BazarTopic = {
    topic_id,
    question: input.question,
    cadence: input.cadence,
    status: input.sponsored ? "sponsored_pending_approval" : "draft",
    options,
    start_date: input.start_date,
    end_date: input.end_date,
    sponsored: !!input.sponsored,
    ...(input.sponsor_ad_request_id !== undefined && {
      sponsor_ad_request_id: input.sponsor_ad_request_id,
    }),
    ...(input.sponsor_name !== undefined && { sponsor_name: input.sponsor_name }),
    created_by: input.created_by,
    created_at: t,
    updated_at: t,
  };
  store.topics.set(topic_id, row);
  writeAudit({
    actor_type: actor.actor_type,
    actor_id: actor.actor_id,
    role: actor.role,
    action: "bazar_topic.create",
    entity_type: "bazar_topic",
    entity_id: topic_id,
    after: { ...row },
  });
  return { ...row };
}

export type TopicFilter = {
  cadence?: BazarCadence;
  status?: BazarTopicStatus | readonly BazarTopicStatus[];
};

export function listTopics(filter: TopicFilter = {}): BazarTopic[] {
  let rows = Array.from(store.topics.values());
  if (filter.cadence) rows = rows.filter((t) => t.cadence === filter.cadence);
  if (filter.status) {
    const allowed = Array.isArray(filter.status) ? filter.status : [filter.status];
    rows = rows.filter((t) =>
      (allowed as readonly BazarTopicStatus[]).includes(t.status),
    );
  }
  rows.sort((a, b) => b.updated_at - a.updated_at);
  return rows.map((t) => ({ ...t, options: t.options.map((o) => ({ ...o })) }));
}

export function getTopic(id: string): BazarTopic | null {
  const t = store.topics.get(id);
  if (!t) return null;
  return { ...t, options: t.options.map((o) => ({ ...o })) };
}

const ALLOWED_TRANSITIONS: Record<BazarTopicStatus, readonly BazarTopicStatus[]> = {
  draft: ["active", "rejected"],
  sponsored_pending_approval: ["active", "rejected"],
  active: ["closed"],
  closed: ["resolved", "archived"],
  resolved: ["archived"],
  archived: [],
  rejected: [],
};

const ACTION_FOR: Record<BazarTopicStatus, Parameters<typeof writeAudit>[0]["action"]> = {
  draft: "bazar_topic.update",
  sponsored_pending_approval: "bazar_topic.update",
  active: "bazar_topic.publish",
  closed: "bazar_topic.close",
  resolved: "bazar_topic.resolve",
  archived: "bazar_topic.archive",
  rejected: "bazar_topic.reject",
};

export function transitionTopic(input: {
  id: string;
  to: BazarTopicStatus;
  actor: { actor_id: string; role: string };
  market_summary?: string;
  rejection_reason?: string;
}): { ok: true; row: BazarTopic } | { ok: false; error: "not_found" | "invalid_transition" } {
  const before = store.topics.get(input.id);
  if (!before) return { ok: false, error: "not_found" };
  if (!ALLOWED_TRANSITIONS[before.status].includes(input.to)) {
    return { ok: false, error: "invalid_transition" };
  }
  const t = Date.now();
  const next: BazarTopic = {
    ...before,
    status: input.to,
    updated_at: t,
    ...(input.market_summary !== undefined && {
      market_summary: input.market_summary,
    }),
    ...(input.rejection_reason !== undefined && {
      rejection_reason: input.rejection_reason,
    }),
    ...(input.to === "closed" && { closed_at: t }),
    ...(input.to === "resolved" && { resolved_at: t }),
    ...(input.to === "archived" && { archived_at: t }),
  };
  store.topics.set(input.id, next);
  writeAudit({
    actor_type: "admin",
    actor_id: input.actor.actor_id,
    role: input.actor.role,
    action: ACTION_FOR[input.to],
    entity_type: "bazar_topic",
    entity_id: input.id,
    before: { status: before.status },
    after: { status: next.status },
  });
  return { ok: true, row: { ...next, options: next.options.map((o) => ({ ...o })) } };
}

export function updateTopic(id: string, patch: Partial<Pick<BazarTopic, "question" | "options" | "start_date" | "end_date" | "sponsor_name" | "sponsor_ad_request_id">>, actor: { actor_id: string; role: string }): BazarTopic | null {
  const before = store.topics.get(id);
  if (!before) return null;
  const next: BazarTopic = {
    ...before,
    ...patch,
    updated_at: Date.now(),
  };
  store.topics.set(id, next);
  writeAudit({
    actor_type: "admin",
    actor_id: actor.actor_id,
    role: actor.role,
    action: "bazar_topic.update",
    entity_type: "bazar_topic",
    entity_id: id,
    before: { ...before },
    after: { ...next },
  });
  return { ...next, options: next.options.map((o) => ({ ...o })) };
}

export type CastVoteResult =
  | { ok: true; vote: BazarVote }
  | {
      ok: false;
      error:
        | "topic_not_found"
        | "topic_not_active"
        | "option_not_found"
        | "already_voted";
    };

export function castVote(input: {
  topic_id: string;
  option_id: string;
  user_id: string;
}): CastVoteResult {
  const topic = store.topics.get(input.topic_id);
  if (!topic) return { ok: false, error: "topic_not_found" };
  if (topic.status !== "active") return { ok: false, error: "topic_not_active" };
  if (!topic.options.some((o) => o.option_id === input.option_id)) {
    return { ok: false, error: "option_not_found" };
  }
  for (const v of store.votes.values()) {
    if (
      v.topic_id === input.topic_id &&
      v.user_id === input.user_id &&
      !v.invalidated
    ) {
      return { ok: false, error: "already_voted" };
    }
  }
  const vote: BazarVote = {
    vote_id: `bv_${randomUUID()}`,
    topic_id: input.topic_id,
    option_id: input.option_id,
    user_id: input.user_id,
    created_at: Date.now(),
  };
  store.votes.set(vote.vote_id, vote);
  writeAudit({
    actor_type: "system",
    actor_id: input.user_id,
    role: "customer",
    action: "bazar_vote.cast",
    entity_type: "bazar_vote",
    entity_id: vote.vote_id,
    after: { topic_id: vote.topic_id, option_id: vote.option_id },
  });
  return { ok: true, vote: { ...vote } };
}

export function hasVoted(topicId: string, userId: string): BazarVote | null {
  for (const v of store.votes.values()) {
    if (v.topic_id === topicId && v.user_id === userId && !v.invalidated) {
      return { ...v };
    }
  }
  return null;
}

export function aggregateTopic(topicId: string): BazarAggregate | null {
  const topic = store.topics.get(topicId);
  if (!topic) return null;
  const counts = new Map<string, number>(topic.options.map((o) => [o.option_id, 0]));
  let total = 0;
  for (const v of store.votes.values()) {
    if (v.topic_id !== topicId || v.invalidated) continue;
    counts.set(v.option_id, (counts.get(v.option_id) ?? 0) + 1);
    total += 1;
  }
  const options = topic.options.map((o) => {
    const count = counts.get(o.option_id) ?? 0;
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
    return { option_id: o.option_id, label: o.label, count, pct };
  });
  return { topic_id: topicId, options, total };
}

export function listUserVotes(userId: string): BazarVote[] {
  const rows: BazarVote[] = [];
  for (const v of store.votes.values()) {
    if (v.user_id === userId && !v.invalidated) rows.push({ ...v });
  }
  rows.sort((a, b) => b.created_at - a.created_at);
  return rows;
}

// Used by the homepage block — pick one active topic, preferring weekly >
// daily > monthly (per docs/sprint-7j/MARKET_PULSE_MODULE.md).
export function pickFeaturedActiveTopic(): BazarTopic | null {
  const actives = Array.from(store.topics.values()).filter(
    (t) => t.status === "active",
  );
  const order: Record<BazarCadence, number> = {
    weekly: 0,
    daily: 1,
    monthly: 2,
  };
  actives.sort((a, b) => order[a.cadence] - order[b.cadence]);
  return actives[0] ? { ...actives[0], options: actives[0].options.map((o) => ({ ...o })) } : null;
}
