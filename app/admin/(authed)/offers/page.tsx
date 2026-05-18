import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { listDealers, listPrices, listTrims } from "@/lib/admin";
import { listSubmissions } from "@/lib/dealer/submissions/store";
import { formatDateTimeAz } from "@/lib/format/date";

export default function AdminOffersPage() {
  const offers = listPrices({ offers_only: true });
  const submissions = listSubmissions({
    kind: undefined,
    status: ["submitted", "under_review", "needs_revision"],
  }).filter((s) => s.kind === "offer_create" || s.kind === "offer_update");
  const trims = listTrims();
  const dealers = listDealers();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Diler təklifləri</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Müraciət növbəsi ({submissions.length})
        </h2>
        <AdminTable
          rows={submissions}
          rowKey={(s) => s.submission_id}
          empty="Yoxlanılacaq müraciət yoxdur."
          columns={[
            {
              key: "id",
              header: "Müraciət",
              cell: (s) => (
                <Link href={`/admin/offers/sub/${s.submission_id}`} className="font-medium hover:underline">
                  {s.kind}
                </Link>
              ),
            },
            {
              key: "dealer",
              header: "Diler",
              cell: (s) =>
                dealers.find((d) => d.dealer_id === s.dealer_id)?.display_name ?? s.dealer_id,
            },
            {
              key: "trim",
              header: "Komplektasiya",
              cell: (s) => {
                const tid = (s.payload as { trim_id?: string }).trim_id;
                return tid ? trims.find((t) => t.trim_id === tid)?.display_name ?? tid : "—";
              },
            },
            {
              key: "status",
              header: "Status",
              cell: (s) => <StatusBadge status={s.status} />,
            },
            {
              key: "submitted",
              header: "Göndərildi",
              cell: (s) => formatDateTimeAz(s.created_at),
            },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Bütün təkliflər ({offers.length})
        </h2>
        <AdminTable
          rows={offers}
          rowKey={(o) => o.price_id}
          empty="Hələ təklif yoxdur."
          columns={[
            {
              key: "trim",
              header: "Komplektasiya",
              cell: (o) => (
                <Link href={`/admin/offers/${o.offer_id ?? o.price_id}`} className="font-medium hover:underline">
                  {trims.find((t) => t.trim_id === o.trim_id)?.display_name ?? o.trim_id}
                </Link>
              ),
            },
            {
              key: "dealer",
              header: "Diler",
              cell: (o) =>
                dealers.find((d) => d.dealer_id === o.dealer_id)?.display_name ?? o.dealer_id ?? "—",
            },
            {
              key: "amount",
              header: "Məbləğ",
              cell: (o) => `${o.amount.toLocaleString("az-AZ")} ${o.currency}`,
            },
            {
              key: "status",
              header: "Status",
              cell: (o) => (o.offer_status ? <StatusBadge status={o.offer_status} /> : "—"),
            },
            { key: "valid_until", header: "Bitir", cell: (o) => o.valid_until ?? "—" },
          ]}
        />
      </section>
    </div>
  );
}
