// Public-facing content lookup. Sprint 8D: now delegates to the admin store
// (which is bootstrapped from the same seed at startup) so admin-created
// entries are visible on the public site and draft/unpublished entries are
// filtered out. The function shapes remain unchanged.

import {
  getEncyclopediaBySlug as adminGetEncyclopediaBySlug,
  getNewsBySlug as adminGetNewsBySlug,
  listPublishedEncyclopedia,
  listPublishedNews,
  listPublishedQA,
} from "./admin-store";
import { QA_ENTRIES } from "./seed";
import type { EncyclopediaEntry, NewsArticle, QAEntry } from "./types";

export function listNews(): readonly NewsArticle[] {
  return listPublishedNews();
}

export function getNewsBySlug(slug: string): NewsArticle | null {
  const found = adminGetNewsBySlug(slug);
  if (!found) return null;
  return found.status === "published" ? found : null;
}

export function listEncyclopedia(): readonly EncyclopediaEntry[] {
  return listPublishedEncyclopedia();
}

export function getEncyclopediaBySlug(slug: string): EncyclopediaEntry | null {
  const found = adminGetEncyclopediaBySlug(slug);
  if (!found) return null;
  return found.status === "published" ? found : null;
}

export function listQA(): readonly QAEntry[] {
  return listPublishedQA();
}

// Q&A entries are keyed publicly by `id` (e.g., "qa-001"), not by content_id.
// Admin store keys by content_id; we resolve via the seed for ID → content_id.
export function getQAById(id: string): QAEntry | null {
  const seed = QA_ENTRIES.find((q) => q.id === id);
  if (!seed) return null;
  const published = listPublishedQA().find(
    (q) => q.content_id === seed.content_id,
  );
  return published ?? null;
}
