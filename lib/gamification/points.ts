// Sprint 8F minimal private points ledger. Owner-visible only — no leaderboard,
// no public ranking, no cash value. Points have daily caps per action.
// Moderator can reverse a grant (used when a rejected Q&A submission removes
// the originating point grant).

import { randomUUID } from "node:crypto";
import { writeAudit } from "@/lib/admin/audit";

export const POINT_ACTIONS = [
  "bazar_vote",
  "qa_question",
  "qa_answer_approved",
  "comparison",
  "verified_lead_submit",
  "encyclopedia_read",
  "news_read",
] as const;
export type PointAction = (typeof POINT_ACTIONS)[number];

const POINT_VALUES: Record<PointAction, number> = {
  bazar_vote: 5,
  qa_question: 10,
  qa_answer_approved: 15,
  comparison: 5,
  verified_lead_submit: 20,
  encyclopedia_read: 2,
  news_read: 2,
};

const DAILY_CAPS: Record<PointAction, number> = {
  bazar_vote: 3,
  qa_question: 5,
  qa_answer_approved: 5,
  comparison: 5,
  verified_lead_submit: 3,
  encyclopedia_read: 5,
  news_read: 5,
};

export type PointGrant = {
  point_grant_id: string;
  user_id: string;
  action: PointAction;
  points: number;
  metadata: Record<string, unknown>;
  granted_at: number;
  reversed_at?: number;
  reverse_reason?: string;
};

type Store = { grants: Map<string, PointGrant> };
const g = globalThis as unknown as { __zlq_points_store?: Store };
const store: Store =
  g.__zlq_points_store ?? (g.__zlq_points_store = { grants: new Map() });

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function todayGrantCount(userId: string, action: PointAction): number {
  const start = startOfTodayMs();
  let n = 0;
  for (const g of store.grants.values()) {
    if (
      g.user_id === userId &&
      g.action === action &&
      g.granted_at >= start &&
      !g.reversed_at
    ) {
      n += 1;
    }
  }
  return n;
}

export type GrantResult =
  | { ok: true; grant: PointGrant }
  | { ok: false; reason: "capped"; cap: number }
  | { ok: false; reason: "duplicate" };

export function grantPoints(
  userId: string,
  action: PointAction,
  metadata: Record<string, unknown> = {},
  options: { dedupeKey?: string } = {},
): GrantResult {
  if (options.dedupeKey) {
    for (const g of store.grants.values()) {
      if (
        g.user_id === userId &&
        g.action === action &&
        g.metadata.dedupe_key === options.dedupeKey &&
        !g.reversed_at
      ) {
        return { ok: false, reason: "duplicate" };
      }
    }
  }
  const cap = DAILY_CAPS[action];
  if (todayGrantCount(userId, action) >= cap) {
    return { ok: false, reason: "capped", cap };
  }
  const grant: PointGrant = {
    point_grant_id: `pg_${randomUUID()}`,
    user_id: userId,
    action,
    points: POINT_VALUES[action],
    metadata: options.dedupeKey
      ? { ...metadata, dedupe_key: options.dedupeKey }
      : metadata,
    granted_at: Date.now(),
  };
  store.grants.set(grant.point_grant_id, grant);
  writeAudit({
    actor_type: "system",
    actor_id: userId,
    role: "customer",
    action: "point.grant",
    entity_type: "point_grant",
    entity_id: grant.point_grant_id,
    after: { action, points: grant.points, metadata: grant.metadata },
  });
  return { ok: true, grant: { ...grant } };
}

export function reversePoints(
  grantId: string,
  reason: string,
  actor: { actor_id: string; role: string },
): PointGrant | null {
  const g = store.grants.get(grantId);
  if (!g || g.reversed_at) return null;
  const next: PointGrant = {
    ...g,
    reversed_at: Date.now(),
    reverse_reason: reason,
  };
  store.grants.set(grantId, next);
  writeAudit({
    actor_type: "admin",
    actor_id: actor.actor_id,
    role: actor.role,
    action: "point.reverse",
    entity_type: "point_grant",
    entity_id: grantId,
    before: { points: g.points },
    after: { reversed: true, reason },
    note: reason,
  });
  return { ...next };
}

export function listUserPointGrants(userId: string): PointGrant[] {
  const rows: PointGrant[] = [];
  for (const g of store.grants.values()) {
    if (g.user_id === userId) rows.push({ ...g });
  }
  rows.sort((a, b) => b.granted_at - a.granted_at);
  return rows;
}

export function userPointTotal(userId: string): number {
  let total = 0;
  for (const g of store.grants.values()) {
    if (g.user_id === userId && !g.reversed_at) total += g.points;
  }
  return total;
}

export const POINT_ACTION_LABEL_AZ: Record<PointAction, string> = {
  bazar_vote: "Bazar Nəbzində səs verdin",
  qa_question: "Sual soruşdun",
  qa_answer_approved: "Cavabın təsdiq olundu",
  comparison: "Müqayisə etdin",
  verified_lead_submit: "Təsdiqli sorğu göndərdin",
  encyclopedia_read: "Ensiklopediya oxudun",
  news_read: "Xəbər oxudun",
};

// Sprint 10I-D: translation key for each point action. The client uses these
// to render the activity label in the user's locale. Keys live under
// `pointActions.*` in lib/i18n/translations/common.*.json.
import type { TranslationKey } from "@/lib/i18n/types";

export const POINT_ACTION_KEY_BY_ACTION: Record<PointAction, TranslationKey> = {
  bazar_vote: "pointActions.bazarVote",
  qa_question: "pointActions.qaQuestion",
  qa_answer_approved: "pointActions.qaAnswerApproved",
  comparison: "pointActions.comparison",
  verified_lead_submit: "pointActions.verifiedLeadSubmit",
  encyclopedia_read: "pointActions.encyclopediaRead",
  news_read: "pointActions.newsRead",
};
