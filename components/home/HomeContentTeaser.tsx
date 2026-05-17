import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  ENCYCLOPEDIA_ENTRIES,
  NEWS_ARTICLES,
  QA_ENTRIES,
} from "@/lib/content/seed";
import { ROUTES } from "@/lib/routes";

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatDate(ts: number): string {
  return DATE_FMT.format(new Date(ts));
}

export function HomeContentTeaser() {
  const news = NEWS_ARTICLES[0];
  const enc = ENCYCLOPEDIA_ENTRIES[0];
  const qa = QA_ENTRIES[0];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Məzmun"
        title="Ensiklopediya, xəbərlər və Q&A"
        subtitle="Maşın seçimini dəstəkləyən praktik məqalələr."
        action={{ label: "Bütün ensiklopediya", href: ROUTES.encyclopedia }}
      />
      <ul className="grid gap-4 md:grid-cols-3">
        <li>
          <Link href={ROUTES.newsItem(news.slug)} className="block h-full">
            <Card
              padding="md"
              tone="raised"
              interactive
              className="flex h-full min-h-[200px] flex-col gap-3"
            >
              <Badge tone="blue" size="sm">
                Xəbər
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                {news.title}
              </h3>
              <p className="text-sm text-foreground-muted">{news.summary}</p>
              <p className="mt-auto text-xs text-foreground-muted">
                {formatDate(news.published_at)}
              </p>
            </Card>
          </Link>
        </li>
        <li>
          <Link
            href={ROUTES.encyclopediaItem(enc.slug)}
            className="block h-full"
          >
            <Card
              padding="md"
              tone="raised"
              interactive
              className="flex h-full min-h-[200px] flex-col gap-3"
            >
              <Badge tone="orange" size="sm">
                Ensiklopediya
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                {enc.title}
              </h3>
              <p className="text-sm text-foreground-muted">{enc.summary}</p>
              <p className="mt-auto text-xs text-foreground-muted">
                {formatDate(enc.published_at)}
              </p>
            </Card>
          </Link>
        </li>
        <li>
          <Link href={ROUTES.qaItem(qa.id)} className="block h-full">
            <Card
              padding="md"
              tone="raised"
              interactive
              className="flex h-full min-h-[200px] flex-col gap-3"
            >
              <Badge tone="success" size="sm">
                Q&A
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                {qa.question}
              </h3>
              <p className="text-sm text-foreground-muted">
                {qa.answer.slice(0, 140)}…
              </p>
              <p className="mt-auto text-xs text-foreground-muted">
                {formatDate(qa.published_at)}
              </p>
            </Card>
          </Link>
        </li>
      </ul>
    </div>
  );
}
