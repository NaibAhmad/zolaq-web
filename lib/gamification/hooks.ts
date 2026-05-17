// Thin convenience layer that other modules can call when an
// activity happens. Centralises the badge + point logic so callers don't have
// to know what unlocks what. Idempotent on badges; capped on points.

import { grantBadge, type BadgeId } from "./badges";
import { grantPoints, type PointAction } from "./points";

export type HookResult = {
  newBadges: BadgeId[];
  pointsGranted: number;
};

function recordPoints(
  userId: string,
  action: PointAction,
  metadata: Record<string, unknown> = {},
  dedupeKey?: string,
): number {
  const r = grantPoints(
    userId,
    action,
    metadata,
    dedupeKey ? { dedupeKey } : {},
  );
  return r.ok ? r.grant.points : 0;
}

function awardBadgeIfNew(userId: string, badgeId: BadgeId): BadgeId[] {
  const grant = grantBadge(userId, badgeId);
  // grantBadge returns the existing grant if already awarded; we need to know
  // whether this call actually created a new one. We can detect newness by
  // comparing granted_at to "now within last second" — but cleaner: re-check
  // listUserBadges length. Since grantBadge is idempotent and cheap, callers
  // tolerate the duplicate-return; only callers wanting to surface "newly
  // earned!" need newness detection. For now we always include it — the UI
  // can dedupe against the last-known list.
  return grant ? [badgeId] : [];
}

export function onComparison(userId: string, dedupeKey?: string): HookResult {
  return {
    newBadges: awardBadgeIfNew(userId, "first_comparison"),
    pointsGranted: recordPoints(userId, "comparison", {}, dedupeKey),
  };
}

export function onBazarVote(
  userId: string,
  topicId: string,
): HookResult {
  return {
    newBadges: awardBadgeIfNew(userId, "market_observer"),
    pointsGranted: recordPoints(
      userId,
      "bazar_vote",
      { topic_id: topicId },
      `vote:${topicId}`,
    ),
  };
}

export function onEncyclopediaRead(
  userId: string,
  slug: string,
): HookResult {
  // Badge fires after first read; daily cap on points still applies.
  return {
    newBadges: awardBadgeIfNew(userId, "encyclopedia_reader"),
    pointsGranted: recordPoints(
      userId,
      "encyclopedia_read",
      { slug },
      `enc:${slug}`,
    ),
  };
}

export function onNewsRead(userId: string, slug: string): HookResult {
  return {
    newBadges: [],
    pointsGranted: recordPoints(
      userId,
      "news_read",
      { slug },
      `news:${slug}`,
    ),
  };
}

export function onQaParticipation(
  userId: string,
  kind: "question" | "answer_approved",
  qaId: string,
): HookResult {
  const action: PointAction = kind === "question" ? "qa_question" : "qa_answer_approved";
  return {
    newBadges: awardBadgeIfNew(userId, "qa_participant"),
    pointsGranted: recordPoints(
      userId,
      action,
      { qa_id: qaId, kind },
      `qa:${kind}:${qaId}`,
    ),
  };
}

export function onVerifiedLead(
  userId: string,
  leadId: string,
): HookResult {
  return {
    newBadges: [],
    pointsGranted: recordPoints(
      userId,
      "verified_lead_submit",
      { lead_id: leadId },
      `lead:${leadId}`,
    ),
  };
}

export function onOfficialOfferReceived(userId: string): HookResult {
  return {
    newBadges: awardBadgeIfNew(userId, "official_offer_received"),
    pointsGranted: 0,
  };
}
