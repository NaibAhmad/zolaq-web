// Sprint 8F P0-lite badge catalogue. Five badges ship at P0 per
// docs/sprint-7k/USER_BADGE_SYSTEM.md. Badges are owner-visible cosmetic
// chrome. They MUST NOT affect:
//   - Zolaq Recommendation
//   - DealerVerificationStatus
//   - PriceRecord.verified
//   - Decision Center step logic
//   - Lead routing
// No code outside this folder should branch on badge state.

import { randomUUID } from "node:crypto";
import { writeAudit } from "@/lib/admin/audit";
import type { TranslationKey } from "@/lib/i18n/types";

export const P0_BADGE_IDS = [
  "first_comparison",
  "market_observer",
  "encyclopedia_reader",
  "qa_participant",
  "official_offer_received",
] as const;
export type BadgeId = (typeof P0_BADGE_IDS)[number];

export type BadgeDefinition = {
  badge_id: BadgeId;
  name: string;
  description: string;
  trigger_hint: string;
  tier: "P0";
  // Sprint 10I-D: translation keys for client-side locale rendering.
  // The plain `name`/`description`/`trigger_hint` fields stay as AZ defaults.
  name_key: TranslationKey;
  description_key: TranslationKey;
  hint_key: TranslationKey;
};

export const BADGE_CATALOGUE: Record<BadgeId, BadgeDefinition> = {
  first_comparison: {
    badge_id: "first_comparison",
    name: "İlk müqayisə",
    description: "İki və daha çox maşının ilk müqayisəsinə görə.",
    trigger_hint: "Müqayisə alətində 2+ maşın seç.",
    tier: "P0",
    name_key: "badgesCatalog.firstComparisonName",
    description_key: "badgesCatalog.firstComparisonDescription",
    hint_key: "badgesCatalog.firstComparisonHint",
  },
  market_observer: {
    badge_id: "market_observer",
    name: "Bazar müşahidəçisi",
    description: "Bazar Nəbzində səs verdiyiniz üçün.",
    trigger_hint: "Aktiv Bazar Nəbzi sualında bir variant seç.",
    tier: "P0",
    name_key: "badgesCatalog.marketObserverName",
    description_key: "badgesCatalog.marketObserverDescription",
    hint_key: "badgesCatalog.marketObserverHint",
  },
  encyclopedia_reader: {
    badge_id: "encyclopedia_reader",
    name: "Ensiklopediya oxucusu",
    description: "Ensiklopediyada üç və daha çox məqalə oxuduğunuz üçün.",
    trigger_hint: "Ensiklopediya məqalələrini açın və oxuyun.",
    tier: "P0",
    name_key: "badgesCatalog.encyclopediaReaderName",
    description_key: "badgesCatalog.encyclopediaReaderDescription",
    hint_key: "badgesCatalog.encyclopediaReaderHint",
  },
  qa_participant: {
    badge_id: "qa_participant",
    name: "Q&A iştirakçısı",
    description: "Sual-cavabda iştirak etdiyiniz üçün.",
    trigger_hint: "Sual ver və ya təsdiq olunmuş cavab paylaş.",
    tier: "P0",
    name_key: "badgesCatalog.qaParticipantName",
    description_key: "badgesCatalog.qaParticipantDescription",
    hint_key: "badgesCatalog.qaParticipantHint",
  },
  official_offer_received: {
    badge_id: "official_offer_received",
    name: "Rəsmi təklif aldı",
    description: "Diler tərəfindən rəsmi təklif aldığınız üçün.",
    trigger_hint: "Sorğu göndər və dilerdən rəsmi qiymət təklifi al.",
    tier: "P0",
    name_key: "badgesCatalog.officialOfferReceivedName",
    description_key: "badgesCatalog.officialOfferReceivedDescription",
    hint_key: "badgesCatalog.officialOfferReceivedHint",
  },
};

export type UserBadgeGrant = {
  badge_grant_id: string;
  user_id: string;
  badge_id: BadgeId;
  granted_at: number;
};

type Store = { grants: Map<string, UserBadgeGrant> };
const g = globalThis as unknown as { __zlq_badges_store?: Store };
const store: Store =
  g.__zlq_badges_store ?? (g.__zlq_badges_store = { grants: new Map() });

export function grantBadge(userId: string, badgeId: BadgeId): UserBadgeGrant | null {
  // idempotent — one grant per (user, badge).
  for (const grant of store.grants.values()) {
    if (grant.user_id === userId && grant.badge_id === badgeId) {
      return { ...grant };
    }
  }
  const row: UserBadgeGrant = {
    badge_grant_id: `bdg_${randomUUID()}`,
    user_id: userId,
    badge_id: badgeId,
    granted_at: Date.now(),
  };
  store.grants.set(row.badge_grant_id, row);
  writeAudit({
    actor_type: "system",
    actor_id: userId,
    role: "customer",
    action: "badge.grant",
    entity_type: "user_badge",
    entity_id: row.badge_grant_id,
    after: { badge_id: badgeId },
  });
  return { ...row };
}

export function listUserBadges(userId: string): UserBadgeGrant[] {
  const rows: UserBadgeGrant[] = [];
  for (const g of store.grants.values()) {
    if (g.user_id === userId) rows.push({ ...g });
  }
  rows.sort((a, b) => b.granted_at - a.granted_at);
  return rows;
}

export function userHasBadge(userId: string, badgeId: BadgeId): boolean {
  for (const g of store.grants.values()) {
    if (g.user_id === userId && g.badge_id === badgeId) return true;
  }
  return false;
}
