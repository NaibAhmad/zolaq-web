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

type ContentBase = {
  title: string;
  summary: string;
  body: string;
  related_trim_ids: readonly string[];
  published_at: number;
};

export type NewsArticle = ContentBase & {
  content_id: string;
  type: "news";
  slug: string;
  source_name?: string;
};

export type EncyclopediaEntry = ContentBase & {
  content_id: string;
  type: "encyclopedia";
  slug: string;
  topic_tags?: readonly string[];
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
