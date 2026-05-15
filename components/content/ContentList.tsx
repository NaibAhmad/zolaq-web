import Link from "next/link";
import { EmptyState } from "@/components/state/EmptyState";

export type ContentListItem = {
  key: string;
  href: string;
  title: string;
  summary: string;
  publishedAt: number;
};

type Props = {
  heading: string;
  intro?: string;
  emptyTitle: string;
  emptyNote?: string;
  items: readonly ContentListItem[];
};

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function ContentList({
  heading,
  intro,
  emptyTitle,
  emptyNote,
  items,
}: Props) {
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{heading}</h1>
        {intro ? (
          <p className="text-sm text-foreground-muted">{intro}</p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <EmptyState title={emptyTitle} note={emptyNote} />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface-elevated p-4 hover:bg-surface"
              >
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-sm text-foreground-muted">{item.summary}</p>
                <time
                  dateTime={new Date(item.publishedAt).toISOString()}
                  className="text-xs text-foreground-muted"
                >
                  {DATE_FMT.format(item.publishedAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
