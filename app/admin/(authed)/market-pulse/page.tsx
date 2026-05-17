import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { aggregateTopic, listTopics } from "@/lib/market-pulse/store";
import {
  BAZAR_CADENCE_LABEL_AZ,
  BAZAR_STATUS_LABEL_AZ,
  type BazarTopicStatus,
} from "@/lib/market-pulse/types";

const TONE: Record<BazarTopicStatus, "muted" | "warning" | "success" | "blue" | "danger"> = {
  draft: "muted",
  sponsored_pending_approval: "warning",
  active: "success",
  closed: "blue",
  resolved: "success",
  archived: "muted",
  rejected: "danger",
};

export default function AdminMarketPulsePage() {
  const topics = listTopics();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Bazar Nəbzi</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Günlük / həftəlik / aylıq icma proqnozları. Mərc, qumar və ya pul
            mükafatı yoxdur — yalnız iştirakçı səsi və açıq nəticə.
          </p>
        </div>
        <ButtonLink href="/admin/market-pulse/new">Yeni mövzu</ButtonLink>
      </header>
      <AdminTable
        rows={topics}
        rowKey={(t) => t.topic_id}
        empty="Hələ mövzu yoxdur."
        columns={[
          {
            key: "question",
            header: "Sual",
            cell: (t) => (
              <Link
                href={`/admin/market-pulse/${t.topic_id}`}
                className="font-medium hover:underline"
              >
                {t.question}
                {t.sponsored ? (
                  <Badge tone="orange" size="sm" className="ml-2">
                    Sponsorlu
                  </Badge>
                ) : null}
              </Link>
            ),
          },
          {
            key: "cadence",
            header: "Tezlik",
            cell: (t) => BAZAR_CADENCE_LABEL_AZ[t.cadence],
          },
          {
            key: "window",
            header: "Pəncərə",
            cell: (t) => `${t.start_date} → ${t.end_date}`,
          },
          {
            key: "participants",
            header: "İştirakçı",
            cell: (t) => aggregateTopic(t.topic_id)?.total ?? 0,
          },
          {
            key: "status",
            header: "Status",
            cell: (t) => (
              <Badge tone={TONE[t.status]} size="sm">
                {BAZAR_STATUS_LABEL_AZ[t.status]}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
