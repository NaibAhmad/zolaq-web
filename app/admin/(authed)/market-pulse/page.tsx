import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { aggregateTopic, listTopics } from "@/lib/market-pulse/store";
import type { TranslationKey } from "@/lib/i18n/types";
import type { BazarCadence, BazarTopicStatus } from "@/lib/market-pulse/types";

const TONE: Record<BazarTopicStatus, "muted" | "warning" | "success" | "blue" | "danger"> = {
  draft: "muted",
  sponsored_pending_approval: "warning",
  active: "success",
  closed: "blue",
  resolved: "success",
  archived: "muted",
  rejected: "danger",
};

const CADENCE_KEY: Record<BazarCadence, TranslationKey> = {
  daily: "adminContent.cadenceDaily",
  weekly: "adminContent.cadenceWeekly",
  monthly: "adminContent.cadenceMonthly",
};

const STATUS_KEY: Record<BazarTopicStatus, TranslationKey> = {
  draft: "adminContent.bazarDraft",
  sponsored_pending_approval: "adminContent.bazarSponsoredPending",
  active: "adminContent.bazarActive",
  closed: "adminContent.bazarClosed",
  resolved: "adminContent.bazarResolved",
  archived: "adminContent.bazarArchived",
  rejected: "adminContent.bazarRejected",
};

export default async function AdminMarketPulsePage() {
  const topics = listTopics();
  const t = await getServerT();
  const locale = await getServerLocale();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("adminContent.marketPulseTitle")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("adminContent.marketPulseDescription")}
          </p>
        </div>
        <ButtonLink href="/admin/market-pulse/new">{t("adminContent.newTopic")}</ButtonLink>
      </header>
      <AdminTable
        rows={topics}
        rowKey={(row) => row.topic_id}
        empty={t("adminContent.emptyTopics")}
        columns={[
          {
            key: "question",
            header: t("adminContent.question"),
            cell: (row) => (
              <Link
                href={`/admin/market-pulse/${row.topic_id}`}
                className="font-medium hover:underline"
              >
                {getLocalizedText(row.question, locale)}
                {row.sponsored ? (
                  <Badge tone="orange" size="sm" className="ml-2">
                    {t("adminContent.sponsored")}
                  </Badge>
                ) : null}
              </Link>
            ),
          },
          {
            key: "cadence",
            header: t("adminContent.cadence"),
            cell: (row) => t(CADENCE_KEY[row.cadence]),
          },
          {
            key: "window",
            header: t("adminContent.window"),
            cell: (row) => `${row.start_date} → ${row.end_date}`,
          },
          {
            key: "participants",
            header: t("adminContent.participants"),
            cell: (row) => aggregateTopic(row.topic_id)?.total ?? 0,
          },
          {
            key: "status",
            header: t("adminContent.statusCol"),
            cell: (row) => (
              <Badge tone={TONE[row.status]} size="sm">
                {t(STATUS_KEY[row.status])}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
