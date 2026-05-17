import Link from "next/link";
import { EmptyState } from "@/components/state/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

export type ContentListItem = {
  key: string;
  href: string;
  title: string;
  summary: string;
  publishedAt: number;
};

type Props = {
  heading: string;
  eyebrow: string;
  intro?: string;
  emptyTitle: string;
  emptyNote?: string;
  items: readonly ContentListItem[];
  cardTone?: "blue" | "orange" | "success";
  cardLabel?: string;
};

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function ContentList({
  heading,
  eyebrow,
  intro,
  emptyTitle,
  emptyNote,
  items,
  cardTone = "blue",
  cardLabel,
}: Props) {
  return (
    <>
      <Section tone="muted" padding="sm">
        <Container>
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            subtitle={intro}
          />
          {cardLabel ? (
            <div className="mt-4">
              <Badge tone={cardTone} size="md">
                {items.length} {cardLabel}
              </Badge>
            </div>
          ) : null}
        </Container>
      </Section>

      <Section tone="light" padding="md">
        <Container>
          {items.length === 0 ? (
            <EmptyState title={emptyTitle} note={emptyNote} />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="block h-full">
                    <Card
                      padding="md"
                      tone="raised"
                      interactive
                      className="flex h-full flex-col gap-3"
                    >
                      {cardLabel ? (
                        <Badge tone={cardTone} size="sm">
                          {cardLabel}
                        </Badge>
                      ) : null}
                      <h3 className="text-base font-semibold leading-snug text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        {item.summary}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <time
                          dateTime={new Date(item.publishedAt).toISOString()}
                          className="text-xs text-foreground-muted"
                        >
                          {DATE_FMT.format(item.publishedAt)}
                        </time>
                        <span className="text-sm font-medium text-accent-blue">
                          Davam et →
                        </span>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
