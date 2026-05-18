"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/state/EmptyState";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { RichContentCard } from "@/components/content/RichContentCard";
import {
  ENCYCLOPEDIA_CATEGORY_ORDER,
  categoryLabel,
  encyclopediaAllLabel,
} from "@/lib/content/encyclopedia-categories";
import { useCurrentLocale, useT } from "@/lib/i18n/client";
import type { EncyclopediaCategory } from "@/lib/content/types";

export type EncyclopediaListItem = {
  key: string;
  href: string;
  title: string;
  excerpt: string;
  publishedAt: number;
  category?: EncyclopediaCategory;
  categoryLabel: string;
  hasRelatedModel: boolean;
  cover: { src?: string; alt: string };
};

type Filter = "all" | EncyclopediaCategory;

type Props = {
  items: readonly EncyclopediaListItem[];
};

export function EncyclopediaListClient({ items }: Props) {
  const t = useT();
  const locale = useCurrentLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (!q) return true;
      const haystack = `${item.title} ${item.excerpt}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, filter, query]);

  return (
    <>
      <Section tone="muted" padding="sm">
        <Container>
          <div className="inline-flex items-center rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-foreground-muted">
            {t("encyclopediaHero.eyebrow")}
          </div>
          <h1 className="mt-6 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            {t("encyclopediaHero.title")}
          </h1>

          <form
            role="search"
            aria-label={t("encyclopediaHero.searchAria")}
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-stretch"
          >
            <label className="relative flex flex-1 items-center">
              <span aria-hidden className="absolute left-4 text-foreground-muted">
                ⌕
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("encyclopediaHero.searchPlaceholder")}
                className="h-12 w-full rounded-[var(--radius-lg)] border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-brand px-6 text-sm font-semibold text-brand-fg transition-all hover:brightness-110 active:brightness-95"
            >
              {t("encyclopediaHero.searchSubmit")}
              <span aria-hidden>→</span>
            </button>
          </form>
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          <div
            role="tablist"
            aria-label={t("encyclopediaHero.categoriesAria")}
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          >
            <ChipButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              {encyclopediaAllLabel(locale)}
            </ChipButton>
            {ENCYCLOPEDIA_CATEGORY_ORDER.map((cat) => (
              <ChipButton
                key={cat}
                active={filter === cat}
                onClick={() => setFilter(cat)}
              >
                {categoryLabel(cat, locale)}
              </ChipButton>
            ))}
          </div>

          <div className="mt-8">
            {filtered.length === 0 ? (
              <EmptyState
                title={t("encyclopediaHero.emptyTitle")}
                note={t("encyclopediaHero.emptyNote")}
              />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <li key={item.key}>
                    <RichContentCard
                      href={item.href}
                      title={item.title}
                      excerpt={item.excerpt}
                      publishedAt={item.publishedAt}
                      category={{ label: item.categoryLabel, tone: "blue" }}
                      cover={{
                        src: item.cover.src,
                        alt: item.cover.alt,
                        moduleLabel: t("encyclopediaHero.moduleLabel"),
                      }}
                      hasRelatedModel={item.hasRelatedModel}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-foreground bg-foreground text-surface"
          : "border-border bg-surface text-foreground-soft hover:border-brand/30 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
