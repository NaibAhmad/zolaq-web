// Sprint 8F Bazar Nəbzi (market pulse). Lightweight community sentiment module.
// NOT gambling — no wager, no payout, no odds. Allowed verbs: səs ver,
// proqnoz ver, iştirak et. See docs/sprint-7j/MARKET_PULSE_MODULE.md.

export const BAZAR_CADENCES = ["daily", "weekly", "monthly"] as const;
export type BazarCadence = (typeof BAZAR_CADENCES)[number];

export const BAZAR_TOPIC_STATUSES = [
  "draft",
  "sponsored_pending_approval",
  "active",
  "closed",
  "resolved",
  "archived",
  "rejected",
] as const;
export type BazarTopicStatus = (typeof BAZAR_TOPIC_STATUSES)[number];

export type BazarOption = {
  option_id: string;
  label: string;
};

export type BazarTopic = {
  topic_id: string;
  question: string;
  cadence: BazarCadence;
  status: BazarTopicStatus;
  options: BazarOption[];
  start_date: string; // ISO yyyy-mm-dd
  end_date: string; // ISO yyyy-mm-dd
  sponsored: boolean;
  sponsor_ad_request_id?: string;
  sponsor_name?: string;
  market_summary?: string; // Zolaq market summary written at resolve time
  rejection_reason?: string;
  created_by: string;
  created_at: number;
  updated_at: number;
  closed_at?: number;
  resolved_at?: number;
  archived_at?: number;
};

export type BazarVote = {
  vote_id: string;
  topic_id: string;
  option_id: string;
  user_id: string;
  created_at: number;
  invalidated?: boolean;
};

export type BazarAggregate = {
  topic_id: string;
  options: ReadonlyArray<{
    option_id: string;
    label: string;
    count: number;
    pct: number;
  }>;
  total: number;
};

export const BAZAR_CADENCE_LABEL_AZ: Record<BazarCadence, string> = {
  daily: "Günlük",
  weekly: "Həftəlik",
  monthly: "Aylıq",
};

export const BAZAR_STATUS_LABEL_AZ: Record<BazarTopicStatus, string> = {
  draft: "Qaralama",
  sponsored_pending_approval: "Sponsorlu — yoxlamada",
  active: "Aktiv",
  closed: "Bağlı",
  resolved: "Yekunlaşıb",
  archived: "Arxiv",
  rejected: "Rədd edilib",
};
