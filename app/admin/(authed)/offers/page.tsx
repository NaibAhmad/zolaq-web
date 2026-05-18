import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { listDealers, listPrices, listTrims } from "@/lib/admin";
import { listSubmissions } from "@/lib/dealer/submissions/store";
import { formatDateTimeAz } from "@/lib/format/date";
import { getServerT } from "@/lib/i18n/server";

export default async function AdminOffersPage() {
  const offers = listPrices({ offers_only: true });
  const submissions = listSubmissions({
    kind: undefined,
    status: ["submitted", "under_review", "needs_revision"],
  }).filter((s) => s.kind === "offer_create" || s.kind === "offer_update");
  const trims = listTrims();
  const dealers = listDealers();
  const t = await getServerT();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("adminOffers.title")}</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          {t("adminOffers.queueSectionTitle", { count: submissions.length })}
        </h2>
        <AdminTable
          rows={submissions}
          rowKey={(s) => s.submission_id}
          empty={t("adminOffers.queueEmpty")}
          columns={[
            {
              key: "id",
              header: t("adminOffers.submissionLabel"),
              cell: (s) => (
                <Link href={`/admin/offers/sub/${s.submission_id}`} className="font-medium hover:underline">
                  {s.kind}
                </Link>
              ),
            },
            {
              key: "dealer",
              header: t("adminOffers.dealerCol"),
              cell: (s) =>
                dealers.find((d) => d.dealer_id === s.dealer_id)?.display_name ?? s.dealer_id,
            },
            {
              key: "trim",
              header: t("adminOffers.trimCol"),
              cell: (s) => {
                const tid = (s.payload as { trim_id?: string }).trim_id;
                return tid ? trims.find((tr) => tr.trim_id === tid)?.display_name ?? tid : "—";
              },
            },
            {
              key: "status",
              header: t("adminOffers.statusCol"),
              cell: (s) => <StatusBadge status={s.status} />,
            },
            {
              key: "submitted",
              header: t("adminOffers.submittedCol"),
              cell: (s) => formatDateTimeAz(s.created_at),
            },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          {t("adminOffers.allOffersTitle", { count: offers.length })}
        </h2>
        <AdminTable
          rows={offers}
          rowKey={(o) => o.price_id}
          empty={t("adminOffers.emptyAllOffers")}
          columns={[
            {
              key: "trim",
              header: t("adminOffers.trimCol"),
              cell: (o) => (
                <Link href={`/admin/offers/${o.offer_id ?? o.price_id}`} className="font-medium hover:underline">
                  {trims.find((tr) => tr.trim_id === o.trim_id)?.display_name ?? o.trim_id}
                </Link>
              ),
            },
            {
              key: "dealer",
              header: t("adminOffers.dealerCol"),
              cell: (o) =>
                dealers.find((d) => d.dealer_id === o.dealer_id)?.display_name ?? o.dealer_id ?? "—",
            },
            {
              key: "amount",
              header: t("adminOffers.amountCol"),
              cell: (o) => `${o.amount.toLocaleString("az-AZ")} ${o.currency}`,
            },
            {
              key: "status",
              header: t("adminOffers.statusCol"),
              cell: (o) => (o.offer_status ? <StatusBadge status={o.offer_status} /> : "—"),
            },
            {
              key: "valid_until",
              header: t("adminOffers.validUntilCol"),
              cell: (o) => o.valid_until ?? "—",
            },
          ]}
        />
      </section>
    </div>
  );
}
