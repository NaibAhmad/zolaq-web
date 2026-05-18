// Unified profile activity timeline. Aggregates from existing stores plus
// gamification (votes, badges, points). Reader only — no new event table.
// Owner-visible; dealer and admin paths do not query this.
// Sprint 10I-D: ActivityItem now carries a labelKey + labelParams so the
// client can render in the user's locale. The legacy `label` field stays
// populated with the AZ string for backward compatibility.

import { trimSummaryFor } from "@/lib/cars/summary";
import { getLocalizedText } from "@/lib/i18n/localized";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { TranslationKey, TranslationParams } from "@/lib/i18n/types";
import {
  getTimelineForLead,
  listLeadsForUser,
} from "@/lib/leads/store";
import { LEAD_STATE_LABELS_AZ } from "@/lib/leads/labels";
import { listSavedForUser, listViewedForUser } from "@/lib/decisions/store";
import { getTopic, listUserVotes } from "@/lib/market-pulse/store";
import { BADGE_CATALOGUE, listUserBadges } from "./badges";
import {
  listUserPointGrants,
  POINT_ACTION_LABEL_AZ,
  POINT_ACTION_KEY_BY_ACTION,
  type PointAction,
} from "./points";

export type ActivityItem = {
  id: string;
  kind:
    | "vote"
    | "badge"
    | "point"
    | "lead"
    | "lead_status"
    | "comparison"
    | "saved"
    | "viewed"
    | "content";
  label: string;
  detail?: string;
  at: number;
  // Sprint 10I-D: translation hints for the client. `labelKey` is the
  // dictionary key; `labelParams` carries interpolation values that are
  // language-neutral (counts, proper-noun trim names, etc.).
  labelKey?: TranslationKey;
  labelParams?: TranslationParams;
};

const CONTENT_ACTIONS: ReadonlySet<PointAction> = new Set([
  "encyclopedia_read",
  "news_read",
]);

const COMPARISON_ACTIONS: ReadonlySet<PointAction> = new Set(["comparison"]);

const BADGE_NAME_KEY: Record<string, TranslationKey> = {
  first_comparison: "badgesCatalog.firstComparisonName",
  market_observer: "badgesCatalog.marketObserverName",
  encyclopedia_reader: "badgesCatalog.encyclopediaReaderName",
  qa_participant: "badgesCatalog.qaParticipantName",
  official_offer_received: "badgesCatalog.officialOfferReceivedName",
};

const LEAD_STATE_KEY: Record<string, TranslationKey> = {
  draft: "leadStates.draft",
  submitted: "leadStates.submitted",
  dealer_opened: "leadStates.dealerOpened",
  official_offer: "leadStates.officialOffer",
  test_drive_requested: "leadStates.testDriveRequested",
  test_drive_confirmed: "leadStates.testDriveConfirmed",
  whatsapp_handoff: "leadStates.whatsappHandoff",
  expired: "leadStates.expired",
  no_response: "leadStates.noResponse",
  second_offer: "leadStates.secondOffer",
  accepted: "leadStates.accepted",
  closed: "leadStates.closed",
};

export function listProfileActivity(userId: string): ActivityItem[] {
  const out: ActivityItem[] = [];

  for (const v of listUserVotes(userId)) {
    const topic = getTopic(v.topic_id);
    const rawOption = topic?.options.find((o) => o.option_id === v.option_id);
    const optionLabel = rawOption
      ? getLocalizedText(rawOption.label, DEFAULT_LOCALE)
      : v.option_id;
    const questionLabel = topic
      ? getLocalizedText(topic.question, DEFAULT_LOCALE)
      : null;
    out.push({
      id: `vote:${v.vote_id}`,
      kind: "vote",
      label: "Bazar Nəbzində səs verdin",
      detail: questionLabel ? `${questionLabel} — ${optionLabel}` : optionLabel,
      at: v.created_at,
      labelKey: "activity.voteCast",
    });
  }

  for (const b of listUserBadges(userId)) {
    const def = BADGE_CATALOGUE[b.badge_id];
    const nameKey = BADGE_NAME_KEY[b.badge_id];
    out.push({
      id: `badge:${b.badge_grant_id}`,
      kind: "badge",
      label: `Nişan qazandın: ${def.name}`,
      detail: def.description,
      at: b.granted_at,
      labelKey: "activity.badgeEarned",
      // Render the badge name through its translation key on the client.
      // The client will look up the name via nameKey instead of using the
      // raw {name} param. We still pass a default AZ name for legacy.
      labelParams: { name: def.name, nameKey: nameKey ?? "" },
    });
  }

  for (const p of listUserPointGrants(userId)) {
    if (p.reversed_at) continue;
    const kind: ActivityItem["kind"] = CONTENT_ACTIONS.has(p.action)
      ? "content"
      : COMPARISON_ACTIONS.has(p.action)
        ? "comparison"
        : "point";
    out.push({
      id: `point:${p.point_grant_id}`,
      kind,
      label: POINT_ACTION_LABEL_AZ[p.action],
      detail: `+${p.points} bal`,
      at: p.granted_at,
      labelKey: POINT_ACTION_KEY_BY_ACTION[p.action],
      labelParams: { points: p.points },
    });
  }

  for (const s of listSavedForUser(userId)) {
    const t = trimSummaryFor(s.trim_id);
    out.push({
      id: `saved:${s.saved_id}`,
      kind: "saved",
      label: "Maşın saxladın",
      detail: t.display_name,
      at: s.created_at,
      labelKey: "activity.savedCar",
    });
  }

  for (const v of listViewedForUser(userId)) {
    const t = trimSummaryFor(v.trim_id);
    out.push({
      id: `viewed:${v.viewed_id}`,
      kind: "viewed",
      label: "Maşına baxdın",
      detail: t.display_name,
      at: v.viewed_at,
      labelKey: "activity.viewedCar",
    });
  }

  for (const lead of listLeadsForUser(userId)) {
    const trim = trimSummaryFor(lead.trim_id);
    out.push({
      id: `lead:${lead.lead_id}`,
      kind: "lead",
      label: "Sorğu göndərdin",
      detail: trim.display_name,
      at: lead.created_at,
      labelKey: "activity.leadSubmitted",
    });
    for (const event of getTimelineForLead(lead.lead_id)) {
      if (!event.to_state) continue;
      // The "lead_submitted" entry duplicates the lead-create item above; skip.
      if (event.to_state === "submitted") continue;
      out.push({
        id: `lead_status:${event.event_id}`,
        kind: "lead_status",
        label: `Sorğu vəziyyəti: ${LEAD_STATE_LABELS_AZ[event.to_state]}`,
        detail: trim.display_name,
        at: event.created_at,
        labelKey: "activity.leadStatusChanged",
        labelParams: {
          state: LEAD_STATE_LABELS_AZ[event.to_state],
          stateKey: LEAD_STATE_KEY[event.to_state] ?? "",
        },
      });
    }
  }

  out.sort((a, b) => b.at - a.at);
  return out;
}
