import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ContentCoverImage } from "@/components/content/ContentCoverImage";

type CategoryTone = "blue" | "orange" | "success";

type Props = {
  href: string;
  title: string;
  excerpt: string;
  publishedAt: number;
  category: { label: string; tone: CategoryTone };
  cover: {
    src?: string;
    alt: string;
    moduleLabel?: "Ensiklopediya" | "Xəbər";
  };
  hasRelatedModel?: boolean;
  dateLabel?: string;
};

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function RichContentCard({
  href,
  title,
  excerpt,
  publishedAt,
  category,
  cover,
  hasRelatedModel = false,
  dateLabel = "Yenilənib",
}: Props) {
  return (
    <Link href={href} aria-label={title} className="block h-full">
      <Card
        padding="md"
        tone="raised"
        interactive
        className="flex h-full flex-col gap-3"
      >
        <div className="-m-4 mb-1">
          <ContentCoverImage
            src={cover.src}
            alt={cover.alt}
            aspect="16/9"
            categoryLabel={category.label}
            moduleLabel={cover.moduleLabel}
            className="rounded-b-none rounded-t-[var(--radius-lg)]"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <Badge tone={category.tone} size="sm" className="self-start">
            {category.label}
          </Badge>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
            {title}
          </h3>
          <p className="line-clamp-2 text-sm text-foreground-muted">
            {excerpt}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <time
              dateTime={new Date(publishedAt).toISOString()}
              className="text-xs text-foreground-muted"
            >
              {dateLabel} {DATE_FMT.format(publishedAt)}
            </time>
            <Badge tone={hasRelatedModel ? "orange" : "muted"} size="sm">
              {hasRelatedModel ? "Modelə bağlı" : "Ümumi"}
            </Badge>
          </div>
          <span className="text-sm font-medium text-accent-blue">
            Davam et →
          </span>
        </div>
      </Card>
    </Link>
  );
}
