// Content domain types. Sprint 6. News / Encyclopedia / Q&A share a small set
// of fields. Each entry references existing trim_ids via `related_trim_ids` —
// this drives the content → related model → lead flow on detail pages.
// Sprint 10I-D: title/summary/body/excerpt/question/answer accept LocalizedText
// so demo seed content can carry AZ/EN/RU strings. Plain strings stay valid
// for admin-authored content that hasn't been translated yet (the renderer
// falls back to the AZ source via getLocalizedText).

import type { LocalizedText } from "@/lib/i18n/localized";

export const CONTENT_TYPES = ["news", "encyclopedia", "qa"] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export function isContentType(value: unknown): value is ContentType {
  return (
    typeof value === "string" &&
    (CONTENT_TYPES as readonly string[]).includes(value)
  );
}

// Sprint 8D: content lifecycle. Existing seed entries default to "published"
// when loaded into the admin store. Public reads filter to "published" only.
export const CONTENT_STATUSES = ["draft", "published", "unpublished"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export function isContentStatus(value: unknown): value is ContentStatus {
  return (
    typeof value === "string" &&
    (CONTENT_STATUSES as readonly string[]).includes(value)
  );
}

type ContentBase = {
  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedText;
  related_trim_ids: readonly string[];
  published_at: number;
  status?: ContentStatus;
};

export const ENCYCLOPEDIA_CATEGORIES = [
  "tech",
  "battery",
  "driving",
  "finance",
  "charging",
  "insurance",
] as const;

export type EncyclopediaCategory = (typeof ENCYCLOPEDIA_CATEGORIES)[number];

export function isEncyclopediaCategory(
  value: unknown,
): value is EncyclopediaCategory {
  return (
    typeof value === "string" &&
    (ENCYCLOPEDIA_CATEGORIES as readonly string[]).includes(value)
  );
}

export type EncyclopediaStat = { label: LocalizedText; value: LocalizedText };

export type EncyclopediaSource = {
  name: string;
  source_count: number;
  verified: boolean;
};

export type NewsArticle = ContentBase & {
  content_id: string;
  type: "news";
  slug: string;
  source_name?: string;
  category?: string;
  image_url?: string;
  image_alt?: string;
  excerpt?: LocalizedText;
  related_model_reason?: LocalizedText;
};

export type EncyclopediaEntry = ContentBase & {
  content_id: string;
  type: "encyclopedia";
  slug: string;
  topic_tags?: readonly string[];
  category?: EncyclopediaCategory;
  stats?: readonly EncyclopediaStat[];
  source?: EncyclopediaSource;
  image_url?: string;
  image_alt?: string;
  excerpt?: LocalizedText;
  related_model_reason?: LocalizedText;
};

export type QAEntry = {
  content_id: string;
  type: "qa";
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
  related_trim_ids: readonly string[];
  published_at: number;
};
