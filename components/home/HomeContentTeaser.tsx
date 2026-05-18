import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  ENCYCLOPEDIA_ENTRIES,
  NEWS_ARTICLES,
  QA_ENTRIES,
} from "@/lib/content/seed";
import { formatDateAz } from "@/lib/format/date";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { getLocalizedText } from "@/lib/i18n/localized";
import { ROUTES } from "@/lib/routes";

export async function HomeContentTeaser() {
  const t = await getServerT();
  const locale = await getServerLocale();
  const news = NEWS_ARTICLES[0];
  const enc = ENCYCLOPEDIA_ENTRIES[0];
  const qa = QA_ENTRIES[0];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow={t("homeContentTeaser.eyebrow")}
        title={t("homeContentTeaser.title")}
        subtitle={t("homeContentTeaser.subtitle")}
        action={{
          label: t("homeContentTeaser.viewAll"),
          href: ROUTES.encyclopedia,
        }}
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
                {t("homeContentTeaser.newsBadge")}
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                {getLocalizedText(news.title, locale)}
              </h3>
              <p className="text-sm text-foreground-muted">
                {getLocalizedText(news.summary, locale)}
              </p>
              <p className="mt-auto text-xs text-foreground-muted">
                {formatDateAz(news.published_at)}
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
                {t("homeContentTeaser.encyclopediaBadge")}
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                {getLocalizedText(enc.title, locale)}
              </h3>
              <p className="text-sm text-foreground-muted">
                {getLocalizedText(enc.summary, locale)}
              </p>
              <p className="mt-auto text-xs text-foreground-muted">
                {formatDateAz(enc.published_at)}
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
                {t("homeContentTeaser.qaBadge")}
              </Badge>
              <h3 className="text-base font-semibold text-foreground">
                {getLocalizedText(qa.question, locale)}
              </h3>
              <p className="text-sm text-foreground-muted">
                {getLocalizedText(qa.answer, locale).slice(0, 140)}…
              </p>
              <p className="mt-auto text-xs text-foreground-muted">
                {formatDateAz(qa.published_at)}
              </p>
            </Card>
          </Link>
        </li>
      </ul>
    </div>
  );
}
