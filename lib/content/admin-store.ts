// Sprint 8D content admin store. Wraps the existing seed
// (lib/content/seed.ts) in mutable globalThis Maps. Public content readers
// (lib/content/queries.ts or equivalent) keep their own paths; this store is
// used by /admin/content/* and /api/internal/content/* and exposes filtered
// helpers for public reads that should only see "published" entries.

import { randomUUID } from "node:crypto";
import {
  ENCYCLOPEDIA_ENTRIES,
  NEWS_ARTICLES,
  QA_ENTRIES,
} from "./seed";
import type {
  ContentStatus,
  EncyclopediaEntry,
  NewsArticle,
  QAEntry,
} from "./types";

type ContentStore = {
  news: Map<string, NewsArticle>;
  encyclopedia: Map<string, EncyclopediaEntry>;
  qa: Map<string, QAEntry & { status?: ContentStatus }>;
};

function bootstrap(): ContentStore {
  const news = new Map<string, NewsArticle>();
  for (const n of NEWS_ARTICLES) {
    news.set(n.content_id, { ...n, status: n.status ?? "published" });
  }
  const encyclopedia = new Map<string, EncyclopediaEntry>();
  for (const e of ENCYCLOPEDIA_ENTRIES) {
    encyclopedia.set(e.content_id, { ...e, status: e.status ?? "published" });
  }
  const qa = new Map<string, QAEntry & { status?: ContentStatus }>();
  for (const q of QA_ENTRIES) {
    qa.set(q.content_id, { ...q, status: "published" });
  }
  return { news, encyclopedia, qa };
}

const g = globalThis as unknown as { __zlq_content_store?: ContentStore };
const store: ContentStore =
  g.__zlq_content_store ?? (g.__zlq_content_store = bootstrap());

// ---------- News ----------
export function listNews(filter?: { status?: ContentStatus }): NewsArticle[] {
  let rows = Array.from(store.news.values());
  if (filter?.status) rows = rows.filter((n) => n.status === filter.status);
  rows.sort((a, b) => b.published_at - a.published_at);
  return rows.map((n) => ({ ...n }));
}
export function listPublishedNews(): NewsArticle[] {
  return listNews({ status: "published" });
}
export function getNews(contentId: string): NewsArticle | null {
  const n = store.news.get(contentId);
  return n ? { ...n } : null;
}
export function getNewsBySlug(slug: string): NewsArticle | null {
  for (const n of store.news.values()) {
    if (n.slug === slug) return { ...n };
  }
  return null;
}

export type CreateNewsInput = Omit<NewsArticle, "content_id" | "type"> & {
  content_id?: string;
};
export function createNews(input: CreateNewsInput): NewsArticle {
  const content_id = input.content_id ?? `news_${randomUUID()}`;
  const n: NewsArticle = {
    ...input,
    content_id,
    type: "news",
    status: input.status ?? "draft",
  };
  store.news.set(content_id, n);
  return { ...n };
}
export function updateNews(
  contentId: string,
  patch: Partial<Omit<NewsArticle, "content_id" | "type">>,
): NewsArticle | null {
  const n = store.news.get(contentId);
  if (!n) return null;
  const next: NewsArticle = { ...n, ...patch };
  store.news.set(contentId, next);
  return { ...next };
}

// ---------- Encyclopedia ----------
export function listEncyclopedia(filter?: {
  status?: ContentStatus;
}): EncyclopediaEntry[] {
  let rows = Array.from(store.encyclopedia.values());
  if (filter?.status) rows = rows.filter((e) => e.status === filter.status);
  rows.sort((a, b) => b.published_at - a.published_at);
  return rows.map((e) => ({ ...e }));
}
export function listPublishedEncyclopedia(): EncyclopediaEntry[] {
  return listEncyclopedia({ status: "published" });
}
export function getEncyclopedia(contentId: string): EncyclopediaEntry | null {
  const e = store.encyclopedia.get(contentId);
  return e ? { ...e } : null;
}
export function getEncyclopediaBySlug(slug: string): EncyclopediaEntry | null {
  for (const e of store.encyclopedia.values()) {
    if (e.slug === slug) return { ...e };
  }
  return null;
}

export type CreateEncyclopediaInput = Omit<EncyclopediaEntry, "content_id" | "type"> & {
  content_id?: string;
};
export function createEncyclopedia(
  input: CreateEncyclopediaInput,
): EncyclopediaEntry {
  const content_id = input.content_id ?? `enc_${randomUUID()}`;
  const e: EncyclopediaEntry = {
    ...input,
    content_id,
    type: "encyclopedia",
    status: input.status ?? "draft",
  };
  store.encyclopedia.set(content_id, e);
  return { ...e };
}
export function updateEncyclopedia(
  contentId: string,
  patch: Partial<Omit<EncyclopediaEntry, "content_id" | "type">>,
): EncyclopediaEntry | null {
  const e = store.encyclopedia.get(contentId);
  if (!e) return null;
  const next: EncyclopediaEntry = { ...e, ...patch };
  store.encyclopedia.set(contentId, next);
  return { ...next };
}

// ---------- Q&A ----------
export type QAAdminEntry = QAEntry & { status?: ContentStatus };

export function listQA(filter?: { status?: ContentStatus }): QAAdminEntry[] {
  let rows = Array.from(store.qa.values());
  if (filter?.status) rows = rows.filter((q) => q.status === filter.status);
  rows.sort((a, b) => b.published_at - a.published_at);
  return rows.map((q) => ({ ...q }));
}
export function listPublishedQA(): QAAdminEntry[] {
  return listQA({ status: "published" });
}
export function getQA(contentId: string): QAAdminEntry | null {
  const q = store.qa.get(contentId);
  return q ? { ...q } : null;
}
export function updateQA(
  contentId: string,
  patch: Partial<Omit<QAAdminEntry, "content_id" | "type">>,
): QAAdminEntry | null {
  const q = store.qa.get(contentId);
  if (!q) return null;
  const next: QAAdminEntry = { ...q, ...patch };
  store.qa.set(contentId, next);
  return { ...next };
}

export type CreateQAInput = Omit<QAEntry, "content_id" | "type"> & {
  content_id?: string;
  status?: ContentStatus;
};
export function createQA(input: CreateQAInput): QAAdminEntry {
  const content_id = input.content_id ?? `qa_${randomUUID()}`;
  const q: QAAdminEntry = {
    ...input,
    content_id,
    type: "qa",
    status: input.status ?? "draft",
  };
  store.qa.set(content_id, q);
  return { ...q };
}
