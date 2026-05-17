// Content domain types. Sprint 6. News / Encyclopedia / Q&A share a small set
// of fields. Each entry references existing trim_ids via `related_trim_ids` —
// this drives the content → related model → lead flow on detail pages.

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
  title: string;
  summary: string;
  body: string;
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

export type EncyclopediaStat = { label: string; value: string };

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
  excerpt?: string;
  related_model_reason?: string;
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
  excerpt?: string;
  related_model_reason?: string;
};

export type QAEntry = {
  content_id: string;
  type: "qa";
  id: string;
  question: string;
  answer: string;
  related_trim_ids: readonly string[];
  published_at: number;
};
