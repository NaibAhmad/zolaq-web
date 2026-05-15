import {
  ENCYCLOPEDIA_ENTRIES,
  NEWS_ARTICLES,
  QA_ENTRIES,
} from "./seed";
import type { EncyclopediaEntry, NewsArticle, QAEntry } from "./types";

export function listNews(): readonly NewsArticle[] {
  return NEWS_ARTICLES;
}

export function getNewsBySlug(slug: string): NewsArticle | null {
  return NEWS_ARTICLES.find((n) => n.slug === slug) ?? null;
}

export function listEncyclopedia(): readonly EncyclopediaEntry[] {
  return ENCYCLOPEDIA_ENTRIES;
}

export function getEncyclopediaBySlug(slug: string): EncyclopediaEntry | null {
  return ENCYCLOPEDIA_ENTRIES.find((e) => e.slug === slug) ?? null;
}

export function listQA(): readonly QAEntry[] {
  return QA_ENTRIES;
}

export function getQAById(id: string): QAEntry | null {
  return QA_ENTRIES.find((q) => q.id === id) ?? null;
}
