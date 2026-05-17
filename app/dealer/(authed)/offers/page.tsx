import Link from "next/link";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { listPrices, listTrims } from "@/lib/admin";
import { getDealerSession } from "@/lib/auth/dealer-session";

export default async function DealerOffersPage() {
  const session = (await getDealerSession())!;
  const offers = listPrices({ dealer_id: session.dealerId, offers_only: true });
  const trims = listTrims();
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mənim təkliflərim</h1>
        <ButtonLink href="/dealer/offers/new">Yeni təklif</ButtonLink>
      </header>
      <AdminTable
        rows={offers}
        rowKey={(o) => o.price_id}
        empty="Hələ təklif yoxdur. Yuxarıdakı düymə ilə yarat."
        columns={[
          {
            key: "trim",
            header: "Komplektasiya",
            cell: (o) => (
              <Link href={`/dealer/offers/${o.offer_id ?? o.price_id}`} className="font-medium hover:underline">
                {trims.find((t) => t.trim_id === o.trim_id)?.display_name ?? o.trim_id}
              </Link>
            ),
          },
          {
            key: "amount",
            header: "Məbləğ",
            cell: (o) => `${o.amount.toLocaleString("az-AZ")} ${o.currency}`,
          },
          { key: "status", header: "Status", cell: (o) => (o.offer_status ? <StatusBadge status={o.offer_status} /> : "—") },
          { key: "valid", header: "Bitir", cell: (o) => o.valid_until ?? "—" },
          { key: "note", header: "Reviewer qeydi", cell: (o) => o.review_note ?? "—" },
        ]}
      />
    </div>
  );
}
